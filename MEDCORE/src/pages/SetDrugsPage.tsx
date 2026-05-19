import { useEffect, useState } from "react";
import { usePharmacyInventory, useInsertInventoryItem, useUpdateInventoryItem } from "@/hooks/use-pharmacy-data";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Pencil, Pill, Search } from "lucide-react";
import CsvDrugImport from "@/components/pharmacy/CsvDrugImport";
import LowStockAlert from "@/components/pharmacy/LowStockAlert";

const CATEGORIES = ["General", "Antibiotics", "Analgesics", "Antimalarials", "Antihypertensives", "Vitamins", "Antacids", "Antihistamines", "Other"];
const UNITS = ["Tablets", "Capsules", "Bottles", "Ampoules", "Vials", "Sachets", "Tubes", "Tins", "Boxes", "Syringes"];
const TREATMENT_LINES = ["first_line", "second_line", "adjunct"];
const ROUTES = ["Oral", "IV", "IM", "Topical", "Rectal", "SC", "Inhalation", "Nasal"];
const DURATION_UNITS = ["Days", "Weeks", "Months", "Doses"];

interface ClinicalGuideline {
  id: string;
  condition_key: string;
  condition_label: string;
  line_of_treatment: string;
  drug_name: string;
  route: string;
  dosage: string;
  frequency: string;
  duration_value: number;
  duration_unit: string;
  pregnancy_safe: boolean | null;
  notes: string | null;
}

const SetDrugsPage = () => {
  const { data: drugs = [], isLoading } = usePharmacyInventory();
  const insertDrug = useInsertInventoryItem();
  const updateDrug = useUpdateInventoryItem();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [drugName, setDrugName] = useState("");
  const [category, setCategory] = useState("");
  const [unit, setUnit] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [reorderLevel, setReorderLevel] = useState("20");

  // Edit state
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState("");
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editUnit, setEditUnit] = useState("");
  const [editCostPrice, setEditCostPrice] = useState("");
  const [editSellingPrice, setEditSellingPrice] = useState("");
  const [editReorderLevel, setEditReorderLevel] = useState("");

  // Guideline state
  const [guidelines, setGuidelines] = useState<ClinicalGuideline[]>([]);
  const [loadingGuidelines, setLoadingGuidelines] = useState(false);
  const [guidelineSearch, setGuidelineSearch] = useState("");
  const [guidelineOpen, setGuidelineOpen] = useState(false);
  const [guidelineEditId, setGuidelineEditId] = useState<string | null>(null);
  const [conditionKey, setConditionKey] = useState("");
  const [conditionLabel, setConditionLabel] = useState("");
  const [treatmentLine, setTreatmentLine] = useState("first_line");
  const [guidelineDrugName, setGuidelineDrugName] = useState("");
  const [guidelineRoute, setGuidelineRoute] = useState("Oral");
  const [guidelineDosage, setGuidelineDosage] = useState("");
  const [guidelineFrequency, setGuidelineFrequency] = useState("");
  const [guidelineDurationValue, setGuidelineDurationValue] = useState("1");
  const [guidelineDurationUnit, setGuidelineDurationUnit] = useState("Days");
  const [guidelinePregnancySafe, setGuidelinePregnancySafe] = useState("yes");
  const [guidelineNotes, setGuidelineNotes] = useState("");

  const handleAdd = () => {
    if (!drugName.trim() || !unit || !sellingPrice) {
      toast({ title: "Please fill Drug Name, Unit and Selling Price", variant: "destructive" });
      return;
    }
    insertDrug.mutate(
      {
        drug_name: drugName.trim(),
        category: category || "General",
        unit: unit,
        cost_price: costPrice ? parseFloat(costPrice) : 0,
        unit_price: parseFloat(sellingPrice),
        quantity_in_stock: 0,
        reorder_level: parseInt(reorderLevel) || 20,
      },
      {
        onSuccess: () => {
          toast({ title: "Drug added successfully" });
          setDrugName(""); setCategory(""); setUnit(""); setCostPrice(""); setSellingPrice(""); setReorderLevel("20");
        },
        onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
      }
    );
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}" from the drug catalog?`)) return;
    const { error } = await supabase.from("pharmacy_inventory").delete().eq("id", id);
    if (error) {
      toast({ title: "Error deleting", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Drug deleted" });
      queryClient.invalidateQueries({ queryKey: ["pharmacy_inventory"] });
    }
  };

  const openEdit = (drug: any) => {
    setEditId(drug.id);
    setEditName(drug.drug_name);
    setEditCategory(drug.category || "General");
    setEditUnit(drug.unit || "Tablets");
    setEditCostPrice(String(drug.cost_price || 0));
    setEditSellingPrice(String(drug.unit_price));
    setEditReorderLevel(String(drug.reorder_level || 20));
    setEditOpen(true);
  };

  const handleUpdate = () => {
    if (!editName.trim() || !editSellingPrice) {
      toast({ title: "Name and Selling Price are required", variant: "destructive" });
      return;
    }
    updateDrug.mutate(
      {
        id: editId,
        drug_name: editName.trim(),
        category: editCategory,
        unit: editUnit,
        cost_price: parseFloat(editCostPrice) || 0,
        unit_price: parseFloat(editSellingPrice),
        reorder_level: parseInt(editReorderLevel) || 20,
      },
      {
        onSuccess: () => {
          toast({ title: "Drug updated successfully" });
          setEditOpen(false);
        },
        onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
      }
    );
  };

  const resetGuidelineForm = () => {
    setGuidelineEditId(null);
    setConditionKey("");
    setConditionLabel("");
    setTreatmentLine("first_line");
    setGuidelineDrugName("");
    setGuidelineRoute("Oral");
    setGuidelineDosage("");
    setGuidelineFrequency("");
    setGuidelineDurationValue("1");
    setGuidelineDurationUnit("Days");
    setGuidelinePregnancySafe("yes");
    setGuidelineNotes("");
  };

  const loadGuidelines = async () => {
    setLoadingGuidelines(true);
    const { data, error } = await supabase
      .from("clinical_drug_guidelines")
      .select("*")
      .order("condition_label")
      .order("line_of_treatment");
    setLoadingGuidelines(false);
    if (error) {
      toast({ title: "Failed to load guidelines", description: error.message, variant: "destructive" });
      return;
    }
    setGuidelines((data || []) as ClinicalGuideline[]);
  };

  useEffect(() => {
    loadGuidelines();
  }, []);

  const openGuidelineEdit = (row: ClinicalGuideline) => {
    setGuidelineEditId(row.id);
    setConditionKey(row.condition_key);
    setConditionLabel(row.condition_label);
    setTreatmentLine(row.line_of_treatment);
    setGuidelineDrugName(row.drug_name);
    setGuidelineRoute(row.route);
    setGuidelineDosage(row.dosage);
    setGuidelineFrequency(row.frequency);
    setGuidelineDurationValue(String(row.duration_value || 1));
    setGuidelineDurationUnit(row.duration_unit || "Days");
    setGuidelinePregnancySafe(row.pregnancy_safe === false ? "no" : "yes");
    setGuidelineNotes(row.notes || "");
    setGuidelineOpen(true);
  };

  const saveGuideline = async () => {
    if (!conditionKey.trim() || !conditionLabel.trim() || !guidelineDrugName.trim()) {
      toast({ title: "Condition key, condition label and drug are required", variant: "destructive" });
      return;
    }
    const payload = {
      condition_key: conditionKey.trim().toLowerCase(),
      condition_label: conditionLabel.trim(),
      line_of_treatment: treatmentLine,
      drug_name: guidelineDrugName.trim(),
      route: guidelineRoute,
      dosage: guidelineDosage.trim(),
      frequency: guidelineFrequency.trim(),
      duration_value: Math.max(1, parseInt(guidelineDurationValue || "1")),
      duration_unit: guidelineDurationUnit,
      pregnancy_safe: guidelinePregnancySafe === "yes",
      notes: guidelineNotes.trim() || null,
    };

    const response = guidelineEditId
      ? await supabase.from("clinical_drug_guidelines").update(payload).eq("id", guidelineEditId)
      : await supabase.from("clinical_drug_guidelines").insert(payload);

    if (response.error) {
      toast({ title: "Failed to save guideline", description: response.error.message, variant: "destructive" });
      return;
    }

    toast({ title: guidelineEditId ? "Guideline updated" : "Guideline added" });
    setGuidelineOpen(false);
    resetGuidelineForm();
    loadGuidelines();
  };

  const deleteGuideline = async (id: string) => {
    if (!confirm("Delete this guideline row?")) return;
    const { error } = await supabase.from("clinical_drug_guidelines").delete().eq("id", id);
    if (error) {
      toast({ title: "Failed to delete guideline", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Guideline deleted" });
    loadGuidelines();
  };

  const filtered = [...drugs]
    .filter(d => d.drug_name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.drug_name.localeCompare(b.drug_name));

  const filteredGuidelines = guidelines.filter((g) =>
    [g.condition_label, g.condition_key, g.drug_name, g.line_of_treatment]
      .join(" ")
      .toLowerCase()
      .includes(guidelineSearch.toLowerCase())
  );

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <LowStockAlert />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2">
            <Pill className="w-6 h-6 text-primary" /> Set Drugs
          </h1>
          <p className="text-sm text-muted-foreground">Manage the pharmacy drug catalog — names, packaging, pricing and warning points.</p>
        </div>
        <div className="flex items-center gap-3">
          <CsvDrugImport />
          <span className="text-sm font-medium text-muted-foreground bg-muted px-3 py-1.5 rounded-lg">
            💊 System Drugs: <strong className="text-foreground">{drugs.length}</strong>
          </span>
        </div>
      </div>

      {/* Add New Drug */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add New Drug</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
            <div className="space-y-1.5">
              <Label>Drug Name</Label>
              <Input placeholder="e.g. Amoxicillin" value={drugName} onChange={e => setDrugName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Packaging / Unit</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Cost Price (UGX)</Label>
              <Input type="number" placeholder="0" value={costPrice} onChange={e => setCostPrice(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Selling Price (UGX)</Label>
              <Input type="number" placeholder="e.g. 500" value={sellingPrice} onChange={e => setSellingPrice(e.target.value)} />
            </div>
            <Button onClick={handleAdd} disabled={insertDrug.isPending}>
              <Plus className="w-4 h-4 mr-1" /> Add Drug
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search drugs..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Clinical Guideline Editor */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Clinical Drug Guidelines (Editable)</CardTitle>
          <Button
            size="sm"
            onClick={() => {
              resetGuidelineForm();
              setGuidelineOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-1" /> Add Guideline
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search condition, drug, line..."
              className="pl-9"
              value={guidelineSearch}
              onChange={(e) => setGuidelineSearch(e.target.value)}
            />
          </div>
          <div className="overflow-x-auto border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Condition</TableHead>
                  <TableHead>Line</TableHead>
                  <TableHead>Drug</TableHead>
                  <TableHead>Dose/Frequency</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Pregnancy</TableHead>
                  <TableHead className="w-[130px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingGuidelines ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-6 text-muted-foreground">Loading guidelines...</TableCell></TableRow>
                ) : filteredGuidelines.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-6 text-muted-foreground">No guideline rows found.</TableCell></TableRow>
                ) : (
                  filteredGuidelines.map((g) => (
                    <TableRow key={g.id}>
                      <TableCell>
                        <p className="font-medium">{g.condition_label}</p>
                        <p className="text-xs text-muted-foreground">{g.condition_key}</p>
                      </TableCell>
                      <TableCell>{g.line_of_treatment.replace("_", " ")}</TableCell>
                      <TableCell>{g.drug_name} ({g.route})</TableCell>
                      <TableCell className="text-xs">{g.dosage || "—"} · {g.frequency || "—"}</TableCell>
                      <TableCell>{g.duration_value} {g.duration_unit}</TableCell>
                      <TableCell>{g.pregnancy_safe === false ? "Use caution" : "Generally safe"}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm" onClick={() => openGuidelineEdit(g)}>
                            <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => deleteGuideline(g.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Drug List */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Drug Name</TableHead>
                <TableHead>Packaging</TableHead>
                <TableHead className="text-center">Warning Point</TableHead>
                <TableHead className="text-right">Cost Price</TableHead>
                <TableHead className="text-right">Selling Price</TableHead>
                <TableHead className="w-[140px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {search ? "No drugs match your search." : "No drugs added yet."}
                </TableCell></TableRow>
              ) : (
                filtered.map(d => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.drug_name}</TableCell>
                    <TableCell>{d.unit || "Tablets"}</TableCell>
                    <TableCell className="text-center">{d.reorder_level ?? 20}</TableCell>
                    <TableCell className="text-right">UGX {Number(d.cost_price || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-right">UGX {Number(d.unit_price).toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" onClick={() => openEdit(d)}>
                          <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(d.id, d.drug_name)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Drug</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Drug Name</Label>
              <Input value={editName} onChange={e => setEditName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={editCategory} onValueChange={setEditCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Packaging / Unit</Label>
                <Select value={editUnit} onValueChange={setEditUnit}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Cost Price (UGX)</Label>
                <Input type="number" value={editCostPrice} onChange={e => setEditCostPrice(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Selling Price (UGX)</Label>
                <Input type="number" value={editSellingPrice} onChange={e => setEditSellingPrice(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Warning Point</Label>
                <Input type="number" value={editReorderLevel} onChange={e => setEditReorderLevel(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={updateDrug.isPending}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={guidelineOpen} onOpenChange={setGuidelineOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{guidelineEditId ? "Edit Clinical Guideline" : "Add Clinical Guideline"}</DialogTitle>
          </DialogHeader>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Condition Key</Label>
              <Input placeholder="e.g. pneumonia" value={conditionKey} onChange={(e) => setConditionKey(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Condition Label</Label>
              <Input placeholder="e.g. Community Acquired Pneumonia" value={conditionLabel} onChange={(e) => setConditionLabel(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Treatment Line</Label>
              <Select value={treatmentLine} onValueChange={setTreatmentLine}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TREATMENT_LINES.map((line) => (
                    <SelectItem key={line} value={line}>{line.replace("_", " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Drug</Label>
              <Select value={guidelineDrugName} onValueChange={setGuidelineDrugName}>
                <SelectTrigger><SelectValue placeholder="Pick from inventory" /></SelectTrigger>
                <SelectContent className="max-h-64">
                  {drugs.map((d) => (
                    <SelectItem key={d.id} value={d.drug_name}>
                      {d.drug_name} ({d.quantity_in_stock} {d.unit || "units"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Route</Label>
              <Select value={guidelineRoute} onValueChange={setGuidelineRoute}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROUTES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Dosage</Label>
              <Input placeholder="e.g. 500mg" value={guidelineDosage} onChange={(e) => setGuidelineDosage(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Frequency</Label>
              <Input placeholder="e.g. Twice Daily for" value={guidelineFrequency} onChange={(e) => setGuidelineFrequency(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Duration</Label>
              <div className="flex gap-2">
                <Input type="number" min="1" value={guidelineDurationValue} onChange={(e) => setGuidelineDurationValue(e.target.value)} />
                <Select value={guidelineDurationUnit} onValueChange={setGuidelineDurationUnit}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DURATION_UNITS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Pregnancy Safety</Label>
              <Select value={guidelinePregnancySafe} onValueChange={setGuidelinePregnancySafe}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Generally safe</SelectItem>
                  <SelectItem value="no">Use caution / avoid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Notes</Label>
              <Input placeholder="Contraindications, interactions, monitoring..." value={guidelineNotes} onChange={(e) => setGuidelineNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGuidelineOpen(false)}>Cancel</Button>
            <Button onClick={saveGuideline}>Save Guideline</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SetDrugsPage;
