import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Mother, AntenatalProgressEntry } from "./types";

interface Props {
  open: boolean;
  onClose: () => void;
  mother: Mother;
}

const emptyEntry = (): AntenatalProgressEntry => ({
  id: `AP-${Date.now()}`, date: "", weeksAmenorrhoea: "", fundalHeight: "",
  presentation: "", positionHe: "", relationPPBrim: "", foetalHeart: "",
  weight: "", hp: "", varienceOedema: "", urine: "", ttip: "",
  netUse: "", complaints: "", returnDate: "", examinerName: "",
});

const progressColumns = [
  { key: "date", label: "Date" }, { key: "weeksAmenorrhoea", label: "Wks Amen." },
  { key: "fundalHeight", label: "Fundal Ht" }, { key: "presentation", label: "Present." },
  { key: "positionHe", label: "Pos/He" }, { key: "relationPPBrim", label: "PP/Brim" },
  { key: "foetalHeart", label: "FHR" }, { key: "weight", label: "Wt" },
  { key: "hp", label: "HP" }, { key: "varienceOedema", label: "Var/Oed" },
  { key: "urine", label: "Urine" }, { key: "ttip", label: "TTIP" },
  { key: "netUse", label: "Net" }, { key: "complaints", label: "Complaints" },
  { key: "returnDate", label: "Return" }, { key: "examinerName", label: "Examiner" },
];

const investigationItems = ["Blood Hb", "RPR/VDRL", "MP", "HIV", "Others", "X-Ray"];

const AntenatalProgressDialog = ({ open, onClose, mother }: Props) => {
  const { toast } = useToast();
  const [rows, setRows] = useState<AntenatalProgressEntry[]>([emptyEntry()]);
  const [investigations, setInvestigations] = useState<Record<string, boolean>>({});
  const [pelvicAssessment, setPelvicAssessment] = useState({
    diagonalConjugate: "", sacralCurve: "", ischialSpines: "",
    subpubicArch: "", ischialTuberosities: "", pelvisAssessment: "",
  });
  const [ultraSound, setUltraSound] = useState("");
  const [riskFactors, setRiskFactors] = useState("");
  const [treatment, setTreatment] = useState("");

  const addRow = () => setRows([...rows, emptyEntry()]);
  const removeRow = (id: string) => setRows(rows.filter((r) => r.id !== id));
  const updateCell = (id: string, key: string, value: string) => {
    setRows(rows.map((r) => (r.id === id ? { ...r, [key]: value } : r)));
  };

  const handleSubmit = () => {
    toast({ title: "Antenatal progress saved", description: `Updated for ${mother.name}` });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[90vh] p-0">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="font-heading">Antenatal Progress Examination - {mother.name}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[75vh]">
          <div className="px-4 pb-4 space-y-4">
            {/* Progress Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {progressColumns.map((c) => (
                      <TableHead key={c.key} className="text-[10px] whitespace-nowrap px-1">{c.label}</TableHead>
                    ))}
                    <TableHead className="w-8" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id}>
                      {progressColumns.map((c) => (
                        <TableCell key={c.key} className="p-0.5">
                          <Input
                            className="h-7 text-[11px] min-w-[60px] px-1"
                            value={(row as any)[c.key]}
                            onChange={(e) => updateCell(row.id, c.key, e.target.value)}
                          />
                        </TableCell>
                      ))}
                      <TableCell className="p-0.5">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeRow(row.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Button variant="outline" size="sm" className="mt-2 gap-1" onClick={addRow}>
                <Plus className="w-3.5 h-3.5" /> Add Entry
              </Button>
            </div>

            {/* Investigations */}
            <div>
              <h3 className="text-sm font-heading font-semibold text-primary border-b border-border pb-1 mb-2">Investigations</h3>
              <p className="text-xs text-muted-foreground mb-2 italic">
                NB: For lab/ultrasound requests, please go to triage and make the request.
              </p>
              <div className="grid grid-cols-3 gap-2">
                {investigationItems.map((item) => (
                  <label key={item} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={!!investigations[item]} onCheckedChange={() => setInvestigations({ ...investigations, [item]: !investigations[item] })} />
                    {item}
                  </label>
                ))}
              </div>
            </div>

            {/* Pelvic Assessment */}
            <div>
              <h3 className="text-sm font-heading font-semibold text-primary border-b border-border pb-1 mb-2">Pelvic Assessment - Done at 36 weeks</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(pelvicAssessment).map(([key, val]) => (
                  <div key={key}>
                    <Label className="text-xs capitalize">{key.replace(/([A-Z])/g, " $1")}</Label>
                    <Input value={val} onChange={(e) => setPelvicAssessment({ ...pelvicAssessment, [key]: e.target.value })} />
                  </div>
                ))}
              </div>
            </div>

            {/* Ultra Sound & Risk */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><Label>Ultra Sound Reports & Dates</Label><Input value={ultraSound} onChange={(e) => setUltraSound(e.target.value)} /></div>
              <div><Label>Risk Factors</Label><Input value={riskFactors} onChange={(e) => setRiskFactors(e.target.value)} /></div>
            </div>

            {/* Treatment */}
            <div>
              <p className="text-xs text-muted-foreground italic mb-1">
                NB: For treatment given, proceed to dispensing shelves, click non sale stock removal and record the drugs.
              </p>
              <Label>Treatment</Label>
              <Input value={treatment} onChange={(e) => setTreatment(e.target.value)} />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={onClose}>Close</Button>
              <Button onClick={handleSubmit}>Submit</Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default AntenatalProgressDialog;
