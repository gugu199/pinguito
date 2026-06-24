
CREATE POLICY "proyectos lectura pública" ON storage.objects FOR SELECT USING (bucket_id = 'proyectos');
CREATE POLICY "proyectos escritura staff" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'proyectos' AND (public.has_role(auth.uid(),'autoridad') OR public.has_role(auth.uid(),'docente') OR public.has_role(auth.uid(),'informatica')))
  WITH CHECK (bucket_id = 'proyectos' AND (public.has_role(auth.uid(),'autoridad') OR public.has_role(auth.uid(),'docente') OR public.has_role(auth.uid(),'informatica')));
