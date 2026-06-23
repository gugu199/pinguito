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

const FIELDS: Array<{ key: SiteConfigKey; label: string; long?: boolean }> = [
  { key: "nombre_escuela", label: "Nombre de la escuela" },
  { key: "lema", label: "Lema institucional", long: true },
  { key: "direccion", label: "Dirección" },
  { key: "telefono", label: "Teléfono" },
  { key: "email", label: "Email de contacto" },
  { key: "horario", label: "Horario de atención" },
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
    const rows = FIELDS.map((f) => ({ clave: f.key, valor: values[f.key] ?? null }));
    const { error } = await supabase.from("config_sitio").upsert(rows);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Datos actualizados");
    qc.invalidateQueries({ queryKey: ["config_sitio"] });
  }

  return (
    <section>
      <h1 className="font-serif text-2xl font-semibold">Datos institucionales</h1>
      <p className="text-sm text-muted-foreground">Estos datos se muestran en el encabezado, el pie de página y la sección de contacto.</p>

      <div className="mt-6 space-y-4 rounded-md border border-border bg-card p-6">
        {FIELDS.map((f) => (
          <div key={f.key} className="space-y-1.5">
            <Label htmlFor={f.key}>{f.label}</Label>
            {f.long
              ? <Textarea id={f.key} value={values[f.key] ?? ""} onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))} rows={2} />
              : <Input id={f.key} value={values[f.key] ?? ""} onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))} />
            }
          </div>
        ))}
        <Button onClick={save} disabled={saving}>{saving ? "Guardando…" : "Guardar cambios"}</Button>
      </div>
    </section>
  );
}
