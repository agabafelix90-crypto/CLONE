import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, User, Clock, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface PatientResult {
  id: string;
  name: string;
  age: number;
  gender: string | null;
  status: string;
  phone: string | null;
}

const statusColors: Record<string, string> = {
  "Just Come": "bg-muted text-muted-foreground",
  "Admitted": "bg-accent/15 text-accent",
  "Outpatient": "bg-primary/15 text-primary",
  "In Labour": "bg-destructive/15 text-destructive",
  "On Antenatal": "bg-primary/15 text-primary",
  "Post Natal": "bg-primary/10 text-primary",
  "Discharged": "bg-muted text-muted-foreground",
};

const PatientSearchBar = () => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [recentIds, setRecentIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("recent-patients") || "[]");
    } catch {
      return [];
    }
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Search patients
  const { data: results = [], isFetching } = useQuery({
    queryKey: ["patient-search", query],
    queryFn: async () => {
      if (query.trim().length < 2) return [];
      const { data, error } = await supabase
        .from("patients")
        .select("id, name, age, gender, status, phone")
        .or(`name.ilike.%${query.trim()}%,phone.ilike.%${query.trim()}%`)
        .order("created_at", { ascending: false })
        .limit(8);
      if (error) throw error;
      return data as PatientResult[];
    },
    enabled: query.trim().length >= 2,
  });

  // Fetch recent patients
  const { data: recentPatients = [] } = useQuery({
    queryKey: ["recent-patients", recentIds],
    queryFn: async () => {
      if (recentIds.length === 0) return [];
      const { data, error } = await supabase
        .from("patients")
        .select("id, name, age, gender, status, phone")
        .in("id", recentIds)
        .limit(5);
      if (error) throw error;
      // Preserve order
      return recentIds
        .map((id) => (data as PatientResult[]).find((p) => p.id === id))
        .filter(Boolean) as PatientResult[];
    },
    enabled: recentIds.length > 0 && open && query.trim().length < 2,
  });

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Keyboard shortcut: Ctrl+K / Cmd+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const selectPatient = (patient: PatientResult) => {
    // Add to recents
    const updated = [patient.id, ...recentIds.filter((id) => id !== patient.id)].slice(0, 5);
    setRecentIds(updated);
    localStorage.setItem("recent-patients", JSON.stringify(updated));

    setOpen(false);
    setQuery("");

    // Navigate to doctor page (main patient detail view)
    navigate("/dashboard/doctor");
  };

  const showResults = query.trim().length >= 2;
  const displayList = showResults ? results : recentPatients;
  const showDropdown = open && (displayList.length > 0 || (showResults && isFetching));

  return (
    <div ref={containerRef} className="relative flex-1 max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search patients… (Ctrl+K)"
          className="w-full pl-9 pr-10 py-2 rounded-lg border border-border/50 bg-muted/40 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:bg-background transition-all"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); inputRef.current?.focus(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        {!query && (
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-border bg-muted text-[10px] text-muted-foreground font-mono">
            ⌘K
          </kbd>
        )}
      </div>

      <AnimatePresence>
        {showDropdown && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.12 }}
              className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-card border border-border rounded-xl shadow-elevated overflow-hidden"
            >
              {!showResults && recentPatients.length > 0 && (
                <div className="px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3 h-3" /> Recent
                </div>
              )}

              {isFetching && showResults && (
                <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mx-auto mb-2" />
                  Searching…
                </div>
              )}

              {showResults && !isFetching && results.length === 0 && (
                <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                  No patients found for "{query}"
                </div>
              )}

              {displayList.map((patient) => (
                <button
                  key={patient.id}
                  onClick={() => selectPatient(patient)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors text-left group"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{patient.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {patient.age}y{patient.gender ? ` · ${patient.gender}` : ""}{patient.phone ? ` · ${patient.phone}` : ""}
                    </p>
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${statusColors[patient.status] || "bg-muted text-muted-foreground"}`}>
                    {patient.status}
                  </span>
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PatientSearchBar;
