
-- Materias por especialidad
INSERT INTO public.materias (especialidad, anio, nombre, descripcion, orden) VALUES
('informatica',4,'Programación I','Fundamentos de programación estructurada y lógica.',1),
('informatica',5,'Bases de Datos','Modelado relacional, SQL y normalización.',2),
('informatica',6,'Desarrollo Web','HTML, CSS, JavaScript y frameworks modernos.',3),
('informatica',6,'Redes de Computadoras','Protocolos, cableado estructurado y configuración de redes.',4),
('informatica',7,'Proyecto Final','Desarrollo integral de un sistema real.',5),
('alimentos',4,'Química de los Alimentos','Composición y transformaciones químicas de los alimentos.',1),
('alimentos',5,'Microbiología','Microorganismos, contaminación y control sanitario.',2),
('alimentos',6,'Procesos Industriales','Conservación, envasado y líneas de producción.',3),
('alimentos',7,'Control de Calidad','Normas, trazabilidad y análisis de laboratorio.',4),
('electronica',4,'Electrotecnia','Circuitos de corriente continua y alterna.',1),
('electronica',5,'Electrónica Digital','Lógica combinacional y secuencial.',2),
('electronica',6,'Microcontroladores','Programación de microcontroladores y sensores.',3),
('electronica',7,'Automatización y Control','Sistemas de control, PLC y robótica.',4);

-- Recursos de ejemplo
INSERT INTO public.recursos (materia_id, tipo, titulo, descripcion, url, etiquetas)
SELECT m.id, 'apunte', 'Apunte introductorio: ' || m.nombre, 'Material de referencia para la cursada.', NULL, ARRAY['apunte','introducción']
FROM public.materias m WHERE m.anio IN (1,4);

INSERT INTO public.recursos (materia_id, tipo, titulo, descripcion, url, etiquetas)
SELECT m.id, 'video', 'Clase grabada: ' || m.nombre, 'Video explicativo de los primeros temas.', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', ARRAY['video','clase']
FROM public.materias m WHERE m.especialidad <> 'ciclo_basico' AND m.anio = 5;

-- Capacitaciones
INSERT INTO public.capacitaciones (nombre, descripcion, aula, dias, horario, responsable, cupo, estado, destinatarios, destacado, orden) VALUES
('Robótica educativa','Armado y programación de robots con Arduino.','Laboratorio 2','Martes y jueves','17:00 a 19:00','Prof. Laura Giménez',20,'abierta','Alumnos de 4º a 7º año',true,1),
('Introducción a Python','Programación desde cero orientada a resolución de problemas.','Sala de Informática 1','Lunes','17:30 a 19:30','Prof. Diego Fernández',25,'abierta','Alumnos y familias',true,2),
('Manipulación segura de alimentos','Buenas prácticas y normativa vigente.','Taller de Alimentos','Miércoles','16:00 a 18:00','Prof. Silvia Rojas',18,'en_curso','Alumnos de Alimentos',false,3),
('Reparación de PC','Diagnóstico y mantenimiento de equipos.','Taller de Informática','Viernes','15:00 a 17:00','Prof. Martín Ávila',15,'cerrada','Comunidad educativa',false,4);

-- Proyectos de alumnos
INSERT INTO public.proyectos (titulo, descripcion, especialidad, anio, autores, fecha, destacado, orden) VALUES
('Sistema de gestión de biblioteca','Aplicación web para administrar préstamos y devoluciones de la biblioteca escolar.','informatica',2025,'Alumnos de 7º Informática', '2025-11-10', true, 1),
('App de asistencia con QR','Registro de asistencia mediante códigos QR y panel para preceptoría.','informatica',2025,'Alumnos de 6º Informática', '2025-09-05', false, 2),
('Dulce regional artesanal','Desarrollo y análisis de un dulce con frutas de la zona, con estudio de vida útil.','alimentos',2025,'Alumnos de 7º Alimentos', '2025-10-20', true, 3),
('Estación meteorológica','Medición de temperatura, humedad y presión con sensores y registro de datos.','electronica',2025,'Alumnos de 6º Electrónica', '2025-08-15', true, 4),
('Brazo robótico didáctico','Prototipo de brazo con servomotores controlado por microcontrolador.','electronica',2025,'Alumnos de 7º Electrónica', '2025-11-02', false, 5);

-- Centro de Estudiantes
INSERT INTO public.centro_integrantes (nombre, cargo, anio, orden) VALUES
('Sofía Ramírez','Presidenta','7º Informática',1),
('Tomás Herrera','Vicepresidente','6º Electrónica',2),
('Julieta Paz','Secretaria','6º Alimentos',3),
('Nicolás Duarte','Tesorero','5º Informática',4),
('Camila Suárez','Vocal de Cultura','4º Ciclo Superior',5),
('Lucas Medina','Vocal de Deportes','5º Electrónica',6);

-- Álbum de galería
INSERT INTO public.galeria_albumes (titulo, descripcion, fecha, es_centro) VALUES
('Muestra anual de proyectos','Exposición de trabajos de las tres especialidades.', '2025-11-15', false),
('Jornada del Centro de Estudiantes','Actividades organizadas por el Centro de Estudiantes.', '2025-09-21', true);

-- Textos configurables
UPDATE public.config_sitio SET valor = 'El Centro de Estudiantes representa la voz de los alumnos: organiza actividades, canaliza propuestas y acompaña a la comunidad educativa.' WHERE clave = 'centro_presentacion' AND coalesce(valor,'') = '';
UPDATE public.config_sitio SET valor = 'Conocé a nuestra mascota' WHERE clave = 'mascota_titulo' AND coalesce(valor,'') = '';
UPDATE public.config_sitio SET valor = 'La mascota de la escuela nos acompaña en actos, jornadas y torneos. Mirá el video para conocer su historia.' WHERE clave = 'mascota_descripcion' AND coalesce(valor,'') = '';
UPDATE public.config_sitio SET valor = '-34.6037' WHERE clave = 'mapa_lat' AND coalesce(valor,'') = '';
UPDATE public.config_sitio SET valor = '-58.3816' WHERE clave = 'mapa_lng' AND coalesce(valor,'') = '';

-- Salida laboral de especialidades
UPDATE public.especialidades SET salida_laboral = 'Desarrollo de software, soporte técnico, redes, bases de datos y continuidad en carreras de Ingeniería en Sistemas o Informática.' WHERE codigo = 'informatica';
UPDATE public.especialidades SET salida_laboral = 'Industria alimentaria, control de calidad, laboratorios de análisis y continuidad en carreras de Bromatología o Ingeniería en Alimentos.' WHERE codigo = 'alimentos';
UPDATE public.especialidades SET salida_laboral = 'Mantenimiento electrónico, automatización industrial, telecomunicaciones y continuidad en carreras de Ingeniería Electrónica o Eléctrica.' WHERE codigo = 'electronica';
UPDATE public.especialidades SET salida_laboral = 'Formación general común que permite elegir con criterio la especialidad técnica a partir de 4º año.' WHERE codigo = 'ciclo_basico';
