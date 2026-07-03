// Hand-written to match supabase/migrations/0001_init.sql.
// Once a real Supabase project is linked, regenerate with:
//   npx supabase gen types typescript --linked > lib/supabase/types.ts

export type ProfileRole = "owner" | "employee";
export type LocationType = "warehouse" | "store" | "online";
export type ShipmentStatus = "ordered" | "in_transit" | "customs" | "received" | "cancelled";
export type StockMovementType = "receive" | "transfer" | "sale" | "adjustment" | "return";
export type SalesChannelType = "online" | "instagram" | "whatsapp" | "facebook" | "physical_store";
export type SaleStatus = "completed" | "pending" | "refunded";

// supabase-js requires every table/view to carry a `Relationships` array to
// satisfy its GenericTable/GenericView constraints. We don't model foreign
// keys explicitly here (nested `select()` embeds still work at runtime),
// so it's always empty — this just keeps the generic plumbing happy.
type NoRelationships = { Relationships: [] };

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          role: ProfileRole;
          phone: string | null;
          active: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & { id: string };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
      } & NoRelationships;
      locations: {
        Row: {
          id: string;
          name: string;
          type: LocationType;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["locations"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["locations"]["Row"]>;
      } & NoRelationships;
      suppliers: {
        Row: {
          id: string;
          name: string;
          country: string | null;
          contact_name: string | null;
          contact_phone: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["suppliers"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["suppliers"]["Row"]>;
      } & NoRelationships;
      sales_channels: {
        Row: {
          id: string;
          name: string;
          type: SalesChannelType;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["sales_channels"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["sales_channels"]["Row"]>;
      } & NoRelationships;
      products: {
        Row: {
          id: string;
          name: string;
          sku: string | null;
          barcode: string | null;
          category: string | null;
          unit: string;
          reorder_point: number;
          cost_price: number;
          sale_price: number;
          image_url: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["products"]["Row"]> & { name: string };
        Update: Partial<Database["public"]["Tables"]["products"]["Row"]>;
      } & NoRelationships;
      shipments: {
        Row: {
          id: string;
          supplier_id: string | null;
          reference_code: string;
          origin_country: string | null;
          status: ShipmentStatus;
          currency: string;
          shipping_cost: number;
          customs_cost: number;
          ordered_at: string;
          expected_arrival: string | null;
          received_at: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["shipments"]["Row"]> & { reference_code: string };
        Update: Partial<Database["public"]["Tables"]["shipments"]["Row"]>;
      } & NoRelationships;
      shipment_items: {
        Row: {
          id: string;
          shipment_id: string;
          product_id: string;
          quantity: number;
          unit_cost: number;
          currency: string;
        };
        Insert: Partial<Database["public"]["Tables"]["shipment_items"]["Row"]> & {
          shipment_id: string;
          product_id: string;
          quantity: number;
        };
        Update: Partial<Database["public"]["Tables"]["shipment_items"]["Row"]>;
      } & NoRelationships;
      inventory_stock: {
        Row: {
          product_id: string;
          location_id: string;
          quantity: number;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["inventory_stock"]["Row"]> & {
          product_id: string;
          location_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["inventory_stock"]["Row"]>;
      } & NoRelationships;
      stock_movements: {
        Row: {
          id: string;
          product_id: string;
          from_location_id: string | null;
          to_location_id: string | null;
          quantity: number;
          type: StockMovementType;
          reference_type: string | null;
          reference_id: string | null;
          note: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["stock_movements"]["Row"]> & {
          product_id: string;
          quantity: number;
          type: StockMovementType;
        };
        Update: Partial<Database["public"]["Tables"]["stock_movements"]["Row"]>;
      } & NoRelationships;
      sales: {
        Row: {
          id: string;
          channel_id: string | null;
          location_id: string | null;
          customer_name: string | null;
          customer_contact: string | null;
          total_amount: number;
          currency: string;
          status: SaleStatus;
          created_by: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["sales"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["sales"]["Row"]>;
      } & NoRelationships;
      sale_items: {
        Row: {
          id: string;
          sale_id: string;
          product_id: string;
          quantity: number;
          unit_price: number;
          unit_cost_snapshot: number;
        };
        Insert: Partial<Database["public"]["Tables"]["sale_items"]["Row"]> & {
          sale_id: string;
          product_id: string;
          quantity: number;
        };
        Update: Partial<Database["public"]["Tables"]["sale_items"]["Row"]>;
      } & NoRelationships;
      activity_log: {
        Row: {
          id: string;
          user_id: string | null;
          action_type: string;
          entity_type: string;
          entity_id: string | null;
          description: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["activity_log"]["Row"]> & {
          action_type: string;
          entity_type: string;
          description: string;
        };
        Update: Partial<Database["public"]["Tables"]["activity_log"]["Row"]>;
      } & NoRelationships;
    };
    Views: {
      product_stock_overview: {
        Row: {
          product_id: string;
          name: string;
          sku: string | null;
          barcode: string | null;
          category: string | null;
          unit: string;
          reorder_point: number;
          cost_price: number;
          sale_price: number;
          image_url: string | null;
          total_stock: number;
          primary_location: string | null;
          location_count: number;
        };
      } & NoRelationships;
    };
    Functions: Record<string, never>;
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type Views<T extends keyof Database["public"]["Views"]> =
  Database["public"]["Views"][T]["Row"];
