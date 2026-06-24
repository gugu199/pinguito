
-- Especialidad ciclo_basico (si el enum no la tiene, usamos texto). Inspeccionamos primero:
-- especialidades.codigo es enum. Agregamos valor 'ciclo_basico' si no existe.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid=e.enumtypid WHERE t.typname='especialidad_codigo' AND e.enumlabel='ciclo_basico') THEN
    BEGIN
      ALTER TYPE public.especialidad_codigo ADD VALUE 'ciclo_basico';
    EXCEPTION WHEN undefined_object THEN
      NULL; -- si el tipo no se llama así, lo manejamos abajo con text
    END;
  END IF;
END $$;

-- Columnas nuevas en especialidades
ALTER TABLE public.especialidades
  ADD COLUMN IF NOT EXISTS video_url text,
  ADD COLUMN IF NOT EXISTS salida_laboral text;

-- Inserta ciclo_basico si no existe (intenta como enum; si falla, como text)
INSERT INTO public.especialidades (codigo, nombre, descripcion, orden)
SELECT 'ciclo_basico', 'Ciclo Básico', 'Formación común de 1º a 3º año, base para todas las especialidades.', 0
WHERE NOT EXISTS (SELECT 1 FROM public.especialidades WHERE codigo::text = 'ciclo_basico');

-- galeria_albumes: flag es_centro
ALTER TABLE public.galeria_albumes
  ADD COLUMN IF NOT EXISTS es_centro boolean NOT NULL DEFAULT false;

-- ===== PROYECTOS =====
CREATE TABLE IF NOT EXISTS public.proyectos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  descripcion text NOT NULL,
  especialidad text NOT NULL,
  anio integer,
  autores text,
  foto_url text,
  fecha date DEFAULT current_date,
  destacado boolean NOT NULL DEFAULT false,
  orden integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.proyectos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.proyectos TO authenticated;
GRANT ALL ON public.proyectos TO service_role;
ALTER TABLE public.proyectos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Proyectos lectura pública" ON public.proyectos FOR SELECT USING (true);
CREATE POLICY "Proyectos escritura personal" ON public.proyectos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'autoridad') OR public.has_role(auth.uid(),'docente') OR public.has_role(auth.uid(),'informatica'))
  WITH CHECK (public.has_role(auth.uid(),'autoridad') OR public.has_role(auth.uid(),'docente') OR public.has_role(auth.uid(),'informatica'));
CREATE TRIGGER set_proyectos_updated BEFORE UPDATE ON public.proyectos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== CAPACITACIONES =====
CREATE TABLE IF NOT EXISTS public.capacitaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  descripcion text,
  aula text,
  dias text,
  horario text,
  responsable text,
  cupo integer,
  estado text NOT NULL DEFAULT 'abierta' CHECK (estado IN ('abierta','en_curso','cerrada')),
  destinatarios text,
  destacado boolean NOT NULL DEFAULT false,
  orden integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.capacitaciones TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.capacitaciones TO authenticated;
GRANT ALL ON public.capacitaciones TO service_role;
ALTER TABLE public.capacitaciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Capacitaciones lectura pública" ON public.capacitaciones FOR SELECT USING (true);
CREATE POLICY "Capacitaciones escritura personal" ON public.capacitaciones FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'autoridad') OR public.has_role(auth.uid(),'docente'))
  WITH CHECK (public.has_role(auth.uid(),'autoridad') OR public.has_role(auth.uid(),'docente'));
CREATE TRIGGER set_capacitaciones_updated BEFORE UPDATE ON public.capacitaciones FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== INTEGRANTES CENTRO =====
CREATE TABLE IF NOT EXISTS public.centro_integrantes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  cargo text NOT NULL,
  anio text,
  foto_url text,
  orden integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.centro_integrantes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.centro_integrantes TO authenticated;
GRANT ALL ON public.centro_integrantes TO service_role;
ALTER TABLE public.centro_integrantes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Integrantes lectura pública" ON public.centro_integrantes FOR SELECT USING (true);
CREATE POLICY "Integrantes escritura centro" ON public.centro_integrantes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'autoridad') OR public.has_role(auth.uid(),'centro_estudiantes'))
  WITH CHECK (public.has_role(auth.uid(),'autoridad') OR public.has_role(auth.uid(),'centro_estudiantes'));
CREATE TRIGGER set_integrantes_updated BEFORE UPDATE ON public.centro_integrantes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== PROPUESTAS AL CENTRO =====
CREATE TABLE IF NOT EXISTS public.propuestas_centro (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  curso text,
  email text,
  mensaje text NOT NULL,
  leido boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.propuestas_centro TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.propuestas_centro TO authenticated;
GRANT ALL ON public.propuestas_centro TO service_role;
ALTER TABLE public.propuestas_centro ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Propuestas insertar público" ON public.propuestas_centro FOR INSERT WITH CHECK (true);
CREATE POLICY "Propuestas leer centro" ON public.propuestas_centro FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'autoridad') OR public.has_role(auth.uid(),'centro_estudiantes'));
CREATE POLICY "Propuestas marcar centro" ON public.propuestas_centro FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'autoridad') OR public.has_role(auth.uid(),'centro_estudiantes'))
  WITH CHECK (public.has_role(auth.uid(),'autoridad') OR public.has_role(auth.uid(),'centro_estudiantes'));
CREATE POLICY "Propuestas borrar centro" ON public.propuestas_centro FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'autoridad') OR public.has_role(auth.uid(),'centro_estudiantes'));

-- ===== CONFIG SITIO: nuevas claves =====
INSERT INTO public.config_sitio (clave, valor) VALUES
  ('mascota_titulo', NULL),
  ('mascota_descripcion', NULL),
  ('mascota_video_url', NULL),
  ('centro_presentacion', NULL),
  ('mapa_lat', NULL),
  ('mapa_lng', NULL),
  ('mapa_zoom', '16')
ON CONFLICT (clave) DO NOTHING;
