import { useState } from "react";
import { FlaskConical, Search, Check } from "lucide-react";
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

interface OrderLabTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: Tables<"patients">;
}

const OrderLabTestDialog = ({ open, onOpenChange, patient }: OrderLabTestDialogProps) => {
  const { toast } = useToast();
  const { data: templates = [], isLoading } = useLabTemplates();
  const insertLabTest = useInsertLabTest();
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const filtered = templates.filter(
    (t) =>
      t.test_name.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = filtered.reduce<Record<string, typeof templates>>((acc, t) => {
    (acc[t.category] ??= []).push(t);
    return acc;
  }, {});

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
      // Insert lab tests
      const labResults = await Promise.all(
        selected.map((t) =>
          insertLabTest.mutateAsync({
            patient_id: patient.id,
            test_name: t.test_name,
            category: t.category,
            status: "pending",
            normal_range: t.normal_ranges,
            notes: notes || null,
          })
        )
      );
      // Create billing items for cashier
      await Promise.all(
        selected.map((t) =>
          supabase.from("billing_items").insert({
            patient_id: patient.id,
            item_type: "lab_test",
            item_name: t.test_name,
            amount: t.price || 0,
            quantity: 1,
            total_amount: t.price || 0,
            status: "pending",
          } as any)
        )
      );
      toast({
        title: "Lab Tests Ordered",
        description: `${selected.length} test(s) ordered for ${patient.name}. Sent to Cashier.`,
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
            <FlaskConical className="w-5 h-5 text-primary" />
            Order Lab Tests
          </DialogTitle>
          <DialogDescription>
            Ordering for <span className="font-semibold text-foreground">{patient.name}</span> · {patient.age}Y · {patient.gender || "—"}
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search tests..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <ScrollArea className="flex-1 min-h-0 max-h-[340px] pr-2">
          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground text-sm">Loading templates...</p>
          ) : Object.keys(grouped).length === 0 ? (
            <p className="text-center py-8 text-muted-foreground text-sm">No tests found</p>
          ) : (
            Object.entries(grouped).map(([category, tests]) => (
              <div key={category} className="mb-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 px-1">
                  {category}
                </p>
                <div className="space-y-1">
                  {tests.map((t) => {
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
                          {t.normal_ranges && (
                            <p className="text-[11px] text-muted-foreground truncate">Range: {t.normal_ranges}</p>
                          )}
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
              </div>
            ))
          )}
        </ScrollArea>

        <Textarea
          placeholder="Clinical notes (optional)..."
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

export default OrderLabTestDialog;
