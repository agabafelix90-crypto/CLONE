import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Mother, ObstetricEntry } from "./types";

interface Props {
  open: boolean;
  onClose: () => void;
  mother: Mother;
}

const emptyRow = (): ObstetricEntry => ({
  id: `OB-${Date.now()}`,
  pregnancy: "", year: "", abortionsBelow12: "", abortionsAbove12: "",
  preMature: "", fullTerm: "", thirdStage: "", purePerium: "",
  aliveSBNND: "", sex: "", birthWeight: "", immunization: "", healthConditions: "",
});

const columns = [
  { key: "pregnancy", label: "Pregnancy" },
  { key: "year", label: "Year" },
  { key: "abortionsBelow12", label: "< 12 Wks" },
  { key: "abortionsAbove12", label: "> 12 Wks" },
  { key: "preMature", label: "Pre-Mature" },
  { key: "fullTerm", label: "Full Term" },
  { key: "thirdStage", label: "3rd Stage" },
  { key: "purePerium", label: "Pureperium" },
  { key: "aliveSBNND", label: "Alive/SB/NND" },
  { key: "sex", label: "Sex" },
  { key: "birthWeight", label: "Birth Wt" },
  { key: "immunization", label: "Immun." },
  { key: "healthConditions", label: "Conditions" },
];

const ObstetricHistoryDialog = ({ open, onClose, mother }: Props) => {
  const { toast } = useToast();
  const [rows, setRows] = useState<ObstetricEntry[]>([emptyRow()]);

  const addRow = () => setRows([...rows, emptyRow()]);
  const removeRow = (id: string) => setRows(rows.filter((r) => r.id !== id));
  const updateCell = (id: string, key: string, value: string) => {
    setRows(rows.map((r) => (r.id === id ? { ...r, [key]: value } : r)));
  };

  const handleSubmit = () => {
    toast({ title: "Obstetric history saved", description: `Saved ${rows.length} entries for ${mother.name}` });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[90vh] p-0">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="font-heading">Obstetric History for {mother.name}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[70vh]">
          <div className="px-4 pb-4 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((c) => (
                    <TableHead key={c.key} className="text-xs whitespace-nowrap">{c.label}</TableHead>
                  ))}
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    {columns.map((c) => (
                      <TableCell key={c.key} className="p-1">
                        <Input
                          className="h-8 text-xs min-w-[70px]"
                          value={(row as any)[c.key]}
                          onChange={(e) => updateCell(row.id, c.key, e.target.value)}
                        />
                      </TableCell>
                    ))}
                    <TableCell className="p-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeRow(row.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Button variant="outline" size="sm" className="mt-2 gap-1" onClick={addRow}>
              <Plus className="w-3.5 h-3.5" /> Add Row
            </Button>
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={onClose}>Close</Button>
              <Button onClick={handleSubmit}>Submit</Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ObstetricHistoryDialog;
