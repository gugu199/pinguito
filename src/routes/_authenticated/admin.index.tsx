import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useRoles } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminHome,
});

function AdminHome() {
  const { user } = useAuth();
  const { data: roles = [] } = useRoles(user);

  const counts = useQuery({
    queryKey: ["admin", "counts"],
    queryFn: async () => {
      const [avisos, eventos, materias, recursos, mensajes] = await Promise.all([
        supabase.from("avisos").select("id", { count: "exact", head: true }),
        supabase.from("eventos_calendario").select("id", { count: "exact", head: true }),
        supabase.from("materias").select("id", { count: "exact", head: true }),
        supabase.from("recursos").select("id", { count: "exact", head: true }),
        supabase.from("mensajes_contacto").select("id", { count: "exact", head: true }).eq("leido", false),
      ]);
      return {
        avisos: avisos.count ?? 0,
        eventos: eventos.count ?? 0,
        materias: materias.count ?? 0,
        recursos: recursos.count ?? 0,
        mensajesSinLeer: mensajes.count ?? 0,
      };
    },
  });

  return (
    <section>
      <h1 className="font-serif text-2xl font-semibold">Bienvenido/a</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Hola {user?.email}. {roles.length === 0 ? "Todavía no tenés un rol asignado. Pedile a la dirección que te envíe un código de invitación o te asigne uno." : `Roles activos: ${roles.join(", ")}.`}
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Stat label="Avisos publicados" value={counts.data?.avisos} />
        <Stat label="Eventos en calendario" value={counts.data?.eventos} />
        <Stat label="Materias" value={counts.data?.materias} />
        <Stat label="Recursos" value={counts.data?.recursos} />
        <Stat label="Mensajes sin leer" value={counts.data?.mensajesSinLeer} />
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number | undefined }) {
  return (
    <div className="rounded-md border border-border bg-card p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-serif text-3xl font-semibold text-primary">{value ?? "—"}</p>
    </div>
  );
}
