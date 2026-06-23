import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Copy, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/admin/invitaciones")({
  component: AdminInvitaciones,
});

const ROLE_LABEL: Record<string, string> = {
  autoridad: "Autoridad",
  docente: "Docente",
  centro_estudiantes: "Centro de Estudiantes",
  informatica: "Informática",
};

function AdminInvitaciones() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data = [] } = useQuery({
    queryKey: ["admin", "invitaciones"],
    queryFn: async () => {
      const { data, error } = await supabase.from("invitations").select("id, codigo, role, nota, usado_por, usado_en, expira_en, created_at").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("invitations").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Invitación eliminada"); qc.invalidateQueries({ queryKey: ["admin", "invitaciones"] }); },
  });

  return (
    <section>
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold">Invitaciones</h1>
          <p className="text-sm text-muted-foreground">Generá códigos para que docentes, Centro de Estudiantes e Informática creen sus cuentas.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-1.5 h-4 w-4" />Nueva invitación</Button></DialogTrigger>
          <InvitacionForm onDone={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["admin", "invitaciones"] }); }} />
        </Dialog>
      </header>

      <ul className="mt-6 divide-y divide-border rounded-md border border-border bg-card">
        {data.length === 0 ? <li className="p-6 text-muted-foreground">Sin invitaciones.</li> : data.map((i) => (
          <li key={i.id} className="flex flex-wrap items-center gap-3 p-4">
            <code className="rounded bg-secondary px-2 py-1 font-mono text-sm">{i.codigo}</code>
            <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(i.codigo); toast.success("Código copiado"); }} aria-label="Copiar"><Copy className="h-4 w-4" /></Button>
            <span className="text-sm font-medium">{ROLE_LABEL[i.role]}</span>
            {i.nota && <span className="text-xs text-muted-foreground">· {i.nota}</span>}
            <span className="ml-auto text-xs text-muted-foreground">
              {i.usado_por ? `Usado el ${new Date(i.usado_en!).toLocaleDateString("es-AR")}` : i.expira_en ? `Expira ${new Date(i.expira_en).toLocaleDateString("es-AR")}` : "Sin expiración"}
            </span>
            <Button size="sm" variant="outline" onClick={() => { if (confirm("¿Eliminar invitación?")) del.mutate(i.id); }}><Trash2 className="h-4 w-4" /></Button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function generarCodigo() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function InvitacionForm({ onDone }: { onDone: () => void }) {
  const [role, setRole] = useState("docente");
  const [nota, setNota] = useState("");
  const [diasExpira, setDiasExpira] = useState("30");
  const [codigo, setCodigo] = useState(generarCodigo());
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const dias = Number(diasExpira);
    const expira = dias > 0 ? new Date(Date.now() + dias * 86400000).toISOString() : null;
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("invitations").insert({
      codigo,
      role: role as any,
      nota: nota.trim() || null,
      expira_en: expira,
      created_by: u.user?.id ?? null,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Invitación creada"); onDone();
  }

  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Nueva invitación</DialogTitle></DialogHeader>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label>Rol</Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(ROLE_LABEL).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Código</Label>
          <div className="flex gap-2">
            <Input value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())} required maxLength={32} className="font-mono" />
            <Button type="button" variant="outline" onClick={() => setCodigo(generarCodigo())}>Generar</Button>
          </div>
        </div>
        <div className="space-y-1.5"><Label>Nota (opcional)</Label><Input value={nota} onChange={(e) => setNota(e.target.value)} placeholder="A quién está dirigida" /></div>
        <div className="space-y-1.5"><Label>Expira en (días, 0 = nunca)</Label><Input type="number" min="0" value={diasExpira} onChange={(e) => setDiasExpira(e.target.value)} /></div>
        <DialogFooter><Button type="submit" disabled={saving}>{saving ? "Guardando…" : "Crear"}</Button></DialogFooter>
      </form>
    </DialogContent>
  );
}
