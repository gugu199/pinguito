
-- 1. profiles: restrict reads
DROP POLICY IF EXISTS "perfiles lectura autenticados" ON public.profiles;
CREATE POLICY "perfil propio o autoridad select" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'autoridad'::app_role));

-- 2. propuestas_centro: validate input lengths
DROP POLICY IF EXISTS "Propuestas insertar público" ON public.propuestas_centro;
CREATE POLICY "Propuestas insertar público" ON public.propuestas_centro
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(nombre) BETWEEN 1 AND 120
    AND (curso IS NULL OR length(curso) <= 80)
    AND (email IS NULL OR (length(email) BETWEEN 3 AND 255))
    AND length(mensaje) BETWEEN 1 AND 4000
  );

-- 3. security definer functions: restrict EXECUTE
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_any_role(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.canjear_invitacion(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.canjear_invitacion(text) TO authenticated;
