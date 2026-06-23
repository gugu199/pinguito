
-- Enum de roles
CREATE TYPE public.app_role AS ENUM ('autoridad', 'docente', 'centro_estudiantes', 'informatica');
CREATE TYPE public.aviso_categoria AS ENUM ('institucional', 'centro_estudiantes', 'familias');
CREATE TYPE public.evento_tipo AS ENUM ('examen', 'actividad', 'evento');
CREATE TYPE public.recurso_tipo AS ENUM ('apunte', 'guia', 'video', 'bibliografia');
CREATE TYPE public.especialidad_codigo AS ENUM ('ciclo_basico', 'informatica', 'alimentos', 'electronica');

-- updated_at helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre_completo TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "perfiles lectura autenticados" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "perfil propio update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "perfil propio insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ver roles propios" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.has_any_role(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id)
$$;

CREATE POLICY "autoridad gestiona roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'autoridad'))
  WITH CHECK (public.has_role(auth.uid(), 'autoridad'));

-- Invitations
CREATE TABLE public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL UNIQUE,
  role public.app_role NOT NULL,
  nota TEXT,
  usado_por UUID REFERENCES auth.users(id),
  usado_en TIMESTAMPTZ,
  expira_en TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invitations TO authenticated;
GRANT ALL ON public.invitations TO service_role;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "autoridad gestiona invitaciones" ON public.invitations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'autoridad'))
  WITH CHECK (public.has_role(auth.uid(), 'autoridad'));

-- Función para canjear código de invitación (usada al registrarse)
CREATE OR REPLACE FUNCTION public.canjear_invitacion(_codigo TEXT)
RETURNS public.app_role
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  inv RECORD;
BEGIN
  SELECT * INTO inv FROM public.invitations WHERE codigo = _codigo FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Código de invitación inválido'; END IF;
  IF inv.usado_por IS NOT NULL THEN RAISE EXCEPTION 'Código ya utilizado'; END IF;
  IF inv.expira_en IS NOT NULL AND inv.expira_en < now() THEN RAISE EXCEPTION 'Código expirado'; END IF;
  UPDATE public.invitations SET usado_por = auth.uid(), usado_en = now() WHERE id = inv.id;
  INSERT INTO public.user_roles (user_id, role) VALUES (auth.uid(), inv.role)
    ON CONFLICT (user_id, role) DO NOTHING;
  RETURN inv.role;
END;
$$;

-- Trigger para crear profile automáticamente y promover el primer usuario a autoridad
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  total_autoridades INT;
BEGIN
  INSERT INTO public.profiles (id, nombre_completo, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombre_completo', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  SELECT count(*) INTO total_autoridades FROM public.user_roles WHERE role = 'autoridad';
  IF total_autoridades = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'autoridad');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Avisos
CREATE TABLE public.avisos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  contenido TEXT NOT NULL,
  categoria public.aviso_categoria NOT NULL,
  destacado BOOLEAN NOT NULL DEFAULT false,
  autor_id UUID REFERENCES auth.users(id),
  publicado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.avisos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.avisos TO authenticated;
GRANT ALL ON public.avisos TO service_role;
ALTER TABLE public.avisos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "avisos lectura publica" ON public.avisos FOR SELECT USING (true);
CREATE POLICY "avisos insert autoridad docente" ON public.avisos FOR INSERT TO authenticated
  WITH CHECK (
    (categoria IN ('institucional','familias') AND (public.has_role(auth.uid(),'autoridad') OR public.has_role(auth.uid(),'docente')))
    OR (categoria = 'centro_estudiantes' AND public.has_role(auth.uid(),'centro_estudiantes'))
  );
CREATE POLICY "avisos update segun rol" ON public.avisos FOR UPDATE TO authenticated
  USING (
    (categoria IN ('institucional','familias') AND (public.has_role(auth.uid(),'autoridad') OR public.has_role(auth.uid(),'docente')))
    OR (categoria = 'centro_estudiantes' AND public.has_role(auth.uid(),'centro_estudiantes'))
  );
CREATE POLICY "avisos delete autoridad o autor" ON public.avisos FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'autoridad') OR autor_id = auth.uid());
CREATE TRIGGER trg_avisos_updated BEFORE UPDATE ON public.avisos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_avisos_publicado ON public.avisos (publicado_en DESC);
CREATE INDEX idx_avisos_categoria ON public.avisos (categoria);

-- Eventos calendario
CREATE TABLE public.eventos_calendario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descripcion TEXT,
  tipo public.evento_tipo NOT NULL,
  fecha_inicio TIMESTAMPTZ NOT NULL,
  fecha_fin TIMESTAMPTZ,
  autor_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.eventos_calendario TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.eventos_calendario TO authenticated;
GRANT ALL ON public.eventos_calendario TO service_role;
ALTER TABLE public.eventos_calendario ENABLE ROW LEVEL SECURITY;
CREATE POLICY "eventos lectura publica" ON public.eventos_calendario FOR SELECT USING (true);
CREATE POLICY "eventos gestion staff" ON public.eventos_calendario FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'autoridad') OR public.has_role(auth.uid(),'docente'))
  WITH CHECK (public.has_role(auth.uid(),'autoridad') OR public.has_role(auth.uid(),'docente'));
CREATE TRIGGER trg_eventos_updated BEFORE UPDATE ON public.eventos_calendario FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_eventos_fecha ON public.eventos_calendario (fecha_inicio);

-- Especialidades y materias
CREATE TABLE public.especialidades (
  codigo public.especialidad_codigo PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  orden INT NOT NULL DEFAULT 0
);
GRANT SELECT ON public.especialidades TO anon, authenticated;
GRANT ALL ON public.especialidades TO service_role;
ALTER TABLE public.especialidades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "especialidades lectura publica" ON public.especialidades FOR SELECT USING (true);
CREATE POLICY "especialidades gestion autoridad" ON public.especialidades FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'autoridad'))
  WITH CHECK (public.has_role(auth.uid(),'autoridad'));

INSERT INTO public.especialidades (codigo, nombre, descripcion, orden) VALUES
  ('ciclo_basico','Ciclo Básico','1º a 3º año comunes a todas las especialidades',1),
  ('informatica','Informática','Especialidad orientada al desarrollo de software y sistemas',2),
  ('alimentos','Alimentos','Especialidad orientada a la industria alimentaria',3),
  ('electronica','Electrónica','Especialidad orientada al diseño y mantenimiento de sistemas electrónicos',4);

CREATE TABLE public.materias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  especialidad public.especialidad_codigo NOT NULL REFERENCES public.especialidades(codigo) ON DELETE CASCADE,
  anio INT NOT NULL CHECK (anio BETWEEN 1 AND 7),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  orden INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.materias TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.materias TO authenticated;
GRANT ALL ON public.materias TO service_role;
ALTER TABLE public.materias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "materias lectura publica" ON public.materias FOR SELECT USING (true);
CREATE POLICY "materias gestion staff" ON public.materias FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'autoridad') OR public.has_role(auth.uid(),'docente') OR public.has_role(auth.uid(),'informatica'))
  WITH CHECK (public.has_role(auth.uid(),'autoridad') OR public.has_role(auth.uid(),'docente') OR public.has_role(auth.uid(),'informatica'));
CREATE TRIGGER trg_materias_updated BEFORE UPDATE ON public.materias FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_materias_esp_anio ON public.materias (especialidad, anio);

-- Recursos
CREATE TABLE public.recursos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  materia_id UUID NOT NULL REFERENCES public.materias(id) ON DELETE CASCADE,
  tipo public.recurso_tipo NOT NULL,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  url TEXT,
  archivo_path TEXT,
  etiquetas TEXT[] NOT NULL DEFAULT '{}',
  autor_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.recursos TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.recursos TO authenticated;
GRANT ALL ON public.recursos TO service_role;
ALTER TABLE public.recursos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "recursos lectura publica" ON public.recursos FOR SELECT USING (true);
CREATE POLICY "recursos gestion staff" ON public.recursos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'autoridad') OR public.has_role(auth.uid(),'docente') OR public.has_role(auth.uid(),'informatica'))
  WITH CHECK (public.has_role(auth.uid(),'autoridad') OR public.has_role(auth.uid(),'docente') OR public.has_role(auth.uid(),'informatica'));
CREATE TRIGGER trg_recursos_updated BEFORE UPDATE ON public.recursos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_recursos_materia ON public.recursos (materia_id);
CREATE INDEX idx_recursos_tipo ON public.recursos (tipo);

-- Galería: álbumes y fotos
CREATE TABLE public.galeria_albumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descripcion TEXT,
  fecha DATE,
  cover_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.galeria_albumes TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.galeria_albumes TO authenticated;
GRANT ALL ON public.galeria_albumes TO service_role;
ALTER TABLE public.galeria_albumes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "albumes lectura publica" ON public.galeria_albumes FOR SELECT USING (true);
CREATE POLICY "albumes gestion staff" ON public.galeria_albumes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'autoridad') OR public.has_role(auth.uid(),'docente') OR public.has_role(auth.uid(),'informatica'))
  WITH CHECK (public.has_role(auth.uid(),'autoridad') OR public.has_role(auth.uid(),'docente') OR public.has_role(auth.uid(),'informatica'));
CREATE TRIGGER trg_albumes_updated BEFORE UPDATE ON public.galeria_albumes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.galeria_fotos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id UUID NOT NULL REFERENCES public.galeria_albumes(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  alt TEXT NOT NULL,
  orden INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.galeria_fotos TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.galeria_fotos TO authenticated;
GRANT ALL ON public.galeria_fotos TO service_role;
ALTER TABLE public.galeria_fotos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fotos lectura publica" ON public.galeria_fotos FOR SELECT USING (true);
CREATE POLICY "fotos gestion staff" ON public.galeria_fotos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'autoridad') OR public.has_role(auth.uid(),'docente') OR public.has_role(auth.uid(),'informatica'))
  WITH CHECK (public.has_role(auth.uid(),'autoridad') OR public.has_role(auth.uid(),'docente') OR public.has_role(auth.uid(),'informatica'));

-- Mensajes de contacto
CREATE TABLE public.mensajes_contacto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  asunto TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  leido BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.mensajes_contacto TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.mensajes_contacto TO authenticated;
GRANT ALL ON public.mensajes_contacto TO service_role;
ALTER TABLE public.mensajes_contacto ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mensajes envio publico" ON public.mensajes_contacto FOR INSERT WITH CHECK (
  length(nombre) BETWEEN 1 AND 120
  AND length(email) BETWEEN 3 AND 255
  AND length(asunto) BETWEEN 1 AND 200
  AND length(mensaje) BETWEEN 1 AND 4000
);
CREATE POLICY "mensajes solo autoridad" ON public.mensajes_contacto FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'autoridad'));
CREATE POLICY "mensajes update autoridad" ON public.mensajes_contacto FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'autoridad'));
CREATE POLICY "mensajes delete autoridad" ON public.mensajes_contacto FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'autoridad'));

-- Datos institucionales (clave-valor para configuración del sitio)
CREATE TABLE public.config_sitio (
  clave TEXT PRIMARY KEY,
  valor TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.config_sitio TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.config_sitio TO authenticated;
GRANT ALL ON public.config_sitio TO service_role;
ALTER TABLE public.config_sitio ENABLE ROW LEVEL SECURITY;
CREATE POLICY "config lectura publica" ON public.config_sitio FOR SELECT USING (true);
CREATE POLICY "config gestion staff" ON public.config_sitio FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'autoridad') OR public.has_role(auth.uid(),'informatica'))
  WITH CHECK (public.has_role(auth.uid(),'autoridad') OR public.has_role(auth.uid(),'informatica'));

INSERT INTO public.config_sitio (clave, valor) VALUES
  ('nombre_escuela','Escuela Secundaria Técnica'),
  ('lema','Formación técnica con compromiso institucional'),
  ('direccion','Dirección de la escuela'),
  ('telefono','+54 11 0000-0000'),
  ('email','contacto@escuela.edu.ar'),
  ('horario','Lunes a viernes de 7:30 a 17:30');

-- Datos de ejemplo para arrancar
INSERT INTO public.avisos (titulo, contenido, categoria, destacado, publicado_en) VALUES
  ('Inicio del ciclo lectivo', 'El ciclo lectivo comienza el lunes 3 de marzo. Recordamos a las familias revisar la lista de útiles publicada en la sección Familias.', 'institucional', true, now() - interval '2 days'),
  ('Reunión de padres - 1º año', 'Convocamos a las familias de los estudiantes de 1º año a la reunión informativa el viernes 7 a las 18:00 hs en el salón de actos.', 'familias', false, now() - interval '1 day'),
  ('Elecciones del Centro de Estudiantes', 'Se acerca el período de presentación de listas. Toda la información en las carteleras y en este sitio.', 'centro_estudiantes', true, now() - interval '3 hours');

INSERT INTO public.eventos_calendario (titulo, descripcion, tipo, fecha_inicio) VALUES
  ('Acto de inicio de clases', 'Acto institucional en el patio central.', 'evento', now() + interval '7 days'),
  ('Examen previas - Matemática', 'Mesa de exámenes para estudiantes con materias previas.', 'examen', now() + interval '14 days'),
  ('Feria de Ciencias', 'Muestra anual de proyectos de Informática, Alimentos y Electrónica.', 'actividad', now() + interval '45 days');

-- Materias de ejemplo: 1º año ciclo básico
INSERT INTO public.materias (especialidad, anio, nombre, orden) VALUES
  ('ciclo_basico', 1, 'Matemática', 1),
  ('ciclo_basico', 1, 'Lengua y Literatura', 2),
  ('ciclo_basico', 1, 'Ciencias Naturales', 3),
  ('ciclo_basico', 1, 'Ciencias Sociales', 4),
  ('ciclo_basico', 1, 'Educación Tecnológica', 5),
  ('ciclo_basico', 1, 'Educación Física', 6);
