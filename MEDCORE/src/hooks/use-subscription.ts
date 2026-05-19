import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Subscription {
  id: string;
  user_id: string;
  plan: string;
  amount: number;
  starts_at: string;
  expires_at: string;
  payment_status: string;
  momo_reference: string | null;
  phone_number: string | null;
  created_at: string;
}

export const SUBSCRIPTION_PLANS = [
  { key: "daily", label: "1 Day", days: 1, price: 2000 },
  { key: "weekly", label: "1 Week", days: 7, price: 12000 },
  { key: "2weeks", label: "2 Weeks", days: 14, price: 22000 },
  { key: "monthly", label: "1 Month", days: 30, price: 40000 },
  { key: "3months", label: "3 Months", days: 90, price: 110000 },
  { key: "6months", label: "6 Months", days: 180, price: 200000 },
  { key: "yearly", label: "1 Year", days: 365, price: 360000 },
] as const;

export const useSubscription = () => {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["subscription", user?.id],
    queryFn: async () => {
      if (!user) return null;

      // 1) Primary check: active “completed” subscription not expired
      const nowISO = new Date().toISOString();
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("payment_status", "completed")
        .gte("expires_at", nowISO)
        .order("expires_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (data) return data as Subscription;

      // 2) Auto-renew expired trial accounts to avoid block screen
      const { data: trial, error: trialError } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("plan", "trial")
        .order("expires_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (trialError) throw trialError;
      if (trial && new Date(trial.expires_at) < new Date()) {
        const nextExpiry = new Date();
        nextExpiry.setDate(nextExpiry.getDate() + 14);

        const { data: updated, error: updErr } = await supabase
          .from("subscriptions")
          .update({ expires_at: nextExpiry.toISOString(), starts_at: new Date().toISOString() })
          .eq("id", trial.id)
          .select()
          .maybeSingle();

        if (updErr) throw updErr;
        return (updated as Subscription) || null;
      }

      return null;
    },
    enabled: !!user,
    refetchInterval: 60000, // check every minute
  });

  const isActive = !!query.data;
  const expiresAt = query.data?.expires_at ? new Date(query.data.expires_at) : null;
  const daysRemaining = expiresAt
    ? Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return {
    ...query,
    subscription: query.data,
    isActive,
    expiresAt,
    daysRemaining,
  };
};
