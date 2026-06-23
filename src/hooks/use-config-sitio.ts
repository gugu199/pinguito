import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SITE_DEFAULTS, type SiteConfigKey } from "@/lib/site-config";

export function useConfigSitio() {
  const { data } = useQuery({
    queryKey: ["config_sitio"],
    queryFn: async () => {
      const { data, error } = await supabase.from("config_sitio").select("clave, valor");
      if (error) throw error;
      const map: Record<string, string> = {};
      for (const row of data ?? []) {
        if (row.valor != null) map[row.clave] = row.valor;
      }
      return map;
    },
    staleTime: 5 * 60_000,
  });

  return (clave: SiteConfigKey): string => data?.[clave] ?? SITE_DEFAULTS[clave];
}
