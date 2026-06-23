import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/admin/galeria")({
  component: AdminGaleria,
});

function AdminGaleria() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const { data: albumes = [] } = useQuery({
    queryKey: ["admin", "albumes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("galeria_albumes").select("id, titulo, descripcion, fecha, cover_path").order("fecha", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return data;
    },
  });

  const delAlbum = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("galeria_albumes").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Álbum eliminado"); qc.invalidateQueries({ queryKey: ["admin", "albumes"] }); },
  });

  return (
    <section>
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold">Galería</h1>
          <p className="text-sm text-muted-foreground">Cargá álbumes y subí fotos.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-1.5 h-4 w-4" />Nuevo álbum</Button></DialogTrigger>
          <AlbumForm onDone={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["admin", "albumes"] }); }} />
        </Dialog>
      </header>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {albumes.length === 0 && <p className="text-muted-foreground">Todavía no hay álbumes.</p>}
        {albumes.map((a) => (
          <div key={a.id} className="rounded-md border border-border bg-card p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium">{a.titulo}</h3>
                {a.fecha && <p className="text-xs text-muted-foreground">{new Date(a.fecha).toLocaleDateString("es-AR")}</p>}
              </div>
              <Button size="sm" variant="outline" onClick={() => { if (confirm("¿Eliminar álbum y sus fotos?")) delAlbum.mutate(a.id); }}><Trash2 className="h-4 w-4" /></Button>
            </div>
            {a.descripcion && <p className="mt-1 text-sm text-muted-foreground">{a.descripcion}</p>}
            <Button variant="link" className="mt-2 px-0" onClick={() => setSelected(selected === a.id ? null : a.id)}>
              {selected === a.id ? "Ocultar fotos" : "Gestionar fotos"}
            </Button>
            {selected === a.id && <FotosManager albumId={a.id} />}
          </div>
        ))}
      </div>
    </section>
  );
}

function AlbumForm({ onDone }: { onDone: () => void }) {
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fecha, setFecha] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim()) { toast.error("Ingresá un título"); return; }
    setSaving(true);
    const { error } = await supabase.from("galeria_albumes").insert({
      titulo: titulo.trim(),
      descripcion: descripcion.trim() || null,
      fecha: fecha || null,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Álbum creado"); onDone();
  }

  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Nuevo álbum</DialogTitle></DialogHeader>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5"><Label>Título</Label><Input value={titulo} onChange={(e) => setTitulo(e.target.value)} required maxLength={200} /></div>
        <div className="space-y-1.5"><Label>Fecha</Label><Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Descripción</Label><Textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={3} maxLength={1000} /></div>
        <DialogFooter><Button type="submit" disabled={saving}>{saving ? "Guardando…" : "Crear"}</Button></DialogFooter>
      </form>
    </DialogContent>
  );
}

function FotosManager({ albumId }: { albumId: string }) {
  const qc = useQueryClient();
  const [alt, setAlt] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: fotos = [] } = useQuery({
    queryKey: ["admin", "fotos", albumId],
    queryFn: async () => {
      const { data, error } = await supabase.from("galeria_fotos").select("id, storage_path, alt, orden").eq("album_id", albumId).order("orden");
      if (error) throw error;
      return data;
    },
  });

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !alt.trim()) { toast.error("Subí una imagen y describila"); return; }
    setUploading(true);
    const path = `${albumId}/${crypto.randomUUID()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from("galeria").upload(path, file);
    if (upErr) { setUploading(false); toast.error(upErr.message); return; }
    const { error } = await supabase.from("galeria_fotos").insert({ album_id: albumId, storage_path: path, alt: alt.trim() });
    setUploading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Foto agregada");
    setAlt(""); setFile(null);
    qc.invalidateQueries({ queryKey: ["admin", "fotos", albumId] });
    qc.invalidateQueries({ queryKey: ["galeria_albumes"] });
  }

  async function del(id: string, path: string) {
    if (!confirm("¿Eliminar foto?")) return;
    await supabase.storage.from("galeria").remove([path]);
    await supabase.from("galeria_fotos").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin", "fotos", albumId] });
  }

  return (
    <div className="mt-3 space-y-3 border-t border-border pt-3">
      <form onSubmit={upload} className="space-y-2">
        <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <Input value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="Descripción para accesibilidad (alt)" maxLength={200} />
        <Button type="submit" size="sm" disabled={uploading}>{uploading ? "Subiendo…" : "Agregar foto"}</Button>
      </form>
      <ul className="grid grid-cols-3 gap-2">
        {fotos.map((f) => (
          <li key={f.id} className="relative">
            <div className="aspect-square overflow-hidden rounded border border-border bg-secondary text-xs text-muted-foreground">
              <span className="block truncate p-2">{f.alt}</span>
            </div>
            <button onClick={() => del(f.id, f.storage_path)} className="absolute right-1 top-1 rounded bg-card/90 p-1 text-destructive" aria-label="Eliminar foto"><Trash2 className="h-3 w-3" /></button>
          </li>
        ))}
      </ul>
    </div>
  );
}
