export interface Database {
  public: {
    Tables: {
      bottles: {
        Row: {
          id: string
          name: string
          appellation: string
          region: string
          year: string
          color: string
          pairing: string
          bought_at: string
          tasted_at: string | null
          note: string
          image: string
        }
        Insert: {
          id?: string
          name: string
          appellation: string
          region: string
          year: string
          color: string
          pairing: string
          bought_at: string
          tasted_at?: string | null
          note: string
          image: string
        }
        Update: {
          id?: string
          name?: string
          appellation?: string
          region?: string
          year?: string
          color?: string
          pairing?: string
          bought_at?: string
          tasted_at?: string | null
          note?: string
          image?: string
        }
        Relationships: []
      }
      user_bottles: {
        Row: {
          user_id: string
          bottle_id: string
          shelf: 'cellar' | 'drunk' | 'wishlist'
          consumed_at: string | null
          recommended_from_bottle_id: string | null
          updated_at: string
        }
        Insert: {
          user_id: string
          bottle_id: string
          shelf: 'cellar' | 'drunk' | 'wishlist'
          consumed_at?: string | null
          recommended_from_bottle_id?: string | null
          updated_at?: string
        }
        Update: {
          user_id?: string
          bottle_id?: string
          shelf?: 'cellar' | 'drunk' | 'wishlist'
          consumed_at?: string | null
          recommended_from_bottle_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_bottles_bottle_id_bottles_id_fk'
            columns: ['bottle_id']
            isOneToOne: false
            referencedRelation: 'bottles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'user_bottles_recommended_from_bottle_id_bottles_id_fk'
            columns: ['recommended_from_bottle_id']
            isOneToOne: false
            referencedRelation: 'bottles'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
