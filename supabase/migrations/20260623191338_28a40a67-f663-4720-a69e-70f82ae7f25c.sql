
-- Lectura pública
CREATE POLICY "galeria lectura publica" ON storage.objects FOR SELECT USING (bucket_id = 'galeria');
CREATE POLICY "recursos lectura publica" ON storage.objects FOR SELECT USING (bucket_id = 'recursos');

-- Escritura solo staff
CREATE POLICY "galeria insert staff" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'galeria' AND (
      public.has_role(auth.uid(),'autoridad') OR public.has_role(auth.uid(),'docente') OR public.has_role(auth.uid(),'informatica')
    )
  );
CREATE POLICY "galeria update staff" ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'galeria' AND (
      public.has_role(auth.uid(),'autoridad') OR public.has_role(auth.uid(),'docente') OR public.has_role(auth.uid(),'informatica')
    )
  );
CREATE POLICY "galeria delete staff" ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'galeria' AND (
      public.has_role(auth.uid(),'autoridad') OR public.has_role(auth.uid(),'docente') OR public.has_role(auth.uid(),'informatica')
    )
  );

CREATE POLICY "recursos insert staff" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'recursos' AND (
      public.has_role(auth.uid(),'autoridad') OR public.has_role(auth.uid(),'docente') OR public.has_role(auth.uid(),'informatica')
    )
  );
CREATE POLICY "recursos update staff" ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'recursos' AND (
      public.has_role(auth.uid(),'autoridad') OR public.has_role(auth.uid(),'docente') OR public.has_role(auth.uid(),'informatica')
    )
  );
CREATE POLICY "recursos delete staff" ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'recursos' AND (
      public.has_role(auth.uid(),'autoridad') OR public.has_role(auth.uid(),'docente') OR public.has_role(auth.uid(),'informatica')
    )
  );
