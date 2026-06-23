
# Plan: Sitio web escuela secundaria técnica

Sitio institucional público + panel de administración autogestionado, todo en v1. Estilo clásico azul/blanco, responsive, accesible (WCAG AA).

## Stack

- TanStack Start + React + Tailwind v4 (tokens semánticos azul/blanco en `src/styles.css`).
- Lovable Cloud (Supabase) para base de datos, auth y storage de imágenes/archivos.
- Tipografía: Source Serif para títulos + Inter para texto (formal, legible, alto contraste).

## Estructura del sitio público

```text
/                      Inicio (avisos recientes + accesos directos)
/institucional         Información institucional (historia, autoridades)
/avisos                Avisos (filtros: Institucional / Centro Est. / Familias)
/calendario            Calendario de exámenes, actividades y eventos
/galeria               Galería de fotos
/contacto              Formulario + datos de contacto
/materias              Hub: Ciclo Básico + 3 especialidades
/materias/$nivel       Ciclo Básico o especialidad (Informática/Alimentos/Electrónica)
/materias/$nivel/$año/$materia   Recursos (apuntes, guías, videos, bibliografía)
/buscar                Resultados del buscador interno
/auth                  Login (solo roles con permisos)
/_authenticated/admin  Panel de administración (gateado por rol)
```

Header con menú principal (6 ítems: Inicio · Institucional · Avisos · Calendario · Materias · Contacto) + barra de búsqueda + acceso "Ingresar". Footer con datos de la escuela y redes.

## Modelo de datos

Tablas en Lovable Cloud con RLS:

- `profiles` — datos del usuario logueado (nombre, email).
- `app_role` enum: `autoridad`, `docente`, `centro_estudiantes`, `informatica`.
- `user_roles` (tabla separada, función `has_role` SECURITY DEFINER).
- `invitations` — códigos de invitación (código, rol, usado_por, expira).
- `avisos` — título, contenido, categoría (institucional/centro/familias), autor, fecha, destacado.
- `eventos_calendario` — título, descripción, fecha inicio/fin, tipo (examen/actividad/evento).
- `galeria` — álbumes y fotos (con storage bucket público `galeria`).
- `especialidades` (ciclo_basico, informatica, alimentos, electronica) y `materias` (especialidad, año, nombre).
- `recursos` — materia_id, tipo (apunte/guía/video/bibliografía), título, url o archivo, etiquetas.
- `mensajes_contacto` — formulario de contacto.

Bucket Storage: `galeria` (público) y `recursos` (público lectura).

## Sistema de roles y permisos

- **Público**: lee todo el contenido publicado, sin login.
- **Autoridad/Docente**: CRUD de avisos institucionales y para familias, calendario, materias, recursos, galería.
- **Centro de Estudiantes**: CRUD sólo de avisos categoría "centro".
- **Informática**: edición técnica (galería, recursos generales, configuración del sitio).
- **Super-admin** (primer autoridad creada): genera códigos de invitación desde el panel.

Registro: solo con código de invitación válido (email/password + código → asigna rol asociado al código). Google opcional más adelante.

## Panel de administración (`/_authenticated/admin`)

Secciones según rol (cada item gateado por `has_role`):

1. Dashboard (resumen)
2. Avisos (con selector de categoría según permisos)
3. Calendario (vista lista + form)
4. Materias y recursos (árbol Especialidad → Año → Materia → Recursos, con uploads)
5. Galería (álbumes + subida de fotos)
6. Mensajes recibidos del formulario
7. Usuarios e invitaciones (sólo super-admin/autoridad): generar código, asignar rol, ver usuarios
8. Datos institucionales (logo, dirección, contacto) — editable por informática/autoridad

## Buscador interno

Vista `/buscar?q=…` que consulta avisos, materias, recursos y eventos (full-text simple con `ilike` sobre título/contenido, agrupado por tipo de resultado).

## Identidad visual

- Tokens en `src/styles.css`:
  - `--primary` azul institucional (~oklch del azul que pases con el logo, default `#0B3D91`)
  - `--primary-foreground` blanco
  - `--accent` azul claro para hovers
  - `--background` blanco / `--foreground` gris oscuro
  - Bordes definidos, sombras sutiles, sin gradientes ni animaciones.
- Header con franja azul + logo + nombre de la escuela.
- Cards de avisos con borde lateral azul; los del Centro de Estudiantes con borde de color distinto (ej. azul más claro o gris) para diferenciarlos visualmente sin romper la paleta.

## Accesibilidad

- Contraste AA verificado en tokens.
- Alt obligatorio en uploads de galería y recursos.
- Navegación por teclado en menú, formularios y panel.
- Mensajes de error en español claros (zod + toast).

## Lo que vos me pasás antes de implementar

- Logo (PNG o SVG) y, si tenés, escudo.
- Nombre exacto de la escuela, dirección, teléfono, email, redes sociales.
- Color azul exacto si querés uno específico (si no, uso `#0B3D91`).
- Listado de materias por año/especialidad que tengas a mano (el resto queda como ejemplo editable).

## Orden de construcción

1. Enable Lovable Cloud + tokens visuales + layout base (header/footer/menú).
2. Rutas públicas con datos de ejemplo (Inicio, Institucional, Avisos, Calendario, Galería, Contacto).
3. Esquema DB + RLS + roles + invitaciones + auth (login/registro con código).
4. Panel admin: avisos, calendario, galería, mensajes.
5. Materias/recursos (estructura + uploads + filtros por etiquetas).
6. Buscador interno.
7. Gestión de usuarios e invitaciones + datos institucionales editables.
8. Pulido de accesibilidad, responsive, SEO básico (head() por ruta).

Cuando apruebes el plan, me pasás el logo y los datos y arranco con la base visual + Cloud.
