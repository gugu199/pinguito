import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SITE_DEFAULTS, type SiteConfigKey } from "@/lib/site-config";

export const Route = createFileRoute("/_authenticated/admin/config")({
  component: AdminConfig,
});

const FIELDS: Array<{ key: SiteConfigKey; label: string; long?: boolean; placeholder?: string; group: string }> = [
  { key: "nombre_escuela", label: "Nombre de la escuela", group: "Identidad" },
  { key: "lema", label: "Lema institucional", long: true, group: "Identidad" },
  { key: "direccion", label: "Dirección", group: "Contacto" },
  { key: "telefono", label: "Teléfono", group: "Contacto" },
  { key: "email", label: "Email de contacto", group: "Contacto" },
  { key: "horario", label: "Horario de atención", group: "Contacto" },
  { key: "mapa_lat", label: "Latitud (mapa)", placeholder: "-34.6037", group: "Ubicación en el mapa" },
  { key: "mapa_lng", label: "Longitud (mapa)", placeholder: "-58.3816", group: "Ubicación en el mapa" },
  { key: "mapa_zoom", label: "Zoom (1–20)", placeholder: "16", group: "Ubicación en el mapa" },
  { key: "mascota_titulo", label: "Título del bloque de la mascota", group: "Mascota (home)" },
  { key: "mascota_descripcion", label: "Descripción corta", long: true, group: "Mascota (home)" },
  { key: "mascota_video_url", label: "URL del video de la mascota (YouTube/Vimeo)", placeholder: "https://youtu.be/...", group: "Mascota (home)" },
  { key: "centro_presentacion", label: "Texto de presentación del Centro de Estudiantes", long: true, group: "Centro de Estudiantes" },
];

function AdminConfig() {
  const qc = useQueryClient();
  const { data: config = {} } = useQuery({
    queryKey: ["config_sitio"],
    queryFn: async () => {
      const { data, error } = await supabase.from("config_sitio").select("clave, valor");
      if (error) throw error;
      const map: Record<string, string> = {};
      for (const r of data ?? []) if (r.valor != null) map[r.clave] = r.valor;
      return map;
    },
  });

  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    const merged: Record<string, string> = {};
    for (const f of FIELDS) merged[f.key] = config[f.key] ?? SITE_DEFAULTS[f.key];
    setValues(merged);
  }, [config]);

  async function save() {
    setSaving(true);
    const rows = FIELDS.map((f) => ({ clave: f.key, valor: values[f.key]?.trim() ? values[f.key] : null }));
    const { error } = await supabase.from("config_sitio").upsert(rows);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Datos actualizados");
    qc.invalidateQueries({ queryKey: ["config_sitio"] });
  }

  const groups = Array.from(new Set(FIELDS.map((f) => f.group)));

  return (
    <section>
      <h1 className="font-serif text-2xl font-semibold">Datos institucionales</h1>
      <p className="text-sm text-muted-foreground">Estos datos se muestran en el encabezado, el pie de página, contacto y la home.</p>

      <div className="mt-6 space-y-6">
        {groups.map((g) => (
          <div key={g} className="rounded-md border border-border bg-card p-6">
            <h2 className="font-serif text-lg font-semibold">{g}</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {FIELDS.filter((f) => f.group === g).map((f) => (
                <div key={f.key} className={"space-y-1.5 " + (f.long ? "md:col-span-2" : "")}>
                  <Label htmlFor={f.key}>{f.label}</Label>
                  {f.long
                    ? <Textarea id={f.key} placeholder={f.placeholder} value={values[f.key] ?? ""} onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))} rows={3} />
                    : <Input id={f.key} placeholder={f.placeholder} value={values[f.key] ?? ""} onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))} />
                  }
                </div>
              ))}
            </div>
          </div>
        ))}
        <Button onClick={save} disabled={saving}>{saving ? "Guardando…" : "Guardar cambios"}</Button>
      </div>
    </section>
  );
}
