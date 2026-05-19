import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface LabTest {
  id: string;
  patient_id: string;
  test_name: string;
  category: string;
  status: string;
  result: string | null;
  result_data: any;
  normal_range: string | null;
  is_positive: boolean;
  ordered_by: string | null;
  performed_by: string | null;
  notes: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface LabTestTemplate {
  id: string;
  test_name: string;
  category: string;
  parameters: any;
  normal_ranges: string | null;
  price: number;
  created_at: string;
}

// ─── Lab Tests ───
export const useLabTests = (filters?: { status?: string; patientId?: string }) => {
  return useQuery({
    queryKey: ["lab_tests", filters],
    queryFn: async () => {
      let q = supabase.from("lab_tests").select("*").order("created_at", { ascending: false });
      if (filters?.status) q = q.eq("status", filters.status);
      if (filters?.patientId) q = q.eq("patient_id", filters.patientId);
      const { data, error } = await q;
      if (error) throw error;
      return data as LabTest[];
    },
  });
};

export const useInsertLabTest = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (test: Omit<LabTest, "id" | "created_at" | "completed_at" | "ordered_by" | "performed_by" | "result" | "result_data" | "is_positive">) => {
      const { data, error } = await supabase
        .from("lab_tests")
        .insert({ ...test, ordered_by: user?.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data as LabTest;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lab_tests"] }),
  });
};

export const useUpdateLabTest = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<LabTest> & { id: string }) => {
      const payload: any = { ...updates };
      if (updates.status === "completed") {
        payload.performed_by = user?.id;
        payload.completed_at = new Date().toISOString();
      }
      const { data, error } = await supabase
        .from("lab_tests")
        .update(payload)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as LabTest;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lab_tests"] }),
  });
};

// ─── Lab Test Templates ───
export const useLabTemplates = () => {
  return useQuery({
    queryKey: ["lab_test_templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lab_test_templates")
        .select("*")
        .order("category")
        .order("test_name");
      if (error) throw error;
      return data as LabTestTemplate[];
    },
  });
};

export const useInsertLabTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (template: Omit<LabTestTemplate, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("lab_test_templates")
        .insert(template as any)
        .select()
        .single();
      if (error) throw error;
      return data as LabTestTemplate;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lab_test_templates"] }),
  });
};
