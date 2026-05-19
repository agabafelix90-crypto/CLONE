import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";

// ─── Patients ───
export const usePatients = (filters?: { status?: string; ward?: string }) => {
  return useQuery({
    queryKey: ["patients", filters],
    queryFn: async () => {
      let q = supabase.from("patients").select("*").order("created_at", { ascending: false });
      if (filters?.status) q = q.eq("status", filters.status as any);
      if (filters?.ward) q = q.eq("ward", filters.ward);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
};

export const useInsertPatient = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (patient: Omit<TablesInsert<"patients">, "created_by">) => {
      const { data, error } = await supabase
        .from("patients")
        .insert({ ...patient, created_by: user?.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["patients"] }),
  });
};

export const useUpdatePatient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<"patients"> & { id: string }) => {
      const { data, error } = await supabase
        .from("patients")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["patients"] }),
  });
};

// ─── Vitals ───
export const useVitals = (patientId?: string) => {
  return useQuery({
    queryKey: ["vitals", patientId],
    queryFn: async () => {
      let q = supabase.from("vitals").select("*").order("recorded_at", { ascending: false });
      if (patientId) q = q.eq("patient_id", patientId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
};

export const useInsertVitals = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (vitals: Omit<TablesInsert<"vitals">, "recorded_by">) => {
      const { data, error } = await supabase
        .from("vitals")
        .insert({ ...vitals, recorded_by: user?.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vitals"] }),
  });
};

// ─── Medications ───
export const useMedications = (patientId?: string) => {
  return useQuery({
    queryKey: ["medications", patientId],
    queryFn: async () => {
      let q = supabase.from("medications").select("*").order("created_at", { ascending: false });
      if (patientId) q = q.eq("patient_id", patientId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
};

export const useInsertMedication = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (med: TablesInsert<"medications">) => {
      const { data, error } = await supabase
        .from("medications")
        .insert(med)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["medications"] }),
  });
};

export const useUpdateMedication = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<"medications"> & { id: string }) => {
      const { data, error } = await supabase
        .from("medications")
        .update({ ...updates, administered_by: user?.id, administered_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["medications"] }),
  });
};

// ─── Wards ───
export const useWards = () => {
  return useQuery({
    queryKey: ["wards"],
    queryFn: async () => {
      const { data, error } = await supabase.from("wards").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });
};
