// Datos institucionales por defecto. Se sobrescriben con lo guardado en la tabla `config_sitio`.
export const SITE_DEFAULTS = {
  nombre_escuela: "Escuela Secundaria Técnica",
  lema: "Formación técnica con compromiso institucional",
  direccion: "Dirección de la escuela",
  telefono: "+54 11 0000-0000",
  email: "contacto@escuela.edu.ar",
  horario: "Lunes a viernes de 7:30 a 17:30",
} as const;

export type SiteConfigKey = keyof typeof SITE_DEFAULTS;

export const ESPECIALIDADES = [
  { codigo: "ciclo_basico", nombre: "Ciclo Básico", anios: [1, 2, 3] },
  { codigo: "informatica", nombre: "Informática", anios: [4, 5, 6, 7] },
  { codigo: "alimentos", nombre: "Alimentos", anios: [4, 5, 6, 7] },
  { codigo: "electronica", nombre: "Electrónica", anios: [4, 5, 6, 7] },
] as const;

export const RECURSO_TIPOS = [
  { value: "apunte", label: "Apunte" },
  { value: "guia", label: "Guía de actividades" },
  { value: "video", label: "Video" },
  { value: "bibliografia", label: "Bibliografía" },
] as const;

export const AVISO_CATEGORIAS = [
  { value: "institucional", label: "Institucional" },
  { value: "centro_estudiantes", label: "Centro de Estudiantes" },
  { value: "familias", label: "Familias" },
] as const;

export const EVENTO_TIPOS = [
  { value: "examen", label: "Examen" },
  { value: "actividad", label: "Actividad" },
  { value: "evento", label: "Evento" },
] as const;
