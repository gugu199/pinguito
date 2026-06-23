import { useConfigSitio } from "@/hooks/use-config-sitio";
import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  const config = useConfigSitio();
  return (
    <footer className="mt-16 border-t border-border bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-3">
        <div>
          <h3 className="font-serif text-lg font-semibold">{config("nombre_escuela")}</h3>
          <p className="mt-2 text-sm text-primary-foreground/85">{config("lema")}</p>
        </div>
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide">Contacto</h4>
          <ul className="mt-2 space-y-1 text-sm text-primary-foreground/90">
            <li>{config("direccion")}</li>
            <li>Tel: {config("telefono")}</li>
            <li>Email: {config("email")}</li>
            <li>{config("horario")}</li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide">Accesos</h4>
          <ul className="mt-2 space-y-1 text-sm">
            <li><Link to="/avisos" className="hover:underline">Avisos</Link></li>
            <li><Link to="/calendario" className="hover:underline">Calendario</Link></li>
            <li><Link to="/materias" className="hover:underline">Materias y recursos</Link></li>
            <li><Link to="/contacto" className="hover:underline">Contacto</Link></li>
            <li><Link to="/auth" className="hover:underline">Acceso autoridades / docentes</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-primary-foreground/20">
        <div className="mx-auto max-w-7xl px-4 py-4 text-xs text-primary-foreground/80">
          © {new Date().getFullYear()} {config("nombre_escuela")}. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
