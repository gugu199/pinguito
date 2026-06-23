export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      avisos: {
        Row: {
          autor_id: string | null
          categoria: Database["public"]["Enums"]["aviso_categoria"]
          contenido: string
          created_at: string
          destacado: boolean
          id: string
          publicado_en: string
          titulo: string
          updated_at: string
        }
        Insert: {
          autor_id?: string | null
          categoria: Database["public"]["Enums"]["aviso_categoria"]
          contenido: string
          created_at?: string
          destacado?: boolean
          id?: string
          publicado_en?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          autor_id?: string | null
          categoria?: Database["public"]["Enums"]["aviso_categoria"]
          contenido?: string
          created_at?: string
          destacado?: boolean
          id?: string
          publicado_en?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      config_sitio: {
        Row: {
          clave: string
          updated_at: string
          valor: string | null
        }
        Insert: {
          clave: string
          updated_at?: string
          valor?: string | null
        }
        Update: {
          clave?: string
          updated_at?: string
          valor?: string | null
        }
        Relationships: []
      }
      especialidades: {
        Row: {
          codigo: Database["public"]["Enums"]["especialidad_codigo"]
          descripcion: string | null
          nombre: string
          orden: number
        }
        Insert: {
          codigo: Database["public"]["Enums"]["especialidad_codigo"]
          descripcion?: string | null
          nombre: string
          orden?: number
        }
        Update: {
          codigo?: Database["public"]["Enums"]["especialidad_codigo"]
          descripcion?: string | null
          nombre?: string
          orden?: number
        }
        Relationships: []
      }
      eventos_calendario: {
        Row: {
          autor_id: string | null
          created_at: string
          descripcion: string | null
          fecha_fin: string | null
          fecha_inicio: string
          id: string
          tipo: Database["public"]["Enums"]["evento_tipo"]
          titulo: string
          updated_at: string
        }
        Insert: {
          autor_id?: string | null
          created_at?: string
          descripcion?: string | null
          fecha_fin?: string | null
          fecha_inicio: string
          id?: string
          tipo: Database["public"]["Enums"]["evento_tipo"]
          titulo: string
          updated_at?: string
        }
        Update: {
          autor_id?: string | null
          created_at?: string
          descripcion?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string
          id?: string
          tipo?: Database["public"]["Enums"]["evento_tipo"]
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      galeria_albumes: {
        Row: {
          cover_path: string | null
          created_at: string
          descripcion: string | null
          fecha: string | null
          id: string
          titulo: string
          updated_at: string
        }
        Insert: {
          cover_path?: string | null
          created_at?: string
          descripcion?: string | null
          fecha?: string | null
          id?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          cover_path?: string | null
          created_at?: string
          descripcion?: string | null
          fecha?: string | null
          id?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      galeria_fotos: {
        Row: {
          album_id: string
          alt: string
          created_at: string
          id: string
          orden: number
          storage_path: string
        }
        Insert: {
          album_id: string
          alt: string
          created_at?: string
          id?: string
          orden?: number
          storage_path: string
        }
        Update: {
          album_id?: string
          alt?: string
          created_at?: string
          id?: string
          orden?: number
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "galeria_fotos_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "galeria_albumes"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          codigo: string
          created_at: string
          created_by: string | null
          expira_en: string | null
          id: string
          nota: string | null
          role: Database["public"]["Enums"]["app_role"]
          usado_en: string | null
          usado_por: string | null
        }
        Insert: {
          codigo: string
          created_at?: string
          created_by?: string | null
          expira_en?: string | null
          id?: string
          nota?: string | null
          role: Database["public"]["Enums"]["app_role"]
          usado_en?: string | null
          usado_por?: string | null
        }
        Update: {
          codigo?: string
          created_at?: string
          created_by?: string | null
          expira_en?: string | null
          id?: string
          nota?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          usado_en?: string | null
          usado_por?: string | null
        }
        Relationships: []
      }
      materias: {
        Row: {
          anio: number
          created_at: string
          descripcion: string | null
          especialidad: Database["public"]["Enums"]["especialidad_codigo"]
          id: string
          nombre: string
          orden: number
          updated_at: string
        }
        Insert: {
          anio: number
          created_at?: string
          descripcion?: string | null
          especialidad: Database["public"]["Enums"]["especialidad_codigo"]
          id?: string
          nombre: string
          orden?: number
          updated_at?: string
        }
        Update: {
          anio?: number
          created_at?: string
          descripcion?: string | null
          especialidad?: Database["public"]["Enums"]["especialidad_codigo"]
          id?: string
          nombre?: string
          orden?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "materias_especialidad_fkey"
            columns: ["especialidad"]
            isOneToOne: false
            referencedRelation: "especialidades"
            referencedColumns: ["codigo"]
          },
        ]
      }
      mensajes_contacto: {
        Row: {
          asunto: string
          created_at: string
          email: string
          id: string
          leido: boolean
          mensaje: string
          nombre: string
        }
        Insert: {
          asunto: string
          created_at?: string
          email: string
          id?: string
          leido?: boolean
          mensaje: string
          nombre: string
        }
        Update: {
          asunto?: string
          created_at?: string
          email?: string
          id?: string
          leido?: boolean
          mensaje?: string
          nombre?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          nombre_completo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          nombre_completo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          nombre_completo?: string
          updated_at?: string
        }
        Relationships: []
      }
      recursos: {
        Row: {
          archivo_path: string | null
          autor_id: string | null
          created_at: string
          descripcion: string | null
          etiquetas: string[]
          id: string
          materia_id: string
          tipo: Database["public"]["Enums"]["recurso_tipo"]
          titulo: string
          updated_at: string
          url: string | null
        }
        Insert: {
          archivo_path?: string | null
          autor_id?: string | null
          created_at?: string
          descripcion?: string | null
          etiquetas?: string[]
          id?: string
          materia_id: string
          tipo: Database["public"]["Enums"]["recurso_tipo"]
          titulo: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          archivo_path?: string | null
          autor_id?: string | null
          created_at?: string
          descripcion?: string | null
          etiquetas?: string[]
          id?: string
          materia_id?: string
          tipo?: Database["public"]["Enums"]["recurso_tipo"]
          titulo?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recursos_materia_id_fkey"
            columns: ["materia_id"]
            isOneToOne: false
            referencedRelation: "materias"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      canjear_invitacion: {
        Args: { _codigo: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_any_role: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "autoridad" | "docente" | "centro_estudiantes" | "informatica"
      aviso_categoria: "institucional" | "centro_estudiantes" | "familias"
      especialidad_codigo:
        | "ciclo_basico"
        | "informatica"
        | "alimentos"
        | "electronica"
      evento_tipo: "examen" | "actividad" | "evento"
      recurso_tipo: "apunte" | "guia" | "video" | "bibliografia"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["autoridad", "docente", "centro_estudiantes", "informatica"],
      aviso_categoria: ["institucional", "centro_estudiantes", "familias"],
      especialidad_codigo: [
        "ciclo_basico",
        "informatica",
        "alimentos",
        "electronica",
      ],
      evento_tipo: ["examen", "actividad", "evento"],
      recurso_tipo: ["apunte", "guia", "video", "bibliografia"],
    },
  },
} as const
