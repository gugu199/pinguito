# Plan: extensiones v2 del sitio escolar

Sumamos contenido editable por especialidad, proyectos de alumnos, sección propia del Centro de Estudiantes, capacitaciones especiales, video de la mascota, mapa de Google y tema claro/oscuro. Todo gestionable desde el panel `/admin`.

## 1. Tema claro / oscuro
- Variante `dark` con `@custom-variant dark (&:where(.dark, .dark *));` en `src/styles.css`.
- Bloque `:root` (claro institucional) + `.dark` (azul nocturno, contraste AA).
- Hook `useTheme` que persiste en `localStorage` y aplica `class="dark"` en `<html>`.
- Botón sol/luna en `SiteHeader` y `AdminHeader`.
- Sin detección automática de sistema (lo descartaste); arranca en claro.

## 2. Páginas de especialidades enriquecidas
Reemplazamos `materias.$especialidad.tsx` por una página con:
- **Encabezado** con nombre + descripción (ya existe).
- **Video introductorio**: campo `video_url` (YouTube/Vimeo) editable por especialidad. Embed responsive.
- **Salida laboral / perfil del egresado**: campo `salida_laboral` (texto largo, markdown ligero).
- **Listado de materias por año** (lo que ya hay).
- **Proyectos de alumnos** de esa especialidad (ver §4).

Mismo formato para una nueva especialidad virtual `ciclo_basico` (1º a 3º).

Editable desde `Admin → Especialidades` (nuevo).

## 3. Centro de Estudiantes — sección propia
Ruta pública `/centro-estudiantes` con:
- Presentación (texto editable: misión, gestión actual).
- **Integrantes**: foto, nombre, cargo, año — tabla `centro_integrantes`.
- **Anuncios del centro**: ya existe categoría `centro_estudiantes` en `avisos`, los listamos acá filtrados.
- **Galería de actividades**: reutiliza álbumes de `galeria_albumes` con flag `es_centro`.
- **Formulario "Enviá tu propuesta"**: tabla `propuestas_centro` (nombre, año/curso opcional, email opcional, mensaje). Solo el rol `centro_estudiantes` y `autoridad` las leen desde `Admin → Propuestas`.

Editable desde `Admin → Centro de Estudiantes` (visible para roles `centro_estudiantes` y `autoridad`).

## 4. Proyectos de alumnos
Nueva tabla `proyectos` con: título, descripción, especialidad, año cursado, autores (texto libre), foto principal (Storage bucket `proyectos`, público), fecha, destacado (bool).
- Se muestran en cada página de especialidad como grilla de cards.
- Carrusel/grilla de "Últimos proyectos" opcional en home (no lo pediste explícitamente, lo dejamos solo en especialidades).
- Admin: `Admin → Proyectos` con CRUD + upload de imagen. Permitido para `autoridad`, `docente`, `informatica`.

## 5. Capacitaciones especiales
Nueva tabla `capacitaciones`: nombre, descripción, aula, días, horario, responsable, cupo, estado (`abierta`/`cerrada`/`en_curso`), destino (texto, ej. "abierto a la comunidad").
- Ruta pública `/capacitaciones` con cards filtrables por estado.
- Card destacada en home con las 3 próximas/abiertas.
- Admin: `Admin → Capacitaciones`. Permitido para `autoridad`, `docente`.

## 6. Video de la mascota en home
- Nuevas claves en `config_sitio`: `mascota_titulo`, `mascota_descripcion`, `mascota_video_url`.
- Sección destacada en `routes/index.tsx` con embed responsive (YouTube/Vimeo). Si no hay URL, no se muestra.
- Editable desde `Admin → Datos institucionales`.

## 7. Mapa de Google integrado
- Conector **Google Maps Platform** de Lovable (te lo voy a pedir en el momento de enchufarlo).
- Componente `<SchoolMap />` con marcador en la dirección de la escuela usando la JS API + browser key del conector.
- Embebido en `/contacto` y `/institucional`.
- Coordenadas guardadas en `config_sitio` (`lat`, `lng`, `zoom`) — editables desde admin; si la cuenta de Google Maps no está conectada todavía, mostramos un fallback con dirección + link a Google Maps.

## 8. Mejoras generales sugeridas (incluidas)
- **Breadcrumbs** en rutas anidadas (especialidades, materias, proyectos).
- **Open Graph** por ruta con título/descripción específicos para compartir en WhatsApp/redes.
- **Sitemap.xml + robots.txt** generados en build.
- **Skeletons** en listados largos en vez de "Cargando…".
- **Notificación visible en admin** cuando hay mensajes/propuestas sin leer (badge en sidebar).
- **Orden manual** (drag-handle o campo `orden`) en proyectos y capacitaciones destacados.

## Detalles técnicos

### Migración SQL (una sola)
- `proyectos` (+ bucket público `proyectos`).
- `capacitaciones`.
- `centro_integrantes`.
- `propuestas_centro`.
- ALTER `especialidades` ADD `video_url text`, `salida_laboral text`.
- ALTER `galeria_albumes` ADD `es_centro boolean default false`.
- INSERT `especialidades` row `ciclo_basico` si no existe.
- INSERT claves `mascota_*`, `lat`, `lng`, `zoom`, `centro_presentacion` en `config_sitio` (con `null`).
- GRANTs: `SELECT TO anon` para tablas públicas (`proyectos`, `capacitaciones`, `centro_integrantes`); `INSERT TO anon` solo en `propuestas_centro` (con rate-limit por trigger simple); resto vía roles.
- RLS:
  - `proyectos`/`capacitaciones`: lectura pública; escritura `has_role autoridad|docente|informatica`.
  - `centro_integrantes`: lectura pública; escritura `has_role autoridad|centro_estudiantes`.
  - `propuestas_centro`: insert público; lectura solo `autoridad|centro_estudiantes`.

### Frontend
- Tokens `dark` en `src/styles.css`.
- Nuevos componentes: `ThemeToggle`, `VideoEmbed`, `ProyectoCard`, `CapacitacionCard`, `IntegranteCard`, `SchoolMap`, `MascotaSection`.
- Nuevas rutas públicas: `centro-estudiantes.tsx`, `capacitaciones.tsx`.
- Nuevas rutas admin: `admin.especialidades.tsx`, `admin.proyectos.tsx`, `admin.capacitaciones.tsx`, `admin.centro.tsx` (integrantes + presentación), `admin.propuestas.tsx`.
- Sidebar admin actualizado con visibilidad por rol.
- Home (`routes/index.tsx`): nueva sección mascota + próximas capacitaciones + últimos avisos.

### Google Maps
- Cuando vayamos a esa fase pedimos conectar el conector `google_maps` desde la UI de Lovable. Mientras no esté, `<SchoolMap />` muestra dirección + botón "Abrir en Google Maps".

## Lo que necesito de vos cuando empecemos a buildear
- URL del video de la mascota (YouTube/Vimeo) o lo cargás luego desde admin.
- Dirección exacta de la escuela (para coordenadas iniciales del mapa).
- Conectar Google Maps Platform desde el botón cuando te lo pida.
- Foto/integrantes iniciales del Centro si querés que arranque con datos; si no, queda vacío y los carga el centro desde admin.

## Orden de implementación
1. Migración SQL (tablas, columnas, grants, RLS, bucket).
2. Tokens dark + `ThemeToggle`.
3. Especialidades enriquecidas + admin de especialidades + ciclo básico.
4. Proyectos (pública + admin).
5. Capacitaciones (pública + admin) + destacadas en home.
6. Centro de Estudiantes (página pública + admin + propuestas).
7. Mascota en home + claves en config.
8. Mapa de Google (conector + componente + fallback).
9. Pulido: breadcrumbs, OG por ruta, sitemap, badges de pendientes.
