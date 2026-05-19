import { useEffect, useRef } from "react";
import { usePharmacyInventory } from "@/hooks/use-pharmacy-data";
import { toast } from "@/hooks/use-toast";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface LowStockAlertProps {
  showBanner?: boolean;
}

const LowStockAlert = ({ showBanner = true }: LowStockAlertProps) => {
  const { data: inventory = [] } = usePharmacyInventory();
  const toastShown = useRef(false);

  const lowStockDrugs = inventory.filter(
    (d) => d.quantity_in_stock <= (d.reorder_level ?? 10)
  );

  useEffect(() => {
    if (lowStockDrugs.length > 0 && !toastShown.current) {
      toastShown.current = true;
      toast({
        title: `⚠️ ${lowStockDrugs.length} drug${lowStockDrugs.length > 1 ? "s" : ""} below warning point`,
        description: lowStockDrugs.slice(0, 3).map((d) => d.drug_name).join(", ") +
          (lowStockDrugs.length > 3 ? ` and ${lowStockDrugs.length - 3} more` : ""),
        variant: "destructive",
      });
    }
  }, [lowStockDrugs.length]);

  if (!showBanner || lowStockDrugs.length === 0) return null;

  return (
    <Alert variant="destructive" className="border-destructive/50 bg-destructive/5">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Low Stock Warning</AlertTitle>
      <AlertDescription>
        <p className="mb-2 text-sm">
          {lowStockDrugs.length} drug{lowStockDrugs.length > 1 ? "s" : ""} below warning point:
        </p>
        <div className="flex flex-wrap gap-1.5">
          {lowStockDrugs.map((d) => (
            <span
              key={d.id}
              className="inline-flex items-center gap-1 rounded-md bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive"
            >
              {d.drug_name}
              <span className="opacity-70">({d.quantity_in_stock}/{d.reorder_level ?? 10})</span>
            </span>
          ))}
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default LowStockAlert;
