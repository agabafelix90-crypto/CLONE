import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AIRequest {
  action: string;
  data: Record<string, any>;
}

export const useAIAssistant = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const generate = useCallback(async (request: AIRequest): Promise<string | null> => {
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("ai-clinical-assistant", {
        body: request,
      });
      if (error) throw error;
      if (!data.success) throw new Error(data.error || "AI generation failed");
      setResult(data.content);
      return data.content;
    } catch (err: any) {
      toast.error(err.message || "AI assistant unavailable");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { generate, loading, result, setResult };
};

export const useAutomatedReminders = () => {
  const [loading, setLoading] = useState(false);

  const sendReminders = useCallback(async (action: "appointment_reminders" | "debt_reminders", userId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("automated-reminders", {
        body: { action, user_id: userId },
      });
      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      toast.success(`${data.totalSent || 0} reminder(s) sent successfully`);
      return data;
    } catch (err: any) {
      toast.error(err.message || "Failed to send reminders");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { sendReminders, loading };
};
