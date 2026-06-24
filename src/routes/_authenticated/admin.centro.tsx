import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/admin/centro")({
  component: AdminCentro,
});

type Integrante = { id: string; nombre: string; cargo: string; anio: string | null; foto_url: string | null; orden: number };

function AdminCentro() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Integrante | null>(null);
  const [openNew, setOpenNew] = useState(false);

  const { data: rows = [] } = useQuery({
    queryKey: ["admin", "centro_integrantes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("centro_integrantes")
        .select("id, nombre, cargo, anio, foto_url, orden")
        .order("orden");
      if (error) throw error;
      return data as Integrante[];
    },
  });

  const delMut = useMutation({
    mutationFn: async (i: Integrante) => {
      if (i.foto_url) {
        const idx = i.foto_url.indexOf("/proyectos/");
        if (idx >= 0) await supabase.storage.from("proyectos").remove([i.foto_url.slice(idx + "/proyectos/".length)]);
      }
      const { error } = await supabase.from("centro_integrantes").delete().eq("id", i.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Eliminado"); qc.invalidateQueries({ queryKey: ["admin", "centro_integrantes"] }); qc.invalidateQueries({ queryKey: ["centro", "publico"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section>
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold">Centro de Estudiantes</h1>
          <p className="text-sm text-muted-foreground">Integrantes que se muestran en la página pública del Centro.</p>
        </div>
        <Dialog open={openNew} onOpenChange={setOpenNew}>
          <DialogTrigger asChild><Button><Plus className="mr-1.5 h-4 w-4" />Agregar integrante</Button></DialogTrigger>
          <IntegranteForm onDone={() => { setOpenNew(false); qc.invalidateQueries({ queryKey: ["admin", "centro_integrantes"] }); qc.invalidateQueries({ queryKey: ["centro", "publico"] }); }} />
        </Dialog>
      </header>

      <div className="mt-6 overflow-hidden rounded-md border border-border bg-card">
        {rows.length === 0 ? (
          <p className="p-6 text-muted-foreground">Sin integrantes cargados.</p>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((i) => (
              <li key={i.id} className="flex items-center gap-4 p-4">
                {i.foto_url ? (
                  <img src={i.foto_url} alt="" className="h-12 w-12 rounded-full object-cover" />
                ) : (
                  <span aria-hidden className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary font-serif text-lg text-primary">{i.nombre.slice(0, 1)}</span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{i.nombre}</p>
                  <p className="text-xs text-muted-foreground">{i.cargo}{i.anio ? ` · ${i.anio}` : ""}</p>
                </div>
                <Dialog open={editing?.id === i.id} onOpenChange={(o) => setEditing(o ? i : null)}>
                  <DialogTrigger asChild><Button variant="outline" size="sm"><Pencil className="h-4 w-4" /></Button></DialogTrigger>
                  {editing?.id === i.id && (
                    <IntegranteForm initial={editing} onDone={() => { setEditing(null); qc.invalidateQueries({ queryKey: ["admin", "centro_integrantes"] }); qc.invalidateQueries({ queryKey: ["centro", "publico"] }); }} />
                  )}
                </Dialog>
                <Button variant="outline" size="sm" onClick={() => { if (confirm("¿Eliminar integrante?")) delMut.mutate(i); }}><Trash2 className="h-4 w-4" /></Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function IntegranteForm({ initial, onDone }: { initial?: Integrante; onDone: () => void }) {
  const [nombre, setNombre] = useState(initial?.nombre ?? "");
  const [cargo, setCargo] = useState(initial?.cargo ?? "");
  const [anio, setAnio] = useState(initial?.anio ?? "");
  const [orden, setOrden] = useState(initial?.orden?.toString() ?? "0");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim() || !cargo.trim()) { toast.error("Ingresá nombre y cargo"); return; }
    setSaving(true);
    let foto_url = initial?.foto_url ?? null;
    if (file) {
      const path = `centro/${crypto.randomUUID()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("proyectos").upload(path, file);
      if (upErr) { setSaving(false); toast.error(upErr.message); return; }
      foto_url = supabase.storage.from("proyectos").getPublicUrl(path).data.publicUrl;
    }
    const payload = { nombre: nombre.trim(), cargo: cargo.trim(), anio: anio.trim() || null, foto_url, orden: Number(orden) || 0 };
    const op = initial
      ? supabase.from("centro_integrantes").update(payload).eq("id", initial.id)
      : supabase.from("centro_integrantes").insert(payload);
    const { error } = await op;
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Guardado"); onDone();
  }

  return (
    <DialogContent>
      <DialogHeader><DialogTitle>{initial ? "Editar integrante" : "Nuevo integrante"}</DialogTitle></DialogHeader>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5"><Label htmlFor="i-nom">Nombre</Label><Input id="i-nom" value={nombre} onChange={(e) => setNombre(e.target.value)} required /></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5"><Label htmlFor="i-car">Cargo</Label><Input id="i-car" value={cargo} onChange={(e) => setCargo(e.target.value)} required /></div>
          <div className="space-y-1.5"><Label htmlFor="i-ani">Curso/Año (opcional)</Label><Input id="i-ani" value={anio} onChange={(e) => setAnio(e.target.value)} /></div>
        </div>
        <div className="space-y-1.5"><Label htmlFor="i-ord">Orden</Label><Input id="i-ord" type="number" value={orden} onChange={(e) => setOrden(e.target.value)} /></div>
        <div className="space-y-1.5"><Label htmlFor="i-foto">Foto (opcional)</Label><Input id="i-foto" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></div>
        <DialogFooter><Button type="submit" disabled={saving}>{saving ? "Guardando…" : "Guardar"}</Button></DialogFooter>
      </form>
    </DialogContent>
  );
}
