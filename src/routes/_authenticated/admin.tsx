import { Link, Outlet, useLocation, useNavigate, createFileRoute } from "@tanstack/react-router";
import { LayoutDashboard, Megaphone, Calendar, BookOpen, Camera, Mail, KeyRound, Settings, LogOut } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useRoles, canManageUsers, canEditCalendario, canEditMaterias } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { user } = useAuth();
  const { data: roles = [] } = useRoles(user);
  const location = useLocation();
  const navigate = useNavigate();

  const items = [
    { to: "/admin", label: "Resumen", icon: LayoutDashboard, show: true, exact: true },
    { to: "/admin/avisos", label: "Avisos", icon: Megaphone, show: true },
    { to: "/admin/calendario", label: "Calendario", icon: Calendar, show: canEditCalendario(roles) },
    { to: "/admin/materias", label: "Materias y recursos", icon: BookOpen, show: canEditMaterias(roles) },
    { to: "/admin/galeria", label: "Galería", icon: Camera, show: canEditMaterias(roles) },
    { to: "/admin/mensajes", label: "Mensajes", icon: Mail, show: canManageUsers(roles) },
    { to: "/admin/invitaciones", label: "Invitaciones", icon: KeyRound, show: canManageUsers(roles) },
    { to: "/admin/config", label: "Datos institucionales", icon: Settings, show: roles.includes("autoridad") || roles.includes("informatica") },
  ] as const;

  async function logout() {
    await supabase.auth.signOut();
    toast.success("Sesión cerrada");
    navigate({ to: "/" });
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="border-b border-border bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link to="/" className="font-serif text-lg font-semibold">Panel de administración</Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden sm:inline">{user?.email}</span>
            {roles.length > 0 && (
              <span className="hidden rounded bg-primary-dark px-2 py-0.5 text-xs uppercase tracking-wide sm:inline">
                {roles.join(", ")}
              </span>
            )}
            <Button variant="outline" size="sm" onClick={logout} className="border-primary-foreground/40 text-primary-foreground hover:bg-primary-dark">
              <LogOut className="mr-1.5 h-4 w-4" /> Salir
            </Button>
          </div>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 lg:flex-row">
        <aside className="lg:w-60 lg:flex-none">
          <nav className="rounded-md border border-border bg-card p-2" aria-label="Secciones del panel">
            <ul className="space-y-1">
              {items.filter((i) => i.show).map(({ to, label, icon: Icon, exact }) => {
                const active = exact ? location.pathname === to : location.pathname.startsWith(to);
                return (
                  <li key={to}>
                    <Link
                      to={to}
                      className={
                        "flex items-center gap-2 rounded px-3 py-2 text-sm " +
                        (active ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-accent")
                      }
                    >
                      <Icon className="h-4 w-4" aria-hidden /> {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
