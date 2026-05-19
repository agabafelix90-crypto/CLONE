import { useState } from "react";
import { useLabTemplates, useInsertLabTemplate } from "@/hooks/use-lab-data";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, FlaskConical, Microscope } from "lucide-react";

const SetLabExamsPage = () => {
  const { data: templates = [], isLoading } = useLabTemplates();
  const insertTemplate = useInsertLabTemplate();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("");
  const [price, setPrice] = useState("");

  const handleAdd = () => {
    if (!name.trim() || !category || !price) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }
    insertTemplate.mutate(
      { test_name: name.trim(), category, price: parseFloat(price), parameters: [], normal_ranges: null },
      {
        onSuccess: () => {
          toast({ title: "Investigation added successfully" });
          setName("");
          setCategory("");
          setPrice("");
        },
        onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
      }
    );
  };

  const handleDelete = async (id: string, testName: string) => {
    if (!confirm(`Delete "${testName}"?`)) return;
    const { error } = await supabase.from("lab_test_templates").delete().eq("id", id);
    if (error) {
      toast({ title: "Error deleting", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Investigation deleted" });
      queryClient.invalidateQueries({ queryKey: ["lab_test_templates"] });
    }
  };

  const sorted = [...templates].sort((a, b) => a.test_name.localeCompare(b.test_name));

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Set Lab & Radiology Exams</h1>
        <p className="text-sm text-muted-foreground">Laboratory Tests and Radiology Examinations done at this facility.</p>
      </div>

      {/* Add New */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add New Investigation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-4 gap-4 items-end">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input placeholder="e.g. Complete blood count" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="lab">Lab</SelectItem>
                  <SelectItem value="radiology">Radiology</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Price (UGX)</Label>
              <Input type="number" placeholder="e.g. 20000" value={price} onChange={e => setPrice(e.target.value)} />
            </div>
            <Button onClick={handleAdd} disabled={insertTemplate.isPending}>
              <Plus className="w-4 h-4 mr-1" /> Add Investigation
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Price (UGX)</TableHead>
                <TableHead className="w-[100px]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : sorted.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No investigations added yet.</TableCell></TableRow>
              ) : (
                sorted.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.test_name}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                        t.category.toLowerCase() === "radiology"
                          ? "bg-accent/20 text-accent-foreground"
                          : "bg-primary/10 text-primary"
                      }`}>
                        {t.category.toLowerCase() === "radiology" ? <Microscope className="w-3 h-3" /> : <FlaskConical className="w-3 h-3" />}
                        {t.category}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{Number(t.price).toLocaleString("en-UG", { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(t.id, t.test_name)}>
                        <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default SetLabExamsPage;
