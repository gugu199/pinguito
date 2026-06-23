import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "autoridad" | "docente" | "centro_estudiantes" | "informatica";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { session, user: session?.user ?? null, loading };
}

export function useRoles(user: User | null) {
  return useQuery({
    queryKey: ["user_roles", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<AppRole[]> => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data ?? []).map((r) => r.role as AppRole);
    },
  });
}

export function canPostAviso(roles: AppRole[], categoria: "institucional" | "centro_estudiantes" | "familias") {
  if (categoria === "centro_estudiantes") return roles.includes("centro_estudiantes");
  return roles.includes("autoridad") || roles.includes("docente");
}

export function canEditCalendario(roles: AppRole[]) {
  return roles.includes("autoridad") || roles.includes("docente");
}

export function canEditMaterias(roles: AppRole[]) {
  return roles.includes("autoridad") || roles.includes("docente") || roles.includes("informatica");
}

export function canManageUsers(roles: AppRole[]) {
  return roles.includes("autoridad");
}
