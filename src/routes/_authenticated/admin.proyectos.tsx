import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { ESPECIALIDADES } from "@/lib/site-config";

export const Route = createFileRoute("/_authenticated/admin/proyectos")({
  component: AdminProyectos,
});

type Proyecto = {
  id: string;
  titulo: string;
  descripcion: string;
  especialidad: string;
  anio: number | null;
  autores: string | null;
  foto_url: string | null;
  destacado: boolean;
  orden: number;
};

function AdminProyectos() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Proyecto | null>(null);
  const [openNew, setOpenNew] = useState(false);

  const { data: rows = [] } = useQuery({
    queryKey: ["admin", "proyectos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("proyectos")
        .select("id, titulo, descripcion, especialidad, anio, autores, foto_url, destacado, orden")
        .order("destacado", { ascending: false })
        .order("orden");
      if (error) throw error;
      return data as Proyecto[];
    },
  });

  const delMut = useMutation({
    mutationFn: async (p: Proyecto) => {
      if (p.foto_url) {
        const idx = p.foto_url.indexOf("/proyectos/");
        if (idx >= 0) {
          const path = p.foto_url.slice(idx + "/proyectos/".length);
          await supabase.storage.from("proyectos").remove([path]);
        }
      }
      const { error } = await supabase.from("proyectos").delete().eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Proyecto eliminado"); qc.invalidateQueries({ queryKey: ["admin", "proyectos"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section>
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold">Proyectos de alumnos</h1>
          <p className="text-sm text-muted-foreground">Cargá proyectos con foto y descripción para cada especialidad.</p>
        </div>
        <Dialog open={openNew} onOpenChange={setOpenNew}>
          <DialogTrigger asChild><Button><Plus className="mr-1.5 h-4 w-4" />Nuevo proyecto</Button></DialogTrigger>
          <ProyectoForm onDone={() => { setOpenNew(false); qc.invalidateQueries({ queryKey: ["admin", "proyectos"] }); }} />
        </Dialog>
      </header>

      <div className="mt-6 overflow-hidden rounded-md border border-border bg-card">
        {rows.length === 0 ? (
          <p className="p-6 text-muted-foreground">Todavía no se cargaron proyectos.</p>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((p) => (
              <li key={p.id} className="flex items-start gap-4 p-4">
                {p.foto_url && <img src={p.foto_url} alt="" className="h-16 w-24 rounded object-cover" />}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded bg-secondary px-2 py-0.5 font-medium">
                      {ESPECIALIDADES.find((e) => e.codigo === p.especialidad)?.nombre ?? p.especialidad}
                    </span>
                    {p.anio && <span className="text-muted-foreground">{p.anio}</span>}
                    {p.destacado && <span className="inline-flex items-center gap-1 text-amber-700"><Star className="h-3 w-3" />Destacado</span>}
                  </div>
                  <h3 className="mt-1 font-medium">{p.titulo}</h3>
                  {p.autores && <p className="text-xs text-muted-foreground">{p.autores}</p>}
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.descripcion}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <Dialog open={editing?.id === p.id} onOpenChange={(o) => setEditing(o ? p : null)}>
                    <DialogTrigger asChild><Button variant="outline" size="sm"><Pencil className="h-4 w-4" /></Button></DialogTrigger>
                    {editing?.id === p.id && (
                      <ProyectoForm initial={editing} onDone={() => { setEditing(null); qc.invalidateQueries({ queryKey: ["admin", "proyectos"] }); }} />
                    )}
                  </Dialog>
                  <Button variant="outline" size="sm" onClick={() => { if (confirm("¿Eliminar proyecto?")) delMut.mutate(p); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function ProyectoForm({ initial, onDone }: { initial?: Proyecto; onDone: () => void }) {
  const [titulo, setTitulo] = useState(initial?.titulo ?? "");
  const [descripcion, setDescripcion] = useState(initial?.descripcion ?? "");
  const [especialidad, setEspecialidad] = useState(initial?.especialidad ?? "informatica");
  const [anio, setAnio] = useState<string>(initial?.anio?.toString() ?? "");
  const [autores, setAutores] = useState(initial?.autores ?? "");
  const [destacado, setDestacado] = useState(initial?.destacado ?? false);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim() || !descripcion.trim()) { toast.error("Completá título y descripción"); return; }
    setSaving(true);
    let foto_url = initial?.foto_url ?? null;
    if (file) {
      const path = `${especialidad}/${crypto.randomUUID()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("proyectos").upload(path, file);
      if (upErr) { setSaving(false); toast.error(upErr.message); return; }
      const { data: pub } = supabase.storage.from("proyectos").getPublicUrl(path);
      foto_url = pub.publicUrl;
    }
    const payload = {
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      especialidad,
      anio: anio ? Number(anio) : null,
      autores: autores.trim() || null,
      foto_url,
      destacado,
    };
    const op = initial
      ? supabase.from("proyectos").update(payload).eq("id", initial.id)
      : supabase.from("proyectos").insert(payload);
    const { error } = await op;
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(initial ? "Proyecto actualizado" : "Proyecto publicado");
    onDone();
  }

  return (
    <DialogContent className="max-w-xl">
      <DialogHeader><DialogTitle>{initial ? "Editar proyecto" : "Nuevo proyecto"}</DialogTitle></DialogHeader>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="p-esp">Especialidad</Label>
            <Select value={especialidad} onValueChange={setEspecialidad}>
              <SelectTrigger id="p-esp"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ESPECIALIDADES.map((e) => <SelectItem key={e.codigo} value={e.codigo}>{e.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-anio">Año (opcional)</Label>
            <Input id="p-anio" type="number" min={2000} max={2100} value={anio} onChange={(e) => setAnio(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p-tit">Título</Label>
          <Input id="p-tit" value={titulo} onChange={(e) => setTitulo(e.target.value)} required maxLength={200} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p-aut">Autores</Label>
          <Input id="p-aut" value={autores} onChange={(e) => setAutores(e.target.value)} placeholder="Nombres separados por coma" maxLength={300} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p-desc">Descripción</Label>
          <Textarea id="p-desc" rows={5} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} required maxLength={5000} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p-foto">Foto {initial?.foto_url && "(dejar vacío para mantener)"}</Label>
          <Input id="p-foto" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </div>
        <div className="flex items-center gap-2">
          <Switch id="p-dest" checked={destacado} onCheckedChange={setDestacado} />
          <Label htmlFor="p-dest">Destacar</Label>
        </div>
        <DialogFooter>
          <Button type="submit" disabled={saving}>{saving ? "Guardando…" : "Guardar"}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
