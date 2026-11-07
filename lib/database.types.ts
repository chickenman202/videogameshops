/**
 * Hand-written to match supabase/migrations/0001_stores.sql
 * and 0002_store_import_fields.sql.
 * Use the full Database type with createClient, not Database["public"].
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      stores: {
        Row: {
          id: string;
          slug: string;
          name: string;
          address: string | null;
          city: string | null;
          city_slug: string;
          state: string | null;
          zip_code: string | null;
          country: string | null;
          country_name: string | null;
          phone: string | null;
          latitude: number | null;
          longitude: number | null;
          website: string | null;
          website_domain: string | null;
          about: string | null;
          opening_hours: Json | null;
          opening_hours_raw: string | null;
          platforms: string[];
          sells_new: boolean;
          sells_used: boolean;
          accepts_trade_ins: boolean;
          repairs_consoles: boolean;
          is_active: boolean;
          google_place_id: string | null;
          photo_url: string | null;
          brand: string | null;
          facebook_url: string | null;
          instagram_url: string | null;
          twitter_url: string | null;
          other_socials: string | null;
          store_info: string | null;
          source: string | null;
          source_id: string | null;
          osm_url: string | null;
          wikidata_url: string | null;
          fetched_at: string | null;
          data_updated_at: string | null;
          enrichment_notes: string | null;
          alternate_source_ids: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          address?: string | null;
          city?: string | null;
          city_slug?: string;
          state?: string | null;
          zip_code?: string | null;
          country?: string | null;
          country_name?: string | null;
          phone?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          website?: string | null;
          website_domain?: string | null;
          about?: string | null;
          opening_hours?: Json | null;
          opening_hours_raw?: string | null;
          platforms?: string[];
          sells_new?: boolean;
          sells_used?: boolean;
          accepts_trade_ins?: boolean;
          repairs_consoles?: boolean;
          is_active?: boolean;
          google_place_id?: string | null;
          photo_url?: string | null;
          brand?: string | null;
          facebook_url?: string | null;
          instagram_url?: string | null;
          twitter_url?: string | null;
          other_socials?: string | null;
          store_info?: string | null;
          source?: string | null;
          source_id?: string | null;
          osm_url?: string | null;
          wikidata_url?: string | null;
          fetched_at?: string | null;
          data_updated_at?: string | null;
          enrichment_notes?: string | null;
          alternate_source_ids?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          address?: string | null;
          city?: string | null;
          city_slug?: string;
          state?: string | null;
          zip_code?: string | null;
          country?: string | null;
          country_name?: string | null;
          phone?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          website?: string | null;
          website_domain?: string | null;
          about?: string | null;
          opening_hours?: Json | null;
          opening_hours_raw?: string | null;
          platforms?: string[];
          sells_new?: boolean;
          sells_used?: boolean;
          accepts_trade_ins?: boolean;
          repairs_consoles?: boolean;
          is_active?: boolean;
          google_place_id?: string | null;
          photo_url?: string | null;
          brand?: string | null;
          facebook_url?: string | null;
          instagram_url?: string | null;
          twitter_url?: string | null;
          other_socials?: string | null;
          store_info?: string | null;
          source?: string | null;
          source_id?: string | null;
          osm_url?: string | null;
          wikidata_url?: string | null;
          fetched_at?: string | null;
          data_updated_at?: string | null;
          enrichment_notes?: string | null;
          alternate_source_ids?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      inbox_messages: {
        Row: {
          id: string;
          kind: string;
          name: string | null;
          email: string | null;
          store_name: string | null;
          address: string | null;
          city: string | null;
          state: string | null;
          phone: string | null;
          website: string | null;
          platforms: string[];
          sells_new: boolean;
          sells_used: boolean;
          accepts_trade_ins: boolean;
          repairs_consoles: boolean;
          message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          kind: string;
          name?: string | null;
          email?: string | null;
          store_name?: string | null;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          phone?: string | null;
          website?: string | null;
          platforms?: string[];
          sells_new?: boolean;
          sells_used?: boolean;
          accepts_trade_ins?: boolean;
          repairs_consoles?: boolean;
          message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          kind?: string;
          name?: string | null;
          email?: string | null;
          store_name?: string | null;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          phone?: string | null;
          website?: string | null;
          platforms?: string[];
          sells_new?: boolean;
          sells_used?: boolean;
          accepts_trade_ins?: boolean;
          repairs_consoles?: boolean;
          message?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
