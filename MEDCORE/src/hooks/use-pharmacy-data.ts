import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// ─── Inventory ───
export const usePharmacyInventory = () => {
  return useQuery({
    queryKey: ["pharmacy_inventory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pharmacy_inventory")
        .select("*")
        .order("drug_name");
      if (error) throw error;
      return data;
    },
  });
};

export const useInsertInventoryItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: {
      drug_name: string;
      generic_name?: string;
      category?: string;
      unit_price: number;
      cost_price?: number;
      quantity_in_stock: number;
      reorder_level?: number;
      unit?: string;
      batch_number?: string;
      expiry_date?: string;
      supplier?: string;
    }) => {
      const { data, error } = await supabase
        .from("pharmacy_inventory")
        .insert(item)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pharmacy_inventory"] }),
  });
};

export const useUpdateInventoryItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { data, error } = await supabase
        .from("pharmacy_inventory")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pharmacy_inventory"] }),
  });
};

// ─── Prescriptions ───
export const usePrescriptions = (status?: string) => {
  return useQuery({
    queryKey: ["prescriptions", status],
    queryFn: async () => {
      let q = supabase
        .from("prescriptions")
        .select("*, patients(name, phone)")
        .order("created_at", { ascending: false });
      if (status) q = q.eq("status", status);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
};

export const useUpdatePrescription = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: any = { status };
      if (status === "dispensed") {
        updates.dispensed_by = user?.id;
        updates.dispensed_at = new Date().toISOString();
      }
      const { data, error } = await supabase
        .from("prescriptions")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["prescriptions"] }),
  });
};

// ─── Sales ───
export const usePharmacySales = () => {
  return useQuery({
    queryKey: ["pharmacy_sales"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pharmacy_sales")
        .select("*, pharmacy_sale_items(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};

export const useCreateSale = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({
      items,
      patient_name,
      patient_id,
      sale_type,
      payment_method,
    }: {
      items: { inventory_id: string; drug_name: string; quantity: number; unit_price: number }[];
      patient_name?: string;
      patient_id?: string;
      sale_type: string;
      payment_method?: string;
    }) => {
      const total_amount = items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);
      const receipt_number = `RX-${Date.now().toString(36).toUpperCase()}`;

      const { data: sale, error: saleError } = await supabase
        .from("pharmacy_sales")
        .insert({
          receipt_number,
          patient_name: patient_name || "Walk-in Customer",
          patient_id: patient_id || null,
          sale_type,
          total_amount,
          payment_method: payment_method || "Cash",
          sold_by: user?.id,
        })
        .select()
        .single();
      if (saleError) throw saleError;

      const saleItems = items.map((i) => ({
        sale_id: sale.id,
        inventory_id: i.inventory_id,
        drug_name: i.drug_name,
        quantity: i.quantity,
        unit_price: i.unit_price,
        total_price: i.quantity * i.unit_price,
      }));

      const { error: itemsError } = await supabase
        .from("pharmacy_sale_items")
        .insert(saleItems);
      if (itemsError) throw itemsError;

      // Deduct stock
      for (const item of items) {
        const { error: stockError } = await supabase.rpc("has_role", {
          _user_id: user?.id || "",
          _role: "admin",
        }); // dummy call - we update stock manually
        
        const { data: inv } = await supabase
          .from("pharmacy_inventory")
          .select("quantity_in_stock")
          .eq("id", item.inventory_id)
          .single();

        if (inv) {
          await supabase
            .from("pharmacy_inventory")
            .update({ quantity_in_stock: Math.max(0, inv.quantity_in_stock - item.quantity) })
            .eq("id", item.inventory_id);
        }
      }

      // Return sale with items
      const { data: fullSale } = await supabase
        .from("pharmacy_sales")
        .select("*, pharmacy_sale_items(*)")
        .eq("id", sale.id)
        .single();

      return fullSale;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pharmacy_sales"] });
      qc.invalidateQueries({ queryKey: ["pharmacy_inventory"] });
    },
  });
};
