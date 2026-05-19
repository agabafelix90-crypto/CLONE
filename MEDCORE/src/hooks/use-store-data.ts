import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// ─── Store Invoices ───
export const useStoreInvoices = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["store_invoices", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("store_invoices")
        .select("*, store_invoice_items(*)")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};

export const useCreateInvoice = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({
      supplier,
      notes,
      items,
    }: {
      supplier: string;
      notes?: string;
      items: { inventory_id: string; drug_name: string; quantity: number; cost_price: number }[];
    }) => {
      const total_amount = items.reduce((s, i) => s + i.quantity * i.cost_price, 0);
      const invoice_number = `INV-${Date.now().toString(36).toUpperCase()}`;

      const { data: invoice, error: invErr } = await supabase
        .from("store_invoices")
        .insert({ invoice_number, supplier, total_amount, notes, received_by: user?.id })
        .select()
        .single();
      if (invErr) throw invErr;

      const invItems = items.map((i) => ({
        invoice_id: invoice.id,
        inventory_id: i.inventory_id,
        drug_name: i.drug_name,
        quantity: i.quantity,
        cost_price: i.cost_price,
        total_price: i.quantity * i.cost_price,
      }));

      const { error: itemsErr } = await supabase.from("store_invoice_items").insert(invItems);
      if (itemsErr) throw itemsErr;

      // Update stock quantities
      for (const item of items) {
        const { data: inv } = await supabase
          .from("pharmacy_inventory")
          .select("quantity_in_stock")
          .eq("id", item.inventory_id)
          .single();
        if (inv) {
          await supabase
            .from("pharmacy_inventory")
            .update({ quantity_in_stock: inv.quantity_in_stock + item.quantity })
            .eq("id", item.inventory_id);
        }
      }

      return invoice;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["store_invoices"] });
      qc.invalidateQueries({ queryKey: ["pharmacy_inventory"] });
    },
  });
};

// ─── Shelf Transfers ───
export const useStoreTransfers = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["store_transfers", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("store_transfers")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};

export const useCreateTransfer = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({
      inventory_id,
      drug_name,
      quantity,
      notes,
    }: {
      inventory_id: string;
      drug_name: string;
      quantity: number;
      notes?: string;
    }) => {
      // Record the transfer
      const { data, error } = await supabase
        .from("store_transfers")
        .insert({ inventory_id, drug_name, quantity, notes, transferred_by: user?.id })
        .select()
        .single();
      if (error) throw error;

      // Deduct stock from store inventory
      const { data: inv } = await supabase
        .from("pharmacy_inventory")
        .select("quantity_in_stock")
        .eq("id", inventory_id)
        .single();
      if (inv) {
        await supabase
          .from("pharmacy_inventory")
          .update({ quantity_in_stock: Math.max(0, inv.quantity_in_stock - quantity) })
          .eq("id", inventory_id);
      }

      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["store_transfers"] });
      qc.invalidateQueries({ queryKey: ["pharmacy_inventory"] });
    },
  });
};
