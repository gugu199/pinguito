import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { SiteLayout, Container } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const GoogleIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);


export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [
    { title: "Ingresar · Escuela Secundaria Técnica" },
    { name: "description", content: "Acceso al panel de administración para autoridades, docentes y Centro de Estudiantes." },
    { property: "og:title", content: "Ingresar · Escuela Secundaria Técnica" },
    { property: "og:description", content: "Acceso al panel de administración para autoridades, docentes y Centro de Estudiantes." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
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

  async function signInWithGoogle() {
    setLoading(true);
    try {
      await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo iniciar sesión con Google");
    } finally {
      setLoading(false);
    }
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
    if (parsed.data.codigo) {
      const { error: rpcErr } = await supabase.rpc("canjear_invitacion", { _codigo: parsed.data.codigo });
      if (rpcErr) {
        setLoading(false);
        toast.error("Cuenta creada pero el código de invitación no es válido.");
        navigate({ to: "/admin" });
        return;
      }
    }
    setLoading(false);
    toast.success("Cuenta creada");
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

          <div className="mt-4">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={signInWithGoogle}
              className="w-full"
            >
              <GoogleIcon /> Continuar con Google
            </Button>
            <div className="my-4 flex items-center gap-2">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">o con email</span>
              <div className="h-px flex-1 bg-border" />
            </div>
          </div>

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
                Si te dieron un código de invitación, ingresalo abajo para recibir tu rol. Si sos la primera autoridad que se registra, podés dejarlo vacío: el sistema te asigna el rol de Autoridad automáticamente.
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
                <Label htmlFor="reg-codigo">Código de invitación (opcional)</Label>
                <Input id="reg-codigo" name="codigo" />
              </div>
              <Button type="submit" disabled={loading} className="w-full">{loading ? "Creando…" : "Crear cuenta"}</Button>
            </form>
          </TabsContent>
        </Tabs>
      </Container>
    </SiteLayout>
  );
}
