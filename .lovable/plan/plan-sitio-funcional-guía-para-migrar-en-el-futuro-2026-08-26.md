# Plan: sitio funcional + guía para migrar en el futuro

## Estado actual

El sitio ya está construido sobre TanStack Start y tiene:

- Frontend público: inicio, institucional, avisos, calendario, galería, materias por especialidad, centro de estudiantes, capacitaciones, contacto.
- Panel de administración (`/_authenticated/admin/*`) para editar casi todo: datos de la escuela, mapa, video de la mascota, especialidades, proyectos, capacitaciones, avisos, calendario, galería, centro de estudiantes, invitaciones y propuestas.
- Base de datos con roles (`autoridad`, `docente`, `centro_estudiantes`, `informatica`), sistema de invitaciones y RLS endurecido.
- Tema claro/oscuro y diseño responsive.

## Lo que falta para que sea 100 % funcional

1. **Contenido de ejemplo**
   - Rellenar la base de datos con datos ficticios de demostración (avisos, eventos, materias, capacitaciones, galería, proyectos, integrantes del centro, config del sitio).
   - Esto permite ver el sitio completo sin depender de que el usuario cargue nada a mano.

2. **Autenticación social (Google OAuth)**
   - Configurar el proveedor de Google en Lovable Cloud / auth.
   - Agregar botón "Ingresar con Google" en `/auth`.
   - El primer usuario que se registre sigue siendo `autoridad` automáticamente; los siguientes necesitan código de invitación para obtener un rol.

3. **Verificación de acceso y roles**
   - Asegurar que solo `autoridad` pueda gestionar invitaciones.
   - Asegurar que `docente` vea solo materias, `centro_estudiantes` vea solo centro/propuestas, `informatica` vea solo ciertas secciones según corresponda.
   - Revisar que el login con email/contraseña y el canje de códigos funcionen sin errores.

4. **Build limpio y publicación**
   - Correr build de producción para confirmar que no hay errores.
   - Publicar el sitio para que sea accesible en la URL publicada.

5. **Documentación rápida para el usuario**
   - Explicarle qué se edita desde el panel de admin y qué desde dónde.
   - Dejar un mini-checklist de "reemplazar por datos reales".

## Cómo modificar los datos reales después

- **Datos de la escuela, mapa y video de la mascota**: `Panel de admin → Datos institucionales`.
- **Especialidades y videos introductorios**: `Panel de admin → Especialidades`.
- **Proyectos de alumnos**: `Panel de admin → Proyectos` (sube fotos y descripción).
- **Capacitaciones especiales**: `Panel de admin → Capacitaciones`.
- **Avisos / Calendario / Galería**: módulos correspondientes en el admin.
- **Centro de Estudiantes**: `Panel de admin → Centro de Estudiantes` y `Propuestas`.
- **Usuarios y roles**: `Panel de admin → Invitaciones` (genera códigos) y el usuario los canjea en `/auth`.

## Preparación para migrar a otro hosting en el futuro

Para no quedar atado a Lovable Cloud ni sufrir errores al migrar:

- **Base de datos**: todo el esquema y las políticas están en `supabase/migrations/*.sql`. Al migrar, ejecutar esos archivos en orden en la nueva base Postgres (con pgcrypto y pgjwt si se usa Supabase).
- **Storage / imágenes**: descargar el contenido de los buckets (`galeria`, `recursos`, `proyectos`) y re-subirlos al nuevo storage, o implementar un backup periódico.
- **Auth**: los usuarios están en `auth.users` de Supabase. Al cambiar de proveedor hay que re-crear cuentas o exportar/importar IDs; los perfiles y roles están en tablas `public` y pueden migrarse fácilmente.
- **Variables de entorno**: el proyecto usa `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` y `VITE_SUPABASE_PROJECT_ID`. Al migrar se reemplazan por las del nuevo backend.
- **Código fuente**: no hay lógica dependiente de edge functions ni de Lovable-only APIs; todo el backend app-interno usa `createServerFn` y TanStack Start, por lo que corre en cualquier host Node/Edge compatible con Vite 7+ y Nitro.
- **Lockfile y dependencias**: conservar `bun.lockb` (o generar `package-lock.json`) y documentar la versión exacta de Node/Bun para reproducir el build.
- **Recomendación general**: evitar migrar en medio de una actualización de framework; primero estabilizar una versión, publicar, y luego planificar la migración copiando DB + storage + env.

## Entregables de este plan

1. Migración de seed con contenido de ejemplo aplicada a la base de datos.
2. Botón de "Ingresar con Google" en `/auth` y proveedor configurado.
3. Revisión de accesos por rol en el panel de admin.
4. Build limpio y sitio publicado.
5. Mini-guía para el usuario sobre dónde editar cada cosa.
