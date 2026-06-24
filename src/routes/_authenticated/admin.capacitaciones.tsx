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
import { CAPACITACION_ESTADOS } from "@/lib/site-config";

export const Route = createFileRoute("/_authenticated/admin/capacitaciones")({
  component: AdminCapacitaciones,
});

type Cap = {
  id: string;
  nombre: string;
  descripcion: string | null;
  aula: string | null;
  dias: string | null;
  horario: string | null;
  responsable: string | null;
  destinatarios: string | null;
  cupo: number | null;
  estado: string;
  destacado: boolean;
  orden: number;
};

function AdminCapacitaciones() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Cap | null>(null);
  const [openNew, setOpenNew] = useState(false);

  const { data: rows = [] } = useQuery({
    queryKey: ["admin", "capacitaciones"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("capacitaciones")
        .select("id, nombre, descripcion, aula, dias, horario, responsable, destinatarios, cupo, estado, destacado, orden")
        .order("destacado", { ascending: false })
        .order("orden");
      if (error) throw error;
      return data as Cap[];
    },
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("capacitaciones").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Eliminada"); qc.invalidateQueries({ queryKey: ["admin", "capacitaciones"] }); qc.invalidateQueries({ queryKey: ["capacitaciones", "proximas"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section>
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold">Capacitaciones especiales</h1>
          <p className="text-sm text-muted-foreground">Cursos y talleres con aula, horarios y responsable.</p>
        </div>
        <Dialog open={openNew} onOpenChange={setOpenNew}>
          <DialogTrigger asChild><Button><Plus className="mr-1.5 h-4 w-4" />Nueva</Button></DialogTrigger>
          <CapForm onDone={() => { setOpenNew(false); qc.invalidateQueries({ queryKey: ["admin", "capacitaciones"] }); qc.invalidateQueries({ queryKey: ["capacitaciones", "proximas"] }); }} />
        </Dialog>
      </header>

      <div className="mt-6 overflow-hidden rounded-md border border-border bg-card">
        {rows.length === 0 ? (
          <p className="p-6 text-muted-foreground">Sin capacitaciones cargadas.</p>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((c) => (
              <li key={c.id} className="flex items-start gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded bg-secondary px-2 py-0.5 font-medium">{CAPACITACION_ESTADOS.find((e) => e.value === c.estado)?.label ?? c.estado}</span>
                    {c.destacado && <span className="inline-flex items-center gap-1 text-amber-700"><Star className="h-3 w-3" /> Destacada</span>}
                  </div>
                  <h3 className="mt-1 font-medium">{c.nombre}</h3>
                  <p className="text-xs text-muted-foreground">
                    {[c.aula, [c.dias, c.horario].filter(Boolean).join(" "), c.responsable].filter(Boolean).join(" · ")}
                  </p>
                  {c.descripcion && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{c.descripcion}</p>}
                </div>
                <div className="flex flex-col gap-2">
                  <Dialog open={editing?.id === c.id} onOpenChange={(o) => setEditing(o ? c : null)}>
                    <DialogTrigger asChild><Button variant="outline" size="sm"><Pencil className="h-4 w-4" /></Button></DialogTrigger>
                    {editing?.id === c.id && (
                      <CapForm initial={editing} onDone={() => { setEditing(null); qc.invalidateQueries({ queryKey: ["admin", "capacitaciones"] }); qc.invalidateQueries({ queryKey: ["capacitaciones", "proximas"] }); }} />
                    )}
                  </Dialog>
                  <Button variant="outline" size="sm" onClick={() => { if (confirm("¿Eliminar?")) delMut.mutate(c.id); }}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function CapForm({ initial, onDone }: { initial?: Cap; onDone: () => void }) {
  const [v, setV] = useState({
    nombre: initial?.nombre ?? "",
    descripcion: initial?.descripcion ?? "",
    aula: initial?.aula ?? "",
    dias: initial?.dias ?? "",
    horario: initial?.horario ?? "",
    responsable: initial?.responsable ?? "",
    destinatarios: initial?.destinatarios ?? "",
    cupo: initial?.cupo?.toString() ?? "",
    estado: initial?.estado ?? "abierta",
    destacado: initial?.destacado ?? false,
  });
  const [saving, setSaving] = useState(false);
  const u = <K extends keyof typeof v>(k: K, val: typeof v[K]) => setV((s) => ({ ...s, [k]: val }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!v.nombre.trim()) { toast.error("Ingresá un nombre"); return; }
    setSaving(true);
    const payload = {
      nombre: v.nombre.trim(),
      descripcion: v.descripcion.trim() || null,
      aula: v.aula.trim() || null,
      dias: v.dias.trim() || null,
      horario: v.horario.trim() || null,
      responsable: v.responsable.trim() || null,
      destinatarios: v.destinatarios.trim() || null,
      cupo: v.cupo ? Number(v.cupo) : null,
      estado: v.estado,
      destacado: v.destacado,
    };
    const op = initial
      ? supabase.from("capacitaciones").update(payload).eq("id", initial.id)
      : supabase.from("capacitaciones").insert(payload);
    const { error } = await op;
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Guardada"); onDone();
  }

  return (
    <DialogContent className="max-w-xl">
      <DialogHeader><DialogTitle>{initial ? "Editar capacitación" : "Nueva capacitación"}</DialogTitle></DialogHeader>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="c-nom">Nombre</Label>
          <Input id="c-nom" value={v.nombre} onChange={(e) => u("nombre", e.target.value)} required maxLength={200} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="c-desc">Descripción</Label>
          <Textarea id="c-desc" rows={3} value={v.descripcion} onChange={(e) => u("descripcion", e.target.value)} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5"><Label htmlFor="c-aula">Aula</Label><Input id="c-aula" value={v.aula} onChange={(e) => u("aula", e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="c-resp">Responsable</Label><Input id="c-resp" value={v.responsable} onChange={(e) => u("responsable", e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="c-dias">Días</Label><Input id="c-dias" placeholder="Lun y Mié" value={v.dias} onChange={(e) => u("dias", e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="c-hor">Horario</Label><Input id="c-hor" placeholder="18:00 a 20:00" value={v.horario} onChange={(e) => u("horario", e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="c-dest">Destinatarios</Label><Input id="c-dest" value={v.destinatarios} onChange={(e) => u("destinatarios", e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="c-cupo">Cupo</Label><Input id="c-cupo" type="number" min={0} value={v.cupo} onChange={(e) => u("cupo", e.target.value)} /></div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="c-est">Estado</Label>
            <Select value={v.estado} onValueChange={(val) => u("estado", val)}>
              <SelectTrigger id="c-est"><SelectValue /></SelectTrigger>
              <SelectContent>{CAPACITACION_ESTADOS.map((e) => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Switch id="c-destacado" checked={v.destacado} onCheckedChange={(val) => u("destacado", val)} />
          <Label htmlFor="c-destacado">Destacar en la home</Label>
        </div>
        <DialogFooter><Button type="submit" disabled={saving}>{saving ? "Guardando…" : "Guardar"}</Button></DialogFooter>
      </form>
    </DialogContent>
  );
}
