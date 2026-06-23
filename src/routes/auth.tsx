import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout, Container } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Ingresar · Escuela Secundaria Técnica" }] }),
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/admin" });
  },
  component: AuthPage,
});

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

const registroSchema = z.object({
  nombre: z.string().trim().min(2, "Ingresá tu nombre completo").max(120),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  codigo: z.string().trim().max(64).optional().default(""),
});

function AuthPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"login" | "registro">("login");
  const [loading, setLoading] = useState(false);

  async function onLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = loginSchema.safeParse({ email: fd.get("email"), password: fd.get("password") });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setLoading(false);
    if (error) { toast.error("Email o contraseña incorrectos"); return; }
    toast.success("Sesión iniciada");
    navigate({ to: "/admin" });
  }

  async function onRegistro(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = registroSchema.safeParse({
      nombre: fd.get("nombre"),
      email: fd.get("email"),
      password: fd.get("password"),
      codigo: fd.get("codigo"),
    });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: window.location.origin + "/auth",
        data: { nombre_completo: parsed.data.nombre },
      },
    });
    if (error || !data.user) {
      setLoading(false);
      toast.error(error?.message ?? "No pudimos crear la cuenta");
      return;
    }
    // Si la sesión vino sin confirmar email, intentamos login
    if (!data.session) {
      const { error: signinErr } = await supabase.auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.password,
      });
      if (signinErr) {
        setLoading(false);
        toast.success("Cuenta creada. Revisá tu email para confirmar e iniciá sesión.");
        return;
      }
    }
    // Canjear código
    const { error: rpcErr } = await supabase.rpc("canjear_invitacion", { _codigo: parsed.data.codigo });
    setLoading(false);
    if (rpcErr) {
      toast.error("Cuenta creada pero el código no es válido. Pedí uno nuevo a la dirección.");
      navigate({ to: "/admin" });
      return;
    }
    toast.success("Cuenta creada y rol asignado");
    navigate({ to: "/admin" });
  }

  return (
    <SiteLayout>
      <Container className="max-w-md">
        <h1 className="font-serif text-2xl font-semibold">Acceso al panel</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Solo para autoridades, docentes, Centro de Estudiantes e Informática.
        </p>

        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Ingresar</TabsTrigger>
            <TabsTrigger value="registro">Crear cuenta</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form onSubmit={onLogin} className="mt-4 space-y-4 rounded-md border border-border bg-card p-6">
              <div className="space-y-1.5">
                <Label htmlFor="login-email">Email</Label>
                <Input id="login-email" name="email" type="email" required autoComplete="email" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="login-password">Contraseña</Label>
                <Input id="login-password" name="password" type="password" required autoComplete="current-password" />
              </div>
              <Button type="submit" disabled={loading} className="w-full">{loading ? "Ingresando…" : "Ingresar"}</Button>
            </form>
          </TabsContent>

          <TabsContent value="registro">
            <form onSubmit={onRegistro} className="mt-4 space-y-4 rounded-md border border-border bg-card p-6">
              <p className="text-xs text-muted-foreground">
                Necesitás un código de invitación entregado por la dirección de la escuela.
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="reg-nombre">Nombre completo</Label>
                <Input id="reg-nombre" name="nombre" required maxLength={120} autoComplete="name" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-email">Email</Label>
                <Input id="reg-email" name="email" type="email" required autoComplete="email" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-password">Contraseña (mín. 8 caracteres)</Label>
                <Input id="reg-password" name="password" type="password" required minLength={8} autoComplete="new-password" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-codigo">Código de invitación</Label>
                <Input id="reg-codigo" name="codigo" required />
              </div>
              <Button type="submit" disabled={loading} className="w-full">{loading ? "Creando…" : "Crear cuenta"}</Button>
            </form>
          </TabsContent>
        </Tabs>
      </Container>
    </SiteLayout>
  );
}
