import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ParsedDrug {
  drug_name: string;
  category: string;
  unit: string;
  cost_price: number;
  unit_price: number;
  reorder_level: number;
  valid: boolean;
  error?: string;
}

const SAMPLE_CSV = `drug_name,category,unit,cost_price,selling_price,warning_point
Amoxicillin 500mg,Antibiotics,Capsules,200,500,20
Paracetamol 500mg,Analgesics,Tablets,50,200,50
Coartem,Antimalarials,Tablets,1500,3000,30`;

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCsv(text: string): ParsedDrug[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, "_"));

  const nameIdx = headers.findIndex((h) => h.includes("drug") || h === "name");
  const catIdx = headers.findIndex((h) => h.includes("categ"));
  const unitIdx = headers.findIndex((h) => h.includes("unit") || h.includes("packag"));
  const costIdx = headers.findIndex((h) => h.includes("cost"));
  const sellIdx = headers.findIndex((h) => h.includes("sell") || h.includes("unit_price") || h === "price");
  const reorderIdx = headers.findIndex((h) => h.includes("reorder") || h.includes("warning"));

  if (nameIdx === -1) return [];

  return lines.slice(1).map((line) => {
    const cols = parseCsvLine(line);
    const drug_name = cols[nameIdx]?.trim() || "";
    const category = cols[catIdx]?.trim() || "General";
    const unit = cols[unitIdx]?.trim() || "Tablets";
    const cost_price = parseFloat(cols[costIdx] || "0") || 0;
    const unit_price = parseFloat(cols[sellIdx >= 0 ? sellIdx : costIdx] || "0") || 0;
    const reorder_level = parseInt(cols[reorderIdx] || "20") || 20;

    let valid = true;
    let error: string | undefined;
    if (!drug_name) {
      valid = false;
      error = "Missing drug name";
    } else if (unit_price <= 0) {
      valid = false;
      error = "Selling price must be > 0";
    }

    return { drug_name, category, unit, cost_price, unit_price, reorder_level, valid, error };
  });
}

export default function CsvDrugImport() {
  const [open, setOpen] = useState(false);
  const [parsed, setParsed] = useState<ParsedDrug[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const validCount = parsed.filter((d) => d.valid).length;
  const invalidCount = parsed.filter((d) => !d.valid).length;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".csv")) {
      toast({ title: "Please upload a .csv file", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const drugs = parseCsv(text);
      if (drugs.length === 0) {
        toast({ title: "No valid rows found. Check CSV format.", variant: "destructive" });
        return;
      }
      setParsed(drugs);
      setOpen(true);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleImport = async () => {
    const valid = parsed.filter((d) => d.valid);
    if (valid.length === 0) return;

    setImporting(true);
    setProgress(0);

    const BATCH = 20;
    let imported = 0;
    let errors = 0;

    for (let i = 0; i < valid.length; i += BATCH) {
      const batch = valid.slice(i, i + BATCH).map((d) => ({
        drug_name: d.drug_name,
        category: d.category,
        unit: d.unit,
        cost_price: d.cost_price,
        unit_price: d.unit_price,
        quantity_in_stock: 0,
        reorder_level: d.reorder_level,
      }));

      const { error } = await supabase.from("pharmacy_inventory").insert(batch);
      if (error) {
        errors += batch.length;
      } else {
        imported += batch.length;
      }
      setProgress(Math.round(((i + batch.length) / valid.length) * 100));
    }

    queryClient.invalidateQueries({ queryKey: ["pharmacy_inventory"] });
    setImporting(false);
    setOpen(false);
    setParsed([]);

    toast({
      title: `Import complete: ${imported} added${errors > 0 ? `, ${errors} failed` : ""}`,
      variant: errors > 0 ? "destructive" : "default",
    });
  };

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "drugs_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={downloadSample}>
          <Download className="w-4 h-4 mr-1" /> CSV Template
        </Button>
        <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
          <Upload className="w-4 h-4 mr-1" /> Import CSV
        </Button>
      </div>

      <Dialog open={open} onOpenChange={(v) => !importing && setOpen(v)}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-primary" /> CSV Import Preview
            </DialogTitle>
            <DialogDescription>
              Review the parsed data below before importing.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-3 text-sm">
            <Badge variant="secondary" className="gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> {validCount} valid
            </Badge>
            {invalidCount > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {invalidCount} invalid
              </Badge>
            )}
          </div>

          <div className="overflow-auto flex-1 border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Drug Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Selling</TableHead>
                  <TableHead className="text-center">Warning</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parsed.map((d, i) => (
                  <TableRow key={i} className={d.valid ? "" : "bg-destructive/10"}>
                    <TableCell>
                      {d.valid ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <span className="text-xs text-destructive">{d.error}</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{d.drug_name || "—"}</TableCell>
                    <TableCell>{d.category}</TableCell>
                    <TableCell>{d.unit}</TableCell>
                    <TableCell className="text-right">{d.cost_price.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{d.unit_price.toLocaleString()}</TableCell>
                    <TableCell className="text-center">{d.reorder_level}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {importing && <Progress value={progress} className="h-2" />}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={importing}>
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={importing || validCount === 0}>
              {importing ? `Importing… ${progress}%` : `Import ${validCount} Drugs`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
