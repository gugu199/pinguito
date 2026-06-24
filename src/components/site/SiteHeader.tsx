import { Link, useLocation } from "@tanstack/react-router";
import { Menu, Search, LogIn, GraduationCap } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useConfigSitio } from "@/hooks/use-config-sitio";
import { useAuth } from "@/hooks/use-auth";
import { ThemeToggle } from "@/components/site/ThemeToggle";

const NAV = [
  { to: "/", label: "Inicio" },
  { to: "/institucional", label: "Institucional" },
  { to: "/avisos", label: "Avisos" },
  { to: "/calendario", label: "Calendario" },
  { to: "/materias", label: "Materias" },
  { to: "/capacitaciones", label: "Capacitaciones" },
  { to: "/centro-estudiantes", label: "Centro de Estudiantes" },
  { to: "/galeria", label: "Galería" },
  { to: "/contacto", label: "Contacto" },
] as const;

export function SiteHeader() {
  const config = useConfigSitio();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="border-b border-border bg-card">
      {/* Franja azul superior */}
      <div className="bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 text-xs">
          <span>{config("horario")}</span>
          <span className="hidden sm:inline">{config("telefono")} · {config("email")}</span>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4">
        <Link to="/" className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <GraduationCap className="h-7 w-7" aria-hidden />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="font-serif text-lg font-semibold text-foreground sm:text-xl">
              {config("nombre_escuela")}
            </span>
            <span className="hidden text-xs text-muted-foreground sm:inline">
              {config("lema")}
            </span>
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-2">
          <Link
            to="/buscar"
            className="hidden items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground hover:bg-accent md:inline-flex"
            aria-label="Buscar en el sitio"
          >
            <Search className="h-4 w-4" aria-hidden /> Buscar…
          </Link>
          <ThemeToggle />
          {user ? (
            <Button asChild size="sm">
              <Link to="/admin">Panel</Link>
            </Button>
          ) : (
            <Button asChild variant="outline" size="sm">
              <Link to="/auth">
                <LogIn className="mr-1.5 h-4 w-4" aria-hidden /> Ingresar
              </Link>
            </Button>
          )}
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-input md:hidden"
            aria-label="Abrir menú"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Menú principal */}
      <nav className="border-t border-border bg-card" aria-label="Principal">
        <ul className="mx-auto hidden max-w-7xl items-center gap-1 px-4 md:flex">
          {NAV.map((item) => {
            const active = location.pathname === item.to ||
              (item.to !== "/" && location.pathname.startsWith(item.to));
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={
                    "inline-flex items-center px-4 py-3 text-sm font-medium transition-colors border-b-2 " +
                    (active
                      ? "border-primary text-primary"
                      : "border-transparent text-foreground hover:text-primary")
                  }
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
        {open && (
          <ul className="flex flex-col border-t border-border px-2 py-2 md:hidden">
            {NAV.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="block rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                to="/buscar"
                onClick={() => setOpen(false)}
                className="block rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
              >
                Buscar
              </Link>
            </li>
          </ul>
        )}
      </nav>
    </header>
  );
}
