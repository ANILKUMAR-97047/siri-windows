export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      admin_users: {
        Row: {
          id: string;
          name: string;
          email: string;
          password_hash: string;
          password_salt: string;
          role: string;
          permissions: string[];
          status: string;
          last_login_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          password_hash: string;
          password_salt: string;
          role?: string;
          permissions?: string[];
          status?: string;
          last_login_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          password_hash?: string;
          password_salt?: string;
          role?: string;
          permissions?: string[];
          status?: string;
          last_login_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      website_content: {
        Row: {
          id: string;
          section: string;
          content: Json;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          section: string;
          content?: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          section?: string;
          content?: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      staff: {
        Row: {
          id: string;
          name: string;
          email: string | null;
          phone: string;
          role: string;
          department: string;
          photo_url: string | null;
          base_salary: number;
          join_date: string;
          status: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email?: string | null;
          phone: string;
          role: string;
          department?: string;
          photo_url?: string | null;
          base_salary?: number;
          join_date?: string;
          status?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string | null;
          phone?: string;
          role?: string;
          department?: string;
          photo_url?: string | null;
          base_salary?: number;
          join_date?: string;
          status?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      salary_records: {
        Row: {
          id: string;
          staff_id: string;
          month: number;
          year: number;
          base_salary: number;
          allowances: number;
          deductions: number;
          net_salary: number;
          status: string;
          paid_at: string | null;
          payment_mode: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          staff_id: string;
          month: number;
          year: number;
          base_salary?: number;
          allowances?: number;
          deductions?: number;
          status?: string;
          paid_at?: string | null;
          payment_mode?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          staff_id?: string;
          month?: number;
          year?: number;
          base_salary?: number;
          allowances?: number;
          deductions?: number;
          status?: string;
          paid_at?: string | null;
          payment_mode?: string | null;
          notes?: string | null;
          created_at?: string;
        };
      };
      material_categories: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
        };
      };
      materials: {
        Row: {
          id: string;
          category_id: string | null;
          name: string;
          code: string | null;
          unit: string;
          current_stock: number;
          reorder_level: number;
          unit_cost: number;
          supplier_name: string | null;
          supplier_phone: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id?: string | null;
          name: string;
          code?: string | null;
          unit?: string;
          current_stock?: number;
          reorder_level?: number;
          unit_cost?: number;
          supplier_name?: string | null;
          supplier_phone?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string | null;
          name?: string;
          code?: string | null;
          unit?: string;
          current_stock?: number;
          reorder_level?: number;
          unit_cost?: number;
          supplier_name?: string | null;
          supplier_phone?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      stock_transactions: {
        Row: {
          id: string;
          material_id: string;
          type: "IN" | "OUT" | "ADJUSTMENT";
          quantity: number;
          unit_price: number;
          total_cost: number;
          reference_type: string | null;
          reference_id: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          material_id: string;
          type: "IN" | "OUT" | "ADJUSTMENT";
          quantity: number;
          unit_price?: number;
          reference_type?: string | null;
          reference_id?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          material_id?: string;
          type?: "IN" | "OUT" | "ADJUSTMENT";
          quantity?: number;
          unit_price?: number;
          reference_type?: string | null;
          reference_id?: string | null;
          notes?: string | null;
          created_at?: string;
        };
      };
      clients: {
        Row: {
          id: string;
          name: string;
          phone: string;
          email: string | null;
          address: string | null;
          city: string;
          state: string;
          pincode: string | null;
          company_name: string | null;
          source: string;
          status: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          phone: string;
          email?: string | null;
          address?: string | null;
          city?: string;
          state?: string;
          pincode?: string | null;
          company_name?: string | null;
          source?: string;
          status?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          phone?: string;
          email?: string | null;
          address?: string | null;
          city?: string;
          state?: string;
          pincode?: string | null;
          company_name?: string | null;
          source?: string;
          status?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      pricing_packages: {
        Row: {
          id: string;
          name: string;
          material_type: string;
          profile_series: string | null;
          glass_type: string | null;
          price_per_sqft: number;
          features: string[] | null;
          warranty_years: number;
          is_active: boolean;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          material_type: string;
          profile_series?: string | null;
          glass_type?: string | null;
          price_per_sqft: number;
          features?: string[] | null;
          warranty_years?: number;
          is_active?: boolean;
          display_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          material_type?: string;
          profile_series?: string | null;
          glass_type?: string | null;
          price_per_sqft?: number;
          features?: string[] | null;
          warranty_years?: number;
          is_active?: boolean;
          display_order?: number;
          created_at?: string;
        };
      };
      leads: {
        Row: {
          id: string;
          name: string;
          phone: string;
          email: string | null;
          address: string | null;
          city: string;
          product_interest: string | null;
          estimated_sqft: number | null;
          estimated_budget: number | null;
          source: string;
          priority: string;
          status: string;
          assigned_to: string | null;
          converted_client_id: string | null;
          notes: string | null;
          next_follow_up: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          phone: string;
          email?: string | null;
          address?: string | null;
          city?: string;
          product_interest?: string | null;
          estimated_sqft?: number | null;
          estimated_budget?: number | null;
          source?: string;
          priority?: string;
          status?: string;
          assigned_to?: string | null;
          converted_client_id?: string | null;
          notes?: string | null;
          next_follow_up?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          phone?: string;
          email?: string | null;
          address?: string | null;
          city?: string;
          product_interest?: string | null;
          estimated_sqft?: number | null;
          estimated_budget?: number | null;
          source?: string;
          priority?: string;
          status?: string;
          assigned_to?: string | null;
          converted_client_id?: string | null;
          notes?: string | null;
          next_follow_up?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          title: string;
          client_id: string;
          lead_id: string | null;
          site_location: string;
          project_type: string;
          status: string;
          start_date: string;
          expected_completion: string | null;
          actual_completion: string | null;
          contract_amount: number;
          amount_received: number;
          supervisor_id: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          client_id: string;
          lead_id?: string | null;
          site_location: string;
          project_type?: string;
          status?: string;
          start_date?: string;
          expected_completion?: string | null;
          actual_completion?: string | null;
          contract_amount?: number;
          amount_received?: number;
          supervisor_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          client_id?: string;
          lead_id?: string | null;
          site_location?: string;
          project_type?: string;
          status?: string;
          start_date?: string;
          expected_completion?: string | null;
          actual_completion?: string | null;
          contract_amount?: number;
          amount_received?: number;
          supervisor_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      gallery_images: {
        Row: {
          id: string;
          category_id: string | null;
          title: string;
          description: string | null;
          image_url: string;
          project_id: string | null;
          is_featured: boolean;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          category_id?: string | null;
          title: string;
          description?: string | null;
          image_url: string;
          project_id?: string | null;
          is_featured?: boolean;
          display_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string | null;
          title?: string;
          description?: string | null;
          image_url?: string;
          project_id?: string | null;
          is_featured?: boolean;
          display_order?: number;
          created_at?: string;
        };
      };
      client_quotes: {
        Row: {
          id: string;
          quote_number: string | null;
          client_id: string;
          package_id: string | null;
          total_sqft: number;
          rate_per_sqft: number;
          materials_cost: number;
          labor_cost: number;
          discount: number;
          total_amount: number;
          status: string;
          valid_until: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          quote_number?: string | null;
          client_id: string;
          package_id?: string | null;
          total_sqft?: number;
          rate_per_sqft?: number;
          materials_cost?: number;
          labor_cost?: number;
          discount?: number;
          total_amount?: number;
          status?: string;
          valid_until?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          quote_number?: string | null;
          client_id?: string;
          package_id?: string | null;
          total_sqft?: number;
          rate_per_sqft?: number;
          materials_cost?: number;
          labor_cost?: number;
          discount?: number;
          total_amount?: number;
          status?: string;
          valid_until?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      gallery_categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          display_order: number;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          display_order?: number;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          display_order?: number;
        };
      };
      staff_advances: {
        Row: {
          id: string;
          staff_id: string;
          advance_date: string;
          day_name: string;
          advance_month: number;
          advance_year: number;
          amount: number;
          payment_mode: string;
          reason: string;
          receipt_url: string | null;
          status: "pending" | "settled";
          settled_salary_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          staff_id: string;
          advance_date: string;
          day_name: string;
          advance_month: number;
          advance_year: number;
          amount: number;
          payment_mode?: string;
          reason: string;
          receipt_url?: string | null;
          status?: "pending" | "settled";
          settled_salary_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          staff_id?: string;
          advance_date?: string;
          day_name?: string;
          advance_month?: number;
          advance_year?: number;
          amount?: number;
          payment_mode?: string;
          reason?: string;
          receipt_url?: string | null;
          status?: "pending" | "settled";
          settled_salary_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      admin_expenses: {
        Row: {
          id: string;
          expense_date: string;
          day_name: string;
          expense_month: number;
          expense_year: number;
          expense_type: "company" | "personal";
          category: string;
          title: string;
          amount: number;
          payment_mode: string;
          description: string | null;
          receipt_url: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          expense_date: string;
          day_name: string;
          expense_month: number;
          expense_year: number;
          expense_type: "company" | "personal";
          category: string;
          title: string;
          amount: number;
          payment_mode?: string;
          description?: string | null;
          receipt_url?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          expense_date?: string;
          day_name?: string;
          expense_month?: number;
          expense_year?: number;
          expense_type?: "company" | "personal";
          category?: string;
          title?: string;
          amount?: number;
          payment_mode?: string;
          description?: string | null;
          receipt_url?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
