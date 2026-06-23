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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { ESPECIALIDADES } from "@/lib/site-config";

export const Route = createFileRoute("/_authenticated/admin/materias")({
  component: AdminMaterias,
});

const schema = z.object({
  nombre: z.string().trim().min(1).max(200),
  especialidad: z.enum(["ciclo_basico", "informatica", "alimentos", "electronica"]),
  anio: z.number().int().min(1).max(7),
});

function AdminMaterias() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [esp, setEsp] = useState<string>("ciclo_basico");

  const { data = [] } = useQuery({
    queryKey: ["admin", "materias", esp],
    queryFn: async () => {
      const { data, error } = await supabase.from("materias").select("id, nombre, anio, especialidad").eq("especialidad", esp as any).order("anio").order("orden");
      if (error) throw error;
      return data;
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("materias").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Materia eliminada"); qc.invalidateQueries({ queryKey: ["admin", "materias"] }); },
  });

  return (
    <section>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold">Materias y recursos</h1>
          <p className="text-sm text-muted-foreground">Organizá las materias por especialidad y año. Hacé click en una para gestionar sus recursos.</p>
        </div>
        <div className="flex items-end gap-2">
          <div className="w-56">
            <Label>Especialidad</Label>
            <Select value={esp} onValueChange={setEsp}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ESPECIALIDADES.map((e) => <SelectItem key={e.codigo} value={e.codigo}>{e.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="mr-1.5 h-4 w-4" />Nueva materia</Button></DialogTrigger>
            <MateriaForm especialidadDefault={esp} onDone={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["admin", "materias"] }); }} />
          </Dialog>
        </div>
      </header>

      <ul className="mt-6 divide-y divide-border rounded-md border border-border bg-card">
        {data.length === 0 ? <li className="p-6 text-muted-foreground">Sin materias cargadas.</li> : data.map((m) => (
          <li key={m.id} className="flex items-center justify-between gap-4 p-4">
            <Link to="/admin/materias/$materiaId" params={{ materiaId: m.id }} className="min-w-0 flex-1 hover:text-primary">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{m.anio}º año</p>
              <h3 className="font-medium">{m.nombre}</h3>
            </Link>
            <Button size="sm" variant="outline" onClick={() => { if (confirm("¿Eliminar materia (y sus recursos)?")) del.mutate(m.id); }}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function MateriaForm({ especialidadDefault, onDone }: { especialidadDefault: string; onDone: () => void }) {
  const [nombre, setNombre] = useState("");
  const [esp, setEsp] = useState(especialidadDefault);
  const [anio, setAnio] = useState<number>(1);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ nombre, especialidad: esp, anio });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setSaving(true);
    const { error } = await supabase.from("materias").insert(parsed.data as any);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Materia creada"); onDone();
  }

  const aniosDisponibles = ESPECIALIDADES.find((e) => e.codigo === esp)?.anios ?? [1, 2, 3, 4, 5, 6, 7];

  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Nueva materia</DialogTitle></DialogHeader>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5"><Label>Nombre</Label><Input value={nombre} onChange={(e) => setNombre(e.target.value)} required maxLength={200} /></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Especialidad</Label>
            <Select value={esp} onValueChange={setEsp}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{ESPECIALIDADES.map((e) => <SelectItem key={e.codigo} value={e.codigo}>{e.nombre}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Año</Label>
            <Select value={String(anio)} onValueChange={(v) => setAnio(Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{aniosDisponibles.map((a) => <SelectItem key={a} value={String(a)}>{a}º año</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter><Button type="submit" disabled={saving}>{saving ? "Guardando…" : "Crear"}</Button></DialogFooter>
      </form>
    </DialogContent>
  );
}
