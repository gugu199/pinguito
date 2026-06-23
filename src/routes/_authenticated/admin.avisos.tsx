import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Trash2, Pencil, Plus, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useRoles, canPostAviso } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AVISO_CATEGORIAS } from "@/lib/site-config";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_authenticated/admin/avisos")({
  component: AdminAvisos,
});

const schema = z.object({
  titulo: z.string().trim().min(1).max(200),
  contenido: z.string().trim().min(1).max(10000),
  categoria: z.enum(["institucional", "centro_estudiantes", "familias"]),
  destacado: z.boolean(),
});

type Aviso = {
  id: string;
  titulo: string;
  contenido: string;
  categoria: "institucional" | "centro_estudiantes" | "familias";
  destacado: boolean;
  publicado_en: string;
  autor_id: string | null;
};

function AdminAvisos() {
  const { user } = useAuth();
  const { data: roles = [] } = useRoles(user);
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Aviso | null>(null);
  const [openNew, setOpenNew] = useState(false);

  const { data: avisos = [], isLoading } = useQuery({
    queryKey: ["admin", "avisos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("avisos")
        .select("id, titulo, contenido, categoria, destacado, publicado_en, autor_id")
        .order("publicado_en", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Aviso[];
    },
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("avisos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Aviso eliminado");
      qc.invalidateQueries({ queryKey: ["admin", "avisos"] });
      qc.invalidateQueries({ queryKey: ["avisos"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section>
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold">Avisos</h1>
          <p className="text-sm text-muted-foreground">Comunicados publicados en el sitio.</p>
        </div>
        <Dialog open={openNew} onOpenChange={setOpenNew}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-1.5 h-4 w-4" />Nuevo aviso</Button>
          </DialogTrigger>
          <AvisoForm
            roles={roles}
            onDone={() => { setOpenNew(false); qc.invalidateQueries({ queryKey: ["admin", "avisos"] }); qc.invalidateQueries({ queryKey: ["avisos"] }); }}
            userId={user?.id ?? null}
          />
        </Dialog>
      </header>

      <div className="mt-6 overflow-hidden rounded-md border border-border bg-card">
        {isLoading ? (
          <p className="p-6 text-muted-foreground">Cargando…</p>
        ) : avisos.length === 0 ? (
          <p className="p-6 text-muted-foreground">Todavía no hay avisos.</p>
        ) : (
          <ul className="divide-y divide-border">
            {avisos.map((a) => (
              <li key={a.id} className="flex items-start gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded bg-secondary px-2 py-0.5 font-medium">
                      {AVISO_CATEGORIAS.find((c) => c.value === a.categoria)?.label}
                    </span>
                    {a.destacado && <span className="inline-flex items-center gap-1 text-amber-700"><Star className="h-3 w-3" /> Destacado</span>}
                    <span className="text-muted-foreground">{new Date(a.publicado_en).toLocaleDateString("es-AR")}</span>
                  </div>
                  <h3 className="mt-1 font-medium">{a.titulo}</h3>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{a.contenido}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <Dialog open={editing?.id === a.id} onOpenChange={(o) => setEditing(o ? a : null)}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm"><Pencil className="h-4 w-4" /></Button>
                    </DialogTrigger>
                    {editing?.id === a.id && (
                      <AvisoForm
                        roles={roles}
                        userId={user?.id ?? null}
                        initial={editing}
                        onDone={() => { setEditing(null); qc.invalidateQueries({ queryKey: ["admin", "avisos"] }); qc.invalidateQueries({ queryKey: ["avisos"] }); }}
                      />
                    )}
                  </Dialog>
                  <Button variant="outline" size="sm" onClick={() => { if (confirm("¿Eliminar este aviso?")) delMut.mutate(a.id); }}>
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

function AvisoForm({ roles, initial, onDone, userId }: { roles: string[]; initial?: Aviso; onDone: () => void; userId: string | null }) {
  const [titulo, setTitulo] = useState(initial?.titulo ?? "");
  const [contenido, setContenido] = useState(initial?.contenido ?? "");
  const [categoria, setCategoria] = useState<Aviso["categoria"]>(initial?.categoria ?? (roles.includes("centro_estudiantes") && !roles.includes("autoridad") && !roles.includes("docente") ? "centro_estudiantes" : "institucional"));
  const [destacado, setDestacado] = useState(initial?.destacado ?? false);
  const [saving, setSaving] = useState(false);

  const categoriasDisponibles = AVISO_CATEGORIAS.filter((c) => canPostAviso(roles as any, c.value));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ titulo, contenido, categoria, destacado });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setSaving(true);
    if (initial) {
      const { error } = await supabase.from("avisos").update(parsed.data).eq("id", initial.id);
      setSaving(false);
      if (error) { toast.error(error.message); return; }
      toast.success("Aviso actualizado");
    } else {
      const { error } = await supabase.from("avisos").insert({ ...parsed.data, autor_id: userId });
      setSaving(false);
      if (error) { toast.error(error.message); return; }
      toast.success("Aviso publicado");
    }
    onDone();
  }

  return (
    <DialogContent>
      <DialogHeader><DialogTitle>{initial ? "Editar aviso" : "Nuevo aviso"}</DialogTitle></DialogHeader>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="cat">Categoría</Label>
          <Select value={categoria} onValueChange={(v) => setCategoria(v as Aviso["categoria"])}>
            <SelectTrigger id="cat"><SelectValue /></SelectTrigger>
            <SelectContent>
              {categoriasDisponibles.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="titulo">Título</Label>
          <Input id="titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} required maxLength={200} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contenido">Contenido</Label>
          <Textarea id="contenido" value={contenido} onChange={(e) => setContenido(e.target.value)} rows={8} required maxLength={10000} />
        </div>
        <div className="flex items-center gap-2">
          <Switch id="destacado" checked={destacado} onCheckedChange={setDestacado} />
          <Label htmlFor="destacado">Destacar en la home</Label>
        </div>
        <DialogFooter>
          <Button type="submit" disabled={saving}>{saving ? "Guardando…" : "Guardar"}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
