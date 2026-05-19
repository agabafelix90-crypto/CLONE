import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  Pill, Search, Plus, Package, ShoppingCart, ClipboardList,
  AlertTriangle, CheckCircle2, Printer, Trash2, Eye
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  usePharmacyInventory,
  useInsertInventoryItem,
  useUpdateInventoryItem,
  usePrescriptions,
  useUpdatePrescription,
  useCreateSale,
  usePharmacySales,
} from "@/hooks/use-pharmacy-data";
import PharmacyReceipt from "@/components/pharmacy/PharmacyReceipt";
import LowStockAlert from "@/components/pharmacy/LowStockAlert";

interface CartItem {
  inventory_id: string;
  drug_name: string;
  quantity: number;
  unit_price: number;
  max_stock: number;
}

const PharmacyPage = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [showAddDrug, setShowAddDrug] = useState(false);
  const [showPOS, setShowPOS] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [completedSale, setCompletedSale] = useState<any>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [viewSale, setViewSale] = useState<any>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  // Drug form
  const [drugForm, setDrugForm] = useState({
    drug_name: "", generic_name: "", category: "General", unit_price: 0,
    cost_price: 0, quantity_in_stock: 0, reorder_level: 10, unit: "Tablets",
    batch_number: "", expiry_date: "", supplier: "",
  });

  const { data: inventory = [], isLoading: invLoading } = usePharmacyInventory();
  const { data: pendingRx = [] } = usePrescriptions("pending");
  const { data: allSales = [] } = usePharmacySales();
  const insertItem = useInsertInventoryItem();
  const updateItem = useUpdateInventoryItem();
  const updateRx = useUpdatePrescription();
  const createSale = useCreateSale();

  const filteredInventory = inventory.filter((d: any) =>
    d.drug_name.toLowerCase().includes(search.toLowerCase()) ||
    (d.generic_name || "").toLowerCase().includes(search.toLowerCase())
  );

  const lowStock = inventory.filter((d: any) => d.quantity_in_stock <= (d.reorder_level || 10));
  const totalValue = inventory.reduce((s: number, d: any) => s + d.quantity_in_stock * Number(d.unit_price), 0);

  const handleAddDrug = async () => {
    if (!drugForm.drug_name || !drugForm.unit_price) {
      toast({ title: "Error", description: "Drug name and price are required", variant: "destructive" });
      return;
    }
    try {
      await insertItem.mutateAsync({
        ...drugForm,
        expiry_date: drugForm.expiry_date || undefined,
      });
      toast({ title: "Drug added", description: `${drugForm.drug_name} added to inventory` });
      setShowAddDrug(false);
      setDrugForm({ drug_name: "", generic_name: "", category: "General", unit_price: 0, cost_price: 0, quantity_in_stock: 0, reorder_level: 10, unit: "Tablets", batch_number: "", expiry_date: "", supplier: "" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const addToCart = (drug: any) => {
    const exists = cart.find((c) => c.inventory_id === drug.id);
    if (exists) {
      if (exists.quantity >= drug.quantity_in_stock) {
        toast({ title: "Out of stock", variant: "destructive" });
        return;
      }
      setCart(cart.map((c) => c.inventory_id === drug.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      if (drug.quantity_in_stock < 1) {
        toast({ title: "Out of stock", variant: "destructive" });
        return;
      }
      setCart([...cart, { inventory_id: drug.id, drug_name: drug.drug_name, quantity: 1, unit_price: Number(drug.unit_price), max_stock: drug.quantity_in_stock }]);
    }
  };

  const removeFromCart = (id: string) => setCart(cart.filter((c) => c.inventory_id !== id));
  const cartTotal = cart.reduce((s, c) => s + c.quantity * c.unit_price, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    try {
      const sale = await createSale.mutateAsync({
        items: cart.map((c) => ({ inventory_id: c.inventory_id, drug_name: c.drug_name, quantity: c.quantity, unit_price: c.unit_price })),
        patient_name: customerName || "Walk-in Customer",
        sale_type: "over_the_counter",
        payment_method: paymentMethod,
      });
      setCompletedSale(sale);
      setShowReceipt(true);
      setCart([]);
      setCustomerName("");
      setShowPOS(false);
      toast({ title: "Sale complete!", description: `Receipt: ${sale?.receipt_number}` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleDispense = async (rx: any) => {
    try {
      // Find matching drug in inventory
      const drug = inventory.find((d: any) => d.drug_name.toLowerCase() === rx.drug_name.toLowerCase());
      if (drug && drug.quantity_in_stock >= rx.quantity) {
        // Create a sale for the prescription
        await createSale.mutateAsync({
          items: [{ inventory_id: drug.id, drug_name: rx.drug_name, quantity: rx.quantity, unit_price: Number(drug.unit_price) }],
          patient_id: rx.patient_id,
          patient_name: rx.patients?.name || "Patient",
          sale_type: "prescription",
          payment_method: "Cash",
        });
      }
      await updateRx.mutateAsync({ id: rx.id, status: "dispensed" });
      toast({ title: "Dispensed", description: `${rx.drug_name} dispensed to ${rx.patients?.name}` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const printReceipt = () => {
    if (!receiptRef.current) return;
    const printWindow = window.open("", "_blank", "width=320,height=600");
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Receipt</title>
      <style>body{margin:0;padding:0;font-family:monospace;font-size:11px;}*{box-sizing:border-box;}</style>
      </head><body>${receiptRef.current.innerHTML}</body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <LowStockAlert />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2">
            <Pill className="w-7 h-7 text-primary" /> Pharmacy
          </h1>
          <p className="text-sm text-muted-foreground">Drug dispensing, prescriptions & inventory</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowPOS(true)} className="gap-2">
            <ShoppingCart className="w-4 h-4" /> New Sale
          </Button>
          <Button variant="outline" onClick={() => setShowAddDrug(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Add Drug
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10"><Package className="w-5 h-5 text-primary" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Total Drugs</p>
                <p className="text-xl font-bold text-foreground">{inventory.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10"><AlertTriangle className="w-5 h-5 text-destructive" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Low Stock</p>
                <p className="text-xl font-bold text-destructive">{lowStock.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10"><ClipboardList className="w-5 h-5 text-accent-foreground" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Pending Rx</p>
                <p className="text-xl font-bold text-foreground">{pendingRx.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10"><ShoppingCart className="w-5 h-5 text-primary" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Stock Value</p>
                <p className="text-lg font-bold text-foreground">UGX {totalValue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList>
          <TabsTrigger value="inventory" className="gap-1"><Package className="w-3 h-3" /> Inventory</TabsTrigger>
          <TabsTrigger value="prescriptions" className="gap-1"><ClipboardList className="w-3 h-3" /> Prescriptions</TabsTrigger>
          <TabsTrigger value="sales" className="gap-1"><ShoppingCart className="w-3 h-3" /> Sales History</TabsTrigger>
        </TabsList>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search drugs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Drug Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Price (UGX)</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invLoading ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                  ) : filteredInventory.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No drugs found. Add your first drug to the inventory.</TableCell></TableRow>
                  ) : (
                    filteredInventory.map((drug: any) => (
                      <TableRow key={drug.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-foreground">{drug.drug_name}</p>
                            {drug.generic_name && <p className="text-xs text-muted-foreground">{drug.generic_name}</p>}
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="outline">{drug.category}</Badge></TableCell>
                        <TableCell className="font-medium">{drug.quantity_in_stock}</TableCell>
                        <TableCell>{drug.unit}</TableCell>
                        <TableCell>{Number(drug.unit_price).toLocaleString()}</TableCell>
                        <TableCell>{drug.expiry_date ? new Date(drug.expiry_date).toLocaleDateString("en-UG") : "—"}</TableCell>
                        <TableCell>
                          {drug.quantity_in_stock <= 0 ? (
                            <Badge variant="destructive">Out of Stock</Badge>
                          ) : drug.quantity_in_stock <= (drug.reorder_level || 10) ? (
                            <Badge className="bg-[hsl(var(--clinic-amber))]/15 text-[hsl(var(--clinic-amber))]">Low Stock</Badge>
                          ) : (
                            <Badge className="bg-[hsl(var(--clinic-green))]/15 text-[hsl(var(--clinic-green))]">In Stock</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Prescriptions Tab */}
        <TabsContent value="prescriptions" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">Prescription Queue</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Drug</TableHead>
                    <TableHead>Dosage</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingRx.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No pending prescriptions</TableCell></TableRow>
                  ) : (
                    pendingRx.map((rx: any) => (
                      <TableRow key={rx.id}>
                        <TableCell className="font-medium">{rx.patients?.name || "Unknown"}</TableCell>
                        <TableCell>{rx.drug_name}</TableCell>
                        <TableCell>{rx.dosage}</TableCell>
                        <TableCell>{rx.frequency}</TableCell>
                        <TableCell>{rx.quantity}</TableCell>
                        <TableCell><Badge className="bg-[hsl(var(--clinic-amber))]/15 text-[hsl(var(--clinic-amber))]">Pending</Badge></TableCell>
                        <TableCell>
                          <Button size="sm" onClick={() => handleDispense(rx)} className="gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Dispense
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sales History Tab */}
        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">Sales History</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Total (UGX)</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allSales.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No sales yet</TableCell></TableRow>
                  ) : (
                    allSales.map((sale: any) => (
                      <TableRow key={sale.id}>
                        <TableCell className="font-mono font-medium">{sale.receipt_number}</TableCell>
                        <TableCell>{sale.patient_name}</TableCell>
                        <TableCell><Badge variant="outline">{sale.sale_type === "prescription" ? "Rx" : "OTC"}</Badge></TableCell>
                        <TableCell className="font-medium">{Number(sale.total_amount).toLocaleString()}</TableCell>
                        <TableCell>{sale.payment_method}</TableCell>
                        <TableCell>{new Date(sale.created_at).toLocaleDateString("en-UG")}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost" onClick={() => { setViewSale(sale); setShowReceipt(true); }} className="gap-1">
                            <Eye className="w-3 h-3" /> View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Add Drug Dialog ── */}
      <Dialog open={showAddDrug} onOpenChange={setShowAddDrug}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Drug to Inventory</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Drug Name *</Label>
              <Input value={drugForm.drug_name} onChange={(e) => setDrugForm({ ...drugForm, drug_name: e.target.value })} />
            </div>
            <div>
              <Label>Generic Name</Label>
              <Input value={drugForm.generic_name} onChange={(e) => setDrugForm({ ...drugForm, generic_name: e.target.value })} />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={drugForm.category} onValueChange={(v) => setDrugForm({ ...drugForm, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["General", "Antibiotics", "Analgesics", "Antimalarials", "Vitamins", "IV Fluids", "Surgical", "Other"].map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Unit Price (UGX) *</Label>
              <Input type="number" value={drugForm.unit_price} onChange={(e) => setDrugForm({ ...drugForm, unit_price: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Cost Price (UGX)</Label>
              <Input type="number" value={drugForm.cost_price} onChange={(e) => setDrugForm({ ...drugForm, cost_price: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Quantity in Stock</Label>
              <Input type="number" value={drugForm.quantity_in_stock} onChange={(e) => setDrugForm({ ...drugForm, quantity_in_stock: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Reorder Level</Label>
              <Input type="number" value={drugForm.reorder_level} onChange={(e) => setDrugForm({ ...drugForm, reorder_level: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Unit</Label>
              <Select value={drugForm.unit} onValueChange={(v) => setDrugForm({ ...drugForm, unit: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Tablets", "Capsules", "Bottles", "Vials", "Ampoules", "Sachets", "Tubes", "Packs"].map((u) => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Batch Number</Label>
              <Input value={drugForm.batch_number} onChange={(e) => setDrugForm({ ...drugForm, batch_number: e.target.value })} />
            </div>
            <div>
              <Label>Expiry Date</Label>
              <Input type="date" value={drugForm.expiry_date} onChange={(e) => setDrugForm({ ...drugForm, expiry_date: e.target.value })} />
            </div>
            <div className="col-span-2">
              <Label>Supplier</Label>
              <Input value={drugForm.supplier} onChange={(e) => setDrugForm({ ...drugForm, supplier: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDrug(false)}>Cancel</Button>
            <Button onClick={handleAddDrug} disabled={insertItem.isPending}>
              {insertItem.isPending ? "Adding..." : "Add Drug"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── POS / New Sale Dialog ── */}
      <Dialog open={showPOS} onOpenChange={setShowPOS}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Sale — Point of Sale</DialogTitle></DialogHeader>
          <div className="grid md:grid-cols-2 gap-4">
            {/* Drug picker */}
            <div className="space-y-3">
              <Input placeholder="Search drug to add..." onChange={(e) => setSearch(e.target.value)} className="pl-3" />
              <div className="max-h-60 overflow-y-auto space-y-1">
                {inventory
                  .filter((d: any) => d.drug_name.toLowerCase().includes(search.toLowerCase()))
                  .map((d: any) => (
                    <button
                      key={d.id}
                      onClick={() => addToCart(d)}
                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted text-left text-sm"
                    >
                      <div>
                        <p className="font-medium text-foreground">{d.drug_name}</p>
                        <p className="text-xs text-muted-foreground">Stock: {d.quantity_in_stock} | UGX {Number(d.unit_price).toLocaleString()}</p>
                      </div>
                      <Plus className="w-4 h-4 text-primary" />
                    </button>
                  ))}
              </div>
            </div>
            {/* Cart */}
            <div className="space-y-3">
              <div>
                <Label>Customer Name</Label>
                <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Walk-in Customer" />
              </div>
              <div>
                <Label>Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Mobile Money">Mobile Money</SelectItem>
                    <SelectItem value="Card">Card</SelectItem>
                    <SelectItem value="Insurance">Insurance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="border rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
                {cart.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">Cart is empty — click drugs to add</p>
                ) : (
                  cart.map((c) => (
                    <div key={c.inventory_id} className="flex items-center justify-between text-sm">
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{c.drug_name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Button size="sm" variant="outline" className="h-6 w-6 p-0" onClick={() => setCart(cart.map((i) => i.inventory_id === c.inventory_id ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i))}>-</Button>
                          <span className="text-xs w-6 text-center">{c.quantity}</span>
                          <Button size="sm" variant="outline" className="h-6 w-6 p-0" onClick={() => { if (c.quantity < c.max_stock) setCart(cart.map((i) => i.inventory_id === c.inventory_id ? { ...i, quantity: i.quantity + 1 } : i)); }}>+</Button>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-foreground">UGX {(c.quantity * c.unit_price).toLocaleString()}</p>
                        <button onClick={() => removeFromCart(c.inventory_id)} className="text-destructive"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="flex justify-between items-center font-bold text-lg border-t pt-2">
                <span>Total:</span>
                <span className="text-primary">UGX {cartTotal.toLocaleString()}</span>
              </div>
              <Button className="w-full gap-2" onClick={handleCheckout} disabled={cart.length === 0 || createSale.isPending}>
                <ShoppingCart className="w-4 h-4" /> {createSale.isPending ? "Processing..." : "Complete Sale"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Receipt Dialog ── */}
      <Dialog open={showReceipt} onOpenChange={(open) => { setShowReceipt(open); if (!open) { setCompletedSale(null); setViewSale(null); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Receipt</DialogTitle></DialogHeader>
          {(completedSale || viewSale) && (
            <>
              <PharmacyReceipt
                ref={receiptRef}
                receiptNumber={(completedSale || viewSale).receipt_number}
                patientName={(completedSale || viewSale).patient_name}
                items={(completedSale || viewSale).pharmacy_sale_items || []}
                totalAmount={Number((completedSale || viewSale).total_amount)}
                paymentMethod={(completedSale || viewSale).payment_method}
                date={(completedSale || viewSale).created_at}
              />
              <Button onClick={printReceipt} className="gap-2 w-full mt-2">
                <Printer className="w-4 h-4" /> Print Receipt
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default PharmacyPage;
