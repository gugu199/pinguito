import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { EVENTO_TIPOS } from "@/lib/site-config";

export const Route = createFileRoute("/_authenticated/admin/calendario")({
  component: AdminCalendario,
});

type Evento = {
  id: string;
  titulo: string;
  descripcion: string | null;
  tipo: "examen" | "actividad" | "evento";
  fecha_inicio: string;
  fecha_fin: string | null;
};

const schema = z.object({
  titulo: z.string().trim().min(1).max(200),
  descripcion: z.string().trim().max(2000).optional(),
  tipo: z.enum(["examen", "actividad", "evento"]),
  fecha_inicio: z.string().min(1, "Fecha requerida"),
  fecha_fin: z.string().optional(),
});

function AdminCalendario() {
  const qc = useQueryClient();
  const [openNew, setOpenNew] = useState(false);
  const [editing, setEditing] = useState<Evento | null>(null);

  const { data = [] } = useQuery({
    queryKey: ["admin", "eventos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("eventos_calendario")
        .select("id, titulo, descripcion, tipo, fecha_inicio, fecha_fin")
        .order("fecha_inicio", { ascending: true });
      if (error) throw error;
      return data as Evento[];
    },
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("eventos_calendario").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Evento eliminado"); qc.invalidateQueries({ queryKey: ["admin", "eventos"] }); qc.invalidateQueries({ queryKey: ["eventos"] }); },
  });

  return (
    <section>
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold">Calendario</h1>
          <p className="text-sm text-muted-foreground">Exámenes, actividades y eventos.</p>
        </div>
        <Dialog open={openNew} onOpenChange={setOpenNew}>
          <DialogTrigger asChild><Button><Plus className="mr-1.5 h-4 w-4" />Nuevo evento</Button></DialogTrigger>
          <EventoForm onDone={() => { setOpenNew(false); qc.invalidateQueries({ queryKey: ["admin", "eventos"] }); qc.invalidateQueries({ queryKey: ["eventos"] }); }} />
        </Dialog>
      </header>

      <ul className="mt-6 divide-y divide-border rounded-md border border-border bg-card">
        {data.length === 0 ? <li className="p-6 text-muted-foreground">Sin eventos.</li> : data.map((e) => (
          <li key={e.id} className="flex items-start gap-4 p-4">
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{e.tipo} · {new Date(e.fecha_inicio).toLocaleString("es-AR")}</p>
              <h3 className="mt-1 font-medium">{e.titulo}</h3>
              {e.descripcion && <p className="mt-1 text-sm text-muted-foreground">{e.descripcion}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Dialog open={editing?.id === e.id} onOpenChange={(o) => setEditing(o ? e : null)}>
                <DialogTrigger asChild><Button size="sm" variant="outline"><Pencil className="h-4 w-4" /></Button></DialogTrigger>
                {editing?.id === e.id && <EventoForm initial={editing} onDone={() => { setEditing(null); qc.invalidateQueries({ queryKey: ["admin", "eventos"] }); qc.invalidateQueries({ queryKey: ["eventos"] }); }} />}
              </Dialog>
              <Button size="sm" variant="outline" onClick={() => { if (confirm("¿Eliminar evento?")) delMut.mutate(e.id); }}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function EventoForm({ initial, onDone }: { initial?: Evento; onDone: () => void }) {
  const toLocal = (iso: string) => iso ? new Date(iso).toISOString().slice(0, 16) : "";
  const [titulo, setTitulo] = useState(initial?.titulo ?? "");
  const [descripcion, setDescripcion] = useState(initial?.descripcion ?? "");
  const [tipo, setTipo] = useState<Evento["tipo"]>(initial?.tipo ?? "actividad");
  const [fechaInicio, setFechaInicio] = useState(initial ? toLocal(initial.fecha_inicio) : "");
  const [fechaFin, setFechaFin] = useState(initial?.fecha_fin ? toLocal(initial.fecha_fin) : "");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ titulo, descripcion: descripcion || undefined, tipo, fecha_inicio: fechaInicio, fecha_fin: fechaFin || undefined });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setSaving(true);
    const payload = {
      titulo: parsed.data.titulo,
      descripcion: parsed.data.descripcion ?? null,
      tipo: parsed.data.tipo,
      fecha_inicio: new Date(parsed.data.fecha_inicio).toISOString(),
      fecha_fin: parsed.data.fecha_fin ? new Date(parsed.data.fecha_fin).toISOString() : null,
    };
    const { error } = initial
      ? await supabase.from("eventos_calendario").update(payload).eq("id", initial.id)
      : await supabase.from("eventos_calendario").insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(initial ? "Evento actualizado" : "Evento creado");
    onDone();
  }

  return (
    <DialogContent>
      <DialogHeader><DialogTitle>{initial ? "Editar evento" : "Nuevo evento"}</DialogTitle></DialogHeader>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="tipo">Tipo</Label>
          <Select value={tipo} onValueChange={(v) => setTipo(v as Evento["tipo"])}>
            <SelectTrigger id="tipo"><SelectValue /></SelectTrigger>
            <SelectContent>
              {EVENTO_TIPOS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="titulo">Título</Label>
          <Input id="titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} required maxLength={200} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="fi">Inicio</Label>
            <Input id="fi" type="datetime-local" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ff">Fin (opcional)</Label>
            <Input id="ff" type="datetime-local" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="desc">Descripción</Label>
          <Textarea id="desc" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={4} maxLength={2000} />
        </div>
        <DialogFooter><Button type="submit" disabled={saving}>{saving ? "Guardando…" : "Guardar"}</Button></DialogFooter>
      </form>
    </DialogContent>
  );
}
