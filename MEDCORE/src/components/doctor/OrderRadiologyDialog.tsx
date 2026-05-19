import { useState } from "react";
import { Microscope, Search, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLabTemplates, useInsertLabTest } from "@/hooks/use-lab-data";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

interface OrderRadiologyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: Tables<"patients">;
}

const OrderRadiologyDialog = ({ open, onOpenChange, patient }: OrderRadiologyDialogProps) => {
  const { toast } = useToast();
  const { data: allTemplates = [], isLoading } = useLabTemplates();
  const insertTest = useInsertLabTest();
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Only show Radiology category templates
  const templates = allTemplates.filter(t => t.category === "Radiology");

  const filtered = templates.filter(
    (t) => t.test_name.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (selectedIds.size === 0) return;
    setSubmitting(true);
    try {
      const selected = templates.filter((t) => selectedIds.has(t.id));
      await Promise.all(
        selected.map((t) =>
          insertTest.mutateAsync({
            patient_id: patient.id,
            test_name: t.test_name,
            category: "Radiology",
            status: "pending",
            normal_range: null,
            notes: notes || null,
          })
        )
      );
      // Create billing items for cashier
      await Promise.all(
        selected.map((t) =>
          supabase.from("billing_items").insert({
            patient_id: patient.id,
            item_type: "radiology",
            item_name: t.test_name,
            amount: t.price || 0,
            quantity: 1,
            total_amount: t.price || 0,
            status: "pending",
          } as any)
        )
      );
      toast({
        title: "Radiology Scans Ordered",
        description: `${selected.length} scan(s) ordered for ${patient.name}. Sent to Cashier.`,
      });
      setSelectedIds(new Set());
      setNotes("");
      setSearch("");
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCount = selectedIds.size;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-heading">
            <Microscope className="w-5 h-5 text-primary" />
            Order Radiology Scans
          </DialogTitle>
          <DialogDescription>
            Ordering for <span className="font-semibold text-foreground">{patient.name}</span> · {patient.age}Y · {patient.gender || "—"}
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search scans..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <ScrollArea className="flex-1 min-h-0 max-h-[340px] pr-2">
          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground text-sm">Loading scans...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground text-sm">No radiology scans found. Add them in Settings → Set Lab Exams under "Radiology" category.</p>
          ) : (
            <div className="space-y-1">
              {filtered.map((t) => {
                const checked = selectedIds.has(t.id);
                return (
                  <label
                    key={t.id}
                    className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors ${
                      checked
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <Checkbox checked={checked} onCheckedChange={() => toggle(t.id)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{t.test_name}</p>
                    </div>
                    {t.price != null && t.price > 0 && (
                      <Badge variant="secondary" className="text-[10px] shrink-0">
                        {Number(t.price).toLocaleString()} UGX
                      </Badge>
                    )}
                  </label>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <Textarea
          placeholder="Clinical indication (optional)..."
          className="resize-none"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={selectedCount === 0 || submitting}
            className="gap-2"
          >
            <Check className="w-4 h-4" />
            Order {selectedCount > 0 ? `(${selectedCount})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OrderRadiologyDialog;
