import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ESPECIALIDADES } from "@/lib/site-config";

export const Route = createFileRoute("/_authenticated/admin/especialidades")({
  component: AdminEspecialidades,
});

type Esp = { codigo: string; nombre: string; descripcion: string | null; video_url: string | null; salida_laboral: string | null };

function AdminEspecialidades() {
  const qc = useQueryClient();
  const { data: rows = [] } = useQuery({
    queryKey: ["admin", "especialidades"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("especialidades")
        .select("codigo, nombre, descripcion, video_url, salida_laboral")
        .order("orden");
      if (error) throw error;
      return data as Esp[];
    },
  });

  return (
    <section>
      <h1 className="font-serif text-2xl font-semibold">Especialidades y Ciclo Básico</h1>
      <p className="text-sm text-muted-foreground">Editá la descripción, el video introductorio y el perfil del egresado.</p>
      <div className="mt-6 space-y-6">
        {ESPECIALIDADES.map((e) => {
          const row = rows.find((r) => r.codigo === e.codigo) ?? null;
          return <EspForm key={e.codigo} codigo={e.codigo} nombre={e.nombre} row={row} onSaved={() => qc.invalidateQueries({ queryKey: ["admin", "especialidades"] })} />;
        })}
      </div>
    </section>
  );
}

function EspForm({ codigo, nombre, row, onSaved }: { codigo: string; nombre: string; row: Esp | null; onSaved: () => void }) {
  const [descripcion, setDescripcion] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [salida, setSalida] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDescripcion(row?.descripcion ?? "");
    setVideoUrl(row?.video_url ?? "");
    setSalida(row?.salida_laboral ?? "");
  }, [row]);

  async function save() {
    setSaving(true);
    const payload = {
      codigo: codigo as any,
      nombre,
      descripcion: descripcion.trim() || null,
      video_url: videoUrl.trim() || null,
      salida_laboral: salida.trim() || null,
    };
    const { error } = await supabase.from("especialidades").upsert(payload, { onConflict: "codigo" });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`${nombre} actualizada`);
    onSaved();
  }

  return (
    <div className="rounded-md border border-border bg-card p-6">
      <h2 className="font-serif text-lg font-semibold">{nombre}</h2>
      <div className="mt-4 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor={`d-${codigo}`}>Descripción</Label>
          <Textarea id={`d-${codigo}`} rows={3} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`v-${codigo}`}>URL del video introductorio (YouTube/Vimeo)</Label>
          <Input id={`v-${codigo}`} placeholder="https://youtu.be/..." value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`s-${codigo}`}>Perfil del egresado / salida laboral</Label>
          <Textarea id={`s-${codigo}`} rows={4} value={salida} onChange={(e) => setSalida(e.target.value)} />
        </div>
        <Button onClick={save} disabled={saving}>{saving ? "Guardando…" : "Guardar"}</Button>
      </div>
    </div>
  );
}
