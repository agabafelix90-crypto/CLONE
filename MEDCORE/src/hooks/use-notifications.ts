import { useEffect, useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  category: string;
  is_read: boolean;
  link: string | null;
  created_at: string;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!user,
  });

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] }),
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] }),
  });

  const deleteNotification = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notifications").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] }),
  });

  return { notifications, unreadCount, isLoading, markAsRead, markAllAsRead, deleteNotification };
};

// Hook that generates system notifications based on current data state
export const useNotificationGenerator = () => {
  const { user } = useAuth();

  const generateNotifications = useCallback(async () => {
    if (!user) return;

    // Low stock alerts
    const { data: lowStock } = await supabase
      .from("pharmacy_inventory")
      .select("drug_name, quantity_in_stock, reorder_level")
      .not("reorder_level", "is", null);

    const lowStockItems = (lowStock || []).filter(
      (item) => item.reorder_level && item.quantity_in_stock <= item.reorder_level
    );

    if (lowStockItems.length > 0) {
      // Check if we already sent a low-stock notification today
      const today = new Date().toISOString().split("T")[0];
      const { data: existing } = await supabase
        .from("notifications")
        .select("id")
        .eq("user_id", user.id)
        .eq("category", "low_stock")
        .gte("created_at", today + "T00:00:00Z")
        .limit(1);

      if (!existing || existing.length === 0) {
        const names = lowStockItems.slice(0, 3).map((i) => i.drug_name).join(", ");
        const extra = lowStockItems.length > 3 ? ` and ${lowStockItems.length - 3} more` : "";
        await supabase.from("notifications").insert({
          user_id: user.id,
          title: "Low Stock Alert",
          message: `${lowStockItems.length} item(s) below reorder level: ${names}${extra}`,
          type: "warning",
          category: "low_stock",
          link: "/dashboard/store",
        });
      }
    }

    // Pending lab results
    const { data: pendingLabs } = await supabase
      .from("lab_tests")
      .select("id")
      .eq("status", "pending");

    if (pendingLabs && pendingLabs.length > 0) {
      const today = new Date().toISOString().split("T")[0];
      const { data: existing } = await supabase
        .from("notifications")
        .select("id")
        .eq("user_id", user.id)
        .eq("category", "pending_labs")
        .gte("created_at", today + "T00:00:00Z")
        .limit(1);

      if (!existing || existing.length === 0) {
        await supabase.from("notifications").insert({
          user_id: user.id,
          title: "Pending Lab Results",
          message: `${pendingLabs.length} lab test(s) awaiting results`,
          type: "info",
          category: "pending_labs",
          link: "/dashboard/laboratory",
        });
      }
    }

    // Pending prescriptions
    const { data: pendingRx } = await supabase
      .from("prescriptions")
      .select("id")
      .eq("status", "pending");

    if (pendingRx && pendingRx.length > 0) {
      const today = new Date().toISOString().split("T")[0];
      const { data: existing } = await supabase
        .from("notifications")
        .select("id")
        .eq("user_id", user.id)
        .eq("category", "pending_rx")
        .gte("created_at", today + "T00:00:00Z")
        .limit(1);

      if (!existing || existing.length === 0) {
        await supabase.from("notifications").insert({
          user_id: user.id,
          title: "Pending Prescriptions",
          message: `${pendingRx.length} prescription(s) awaiting dispensing`,
          type: "info",
          category: "pending_rx",
          link: "/dashboard/pharmacy",
        });
      }
    }
  }, [user]);

  // Run once on mount
  useEffect(() => {
    generateNotifications();
  }, [generateNotifications]);
};
