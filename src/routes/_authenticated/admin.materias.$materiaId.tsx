import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { RECURSO_TIPOS } from "@/lib/site-config";

export const Route = createFileRoute("/_authenticated/admin/materias/$materiaId")({
  component: AdminMateriaRecursos,
});

const schema = z.object({
  titulo: z.string().trim().min(1).max(200),
  descripcion: z.string().trim().max(2000).optional(),
  tipo: z.enum(["apunte", "guia", "video", "bibliografia"]),
  url: z.string().url().optional().or(z.literal("")),
  etiquetas: z.string().optional(),
});

function AdminMateriaRecursos() {
  const { materiaId } = Route.useParams();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: materia } = useQuery({
    queryKey: ["admin", "materia", materiaId],
    queryFn: async () => {
      const { data } = await supabase.from("materias").select("id, nombre, anio, especialidad").eq("id", materiaId).maybeSingle();
      return data;
    },
  });

  const { data: recursos = [] } = useQuery({
    queryKey: ["admin", "recursos", materiaId],
    queryFn: async () => {
      const { data, error } = await supabase.from("recursos").select("id, titulo, descripcion, tipo, url, archivo_path, etiquetas").eq("materia_id", materiaId).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("recursos").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Recurso eliminado"); qc.invalidateQueries({ queryKey: ["admin", "recursos", materiaId] }); },
  });

  return (
    <section>
      <Link to="/admin/materias" className="text-sm text-primary hover:underline">← Volver a materias</Link>
      <header className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold">{materia?.nombre ?? "Materia"}</h1>
          {materia && <p className="text-sm text-muted-foreground">{materia.anio}º año · {materia.especialidad}</p>}
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-1.5 h-4 w-4" />Nuevo recurso</Button></DialogTrigger>
          <RecursoForm materiaId={materiaId} onDone={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["admin", "recursos", materiaId] }); }} />
        </Dialog>
      </header>

      <ul className="mt-6 divide-y divide-border rounded-md border border-border bg-card">
        {recursos.length === 0 ? <li className="p-6 text-muted-foreground">Sin recursos.</li> : recursos.map((r) => (
          <li key={r.id} className="flex items-start gap-4 p-4">
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{r.tipo}</p>
              <h3 className="font-medium">{r.titulo}</h3>
              {r.descripcion && <p className="mt-1 text-sm text-muted-foreground">{r.descripcion}</p>}
              {(r.url || r.archivo_path) && <a href={r.url ?? "#"} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-primary hover:underline">{r.url || r.archivo_path}</a>}
              {r.etiquetas?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">{r.etiquetas.map((e: string) => <span key={e} className="rounded bg-secondary px-2 py-0.5 text-xs">{e}</span>)}</div>
              )}
            </div>
            <Button size="sm" variant="outline" onClick={() => { if (confirm("¿Eliminar recurso?")) del.mutate(r.id); }}><Trash2 className="h-4 w-4" /></Button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function RecursoForm({ materiaId, onDone }: { materiaId: string; onDone: () => void }) {
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [tipo, setTipo] = useState("apunte");
  const [url, setUrl] = useState("");
  const [etiquetas, setEtiquetas] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ titulo, descripcion: descripcion || undefined, tipo, url, etiquetas });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setSaving(true);
    let archivo_path: string | null = null;
    if (archivo) {
      const path = `${materiaId}/${crypto.randomUUID()}-${archivo.name}`;
      const { error: upErr } = await supabase.storage.from("recursos").upload(path, archivo);
      if (upErr) { setSaving(false); toast.error("No se pudo subir el archivo: " + upErr.message); return; }
      archivo_path = path;
    }
    const tags = parsed.data.etiquetas ? parsed.data.etiquetas.split(",").map((s) => s.trim()).filter(Boolean) : [];
    const { error } = await supabase.from("recursos").insert({
      materia_id: materiaId,
      titulo: parsed.data.titulo,
      descripcion: parsed.data.descripcion ?? null,
      tipo: parsed.data.tipo as any,
      url: parsed.data.url || null,
      archivo_path,
      etiquetas: tags,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Recurso creado"); onDone();
  }

  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Nuevo recurso</DialogTitle></DialogHeader>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5"><Label>Título</Label><Input value={titulo} onChange={(e) => setTitulo(e.target.value)} required maxLength={200} /></div>
        <div className="space-y-1.5"><Label>Descripción</Label><Textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={3} maxLength={2000} /></div>
        <div className="space-y-1.5">
          <Label>Tipo</Label>
          <Select value={tipo} onValueChange={setTipo}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{RECURSO_TIPOS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5"><Label>URL (link externo, opcional)</Label><Input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" /></div>
        <div className="space-y-1.5"><Label>Archivo (opcional)</Label><Input type="file" onChange={(e) => setArchivo(e.target.files?.[0] ?? null)} /></div>
        <div className="space-y-1.5"><Label>Etiquetas (separadas por coma)</Label><Input value={etiquetas} onChange={(e) => setEtiquetas(e.target.value)} placeholder="parcial, trabajo práctico" /></div>
        <DialogFooter><Button type="submit" disabled={saving}>{saving ? "Guardando…" : "Crear"}</Button></DialogFooter>
      </form>
    </DialogContent>
  );
}
