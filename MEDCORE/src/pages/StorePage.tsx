import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Package, Search, Plus, ArrowRightLeft, FileText, BarChart3,
  Warehouse, Trash2, CalendarIcon, Loader2
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
import { toast } from "@/hooks/use-toast";
import { usePharmacyInventory } from "@/hooks/use-pharmacy-data";
import { useStoreInvoices, useCreateInvoice, useStoreTransfers, useCreateTransfer } from "@/hooks/use-store-data";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { format, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface InvoiceItem {
  inventory_id: string;
  drug_name: string;
  quantity: number;
  cost_price: number;
}

const StorePage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("inventory");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [authLoading, user, navigate]);

  // Insert stock dialog
  const [showInsert, setShowInsert] = useState(false);
  const [supplier, setSupplier] = useState("");
  const [invoiceNotes, setInvoiceNotes] = useState("");
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [selectedDrug, setSelectedDrug] = useState("");
  const [insertQty, setInsertQty] = useState("");
  const [insertCost, setInsertCost] = useState("");

  // Transfer dialog
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferDrug, setTransferDrug] = useState("");
  const [transferQty, setTransferQty] = useState("");
  const [transferNotes, setTransferNotes] = useState("");
  const [filterDrug, setFilterDrug] = useState("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  const { data: inventory = [], isLoading } = usePharmacyInventory();
  const { data: invoices = [] } = useStoreInvoices();
  const { data: transfers = [] } = useStoreTransfers();
  const createInvoice = useCreateInvoice();
  const createTransfer = useCreateTransfer();

  const totalStockWorth = inventory.reduce(
    (s, d) => s + (d.quantity_in_stock ?? 0) * Number(d.cost_price || 0), 0
  );

  const filteredInventory = inventory.filter((d) =>
    d.drug_name.toLowerCase().includes(search.toLowerCase())
  );

  // ─── Insert Stock helpers ───
  const addInvoiceItem = () => {
    const drug = inventory.find((d) => d.id === selectedDrug);
    if (!drug || !insertQty) {
      toast({ title: "Select a drug and quantity", variant: "destructive" });
      return;
    }
    const qty = parseInt(insertQty);
    const cost = parseFloat(insertCost) || Number(drug.cost_price || 0);
    if (qty <= 0) return;

    setInvoiceItems([...invoiceItems, {
      inventory_id: drug.id,
      drug_name: drug.drug_name,
      quantity: qty,
      cost_price: cost,
    }]);
    setSelectedDrug("");
    setInsertQty("");
    setInsertCost("");
  };

  const removeInvoiceItem = (idx: number) => {
    setInvoiceItems(invoiceItems.filter((_, i) => i !== idx));
  };

  const handleCreateInvoice = async () => {
    if (!supplier.trim()) {
      toast({ title: "Supplier name is required", variant: "destructive" });
      return;
    }
    if (invoiceItems.length === 0) {
      toast({ title: "Add at least one item", variant: "destructive" });
      return;
    }
    try {
      await createInvoice.mutateAsync({
        supplier: supplier.trim(),
        notes: invoiceNotes || undefined,
        items: invoiceItems,
      });
      toast({ title: "Stock received", description: `Invoice created with ${invoiceItems.length} item(s)` });
      setShowInsert(false);
      setSupplier("");
      setInvoiceNotes("");
      setInvoiceItems([]);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  // ─── Transfer helpers ───
  const handleTransfer = async () => {
    const drug = inventory.find((d) => d.id === transferDrug);
    if (!drug || !transferQty) {
      toast({ title: "Select a drug and enter quantity", variant: "destructive" });
      return;
    }
    const qty = parseInt(transferQty);
    if (qty <= 0 || qty > (drug.quantity_in_stock ?? 0)) {
      toast({ title: "Invalid quantity", description: `Available: ${drug.quantity_in_stock}`, variant: "destructive" });
      return;
    }
    try {
      await createTransfer.mutateAsync({
        inventory_id: drug.id,
        drug_name: drug.drug_name,
        quantity: qty,
        notes: transferNotes || undefined,
      });
      toast({ title: "Transfer recorded", description: `${qty} ${drug.unit || "units"} of ${drug.drug_name} transferred to shelves` });
      setShowTransfer(false);
      setTransferDrug("");
      setTransferQty("");
      setTransferNotes("");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  // ─── Invoice summary ───
  const invoiceSummary = invoices.reduce((acc: Record<string, { count: number; total: number }>, inv: any) => {
    const month = format(new Date(inv.created_at), "MMM yyyy");
    if (!acc[month]) acc[month] = { count: 0, total: 0 };
    acc[month].count += 1;
    acc[month].total += Number(inv.total_amount || 0);
    return acc;
  }, {});

  if (authLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <p className="text-muted-foreground">Please sign in to access store management.</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 p-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2">
            <Warehouse className="w-6 h-6 text-primary" /> Store
          </h1>
          <p className="text-sm text-muted-foreground">View and manage your current store inventory</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 max-w-3xl">
          <TabsTrigger value="inventory" className="gap-1 text-xs sm:text-sm">
            <Package className="w-3.5 h-3.5" /> Stock Inventory
          </TabsTrigger>
          <TabsTrigger value="insert" className="gap-1 text-xs sm:text-sm">
            <Plus className="w-3.5 h-3.5" /> Insert New Stock
          </TabsTrigger>
          <TabsTrigger value="transfer" className="gap-1 text-xs sm:text-sm">
            <ArrowRightLeft className="w-3.5 h-3.5" /> Transfer to Shelves
          </TabsTrigger>
          <TabsTrigger value="invoices" className="gap-1 text-xs sm:text-sm">
            <FileText className="w-3.5 h-3.5" /> Invoice History
          </TabsTrigger>
          <TabsTrigger value="summary" className="gap-1 text-xs sm:text-sm">
            <BarChart3 className="w-3.5 h-3.5" /> Invoice Summary
          </TabsTrigger>
        </TabsList>

        {/* ═══ STOCK INVENTORY ═══ */}
        <TabsContent value="inventory" className="space-y-4">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="py-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Stock Worth</p>
                <p className="text-2xl font-bold text-primary">UGX {totalStockWorth.toLocaleString()}</p>
              </div>
              <Package className="w-10 h-10 text-primary/30" />
            </CardContent>
          </Card>

          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search drugs..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Current Stock Inventory</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Drug Name</TableHead>
                    <TableHead className="text-center">Quantity</TableHead>
                    <TableHead>Packaging</TableHead>
                    <TableHead className="text-right">Cost Price</TableHead>
                    <TableHead className="text-right">Selling Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                  ) : filteredInventory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12">
                        <Package className="w-12 h-12 mx-auto text-muted-foreground/40 mb-2" />
                        <p className="text-muted-foreground font-medium">No drugs found</p>
                        <p className="text-xs text-muted-foreground">Try adjusting your search or add new drugs to inventory.</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredInventory.map(d => (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium">{d.drug_name}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={d.quantity_in_stock <= (d.reorder_level ?? 10) ? "destructive" : "secondary"}>
                            {d.quantity_in_stock}
                          </Badge>
                        </TableCell>
                        <TableCell>{d.unit || "Tablets"}</TableCell>
                        <TableCell className="text-right">UGX {Number(d.cost_price || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-right">UGX {Number(d.unit_price).toLocaleString()}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ INSERT NEW STOCK ═══ */}
        <TabsContent value="insert" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Receive New Stock</CardTitle>
              <Button onClick={() => setShowInsert(true)}>
                <Plus className="w-4 h-4 mr-1" /> Create Invoice
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Create a new stock invoice when receiving goods from a supplier. This will automatically update inventory quantities.
              </p>
              {/* Recent invoices preview */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No invoices yet</TableCell></TableRow>
                  ) : invoices.slice(0, 5).map((inv: any) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-mono text-sm">{inv.invoice_number}</TableCell>
                      <TableCell>{inv.supplier}</TableCell>
                      <TableCell><Badge variant="secondary">{inv.store_invoice_items?.length || 0}</Badge></TableCell>
                      <TableCell className="text-right">UGX {Number(inv.total_amount).toLocaleString()}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{format(new Date(inv.created_at), "dd MMM yyyy")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ TRANSFER TO SHELVES ═══ */}
        <TabsContent value="transfer" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Transfer Stock to Shelves</CardTitle>
              <Button onClick={() => setShowTransfer(true)}>
                <ArrowRightLeft className="w-4 h-4 mr-1" /> New Transfer
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3">
                <Label className="text-sm whitespace-nowrap">Filter by Drug:</Label>
                <Select value={filterDrug} onValueChange={setFilterDrug}>
                  <SelectTrigger className="max-w-[200px]">
                    <SelectValue placeholder="All Drugs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Drugs</SelectItem>
                    {[...new Set(transfers.map((t: any) => t.drug_name))].sort().map((name: string) => (
                      <SelectItem key={name} value={name}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Label className="text-sm whitespace-nowrap ml-2">From:</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-[140px] justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFrom ? format(dateFrom, "dd MMM yyyy") : "Start"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>

                <Label className="text-sm whitespace-nowrap">To:</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-[140px] justify-start text-left font-normal", !dateTo && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateTo ? format(dateTo, "dd MMM yyyy") : "End"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>

                {(dateFrom || dateTo) && (
                  <Button variant="ghost" size="sm" onClick={() => { setDateFrom(undefined); setDateTo(undefined); }}>
                    Clear dates
                  </Button>
                )}
              </div>

              {/* Summary badge */}
              {(() => {
                let filtered = filterDrug === "all" ? transfers : transfers.filter((t: any) => t.drug_name === filterDrug);
                if (dateFrom) filtered = filtered.filter((t: any) => !isBefore(new Date(t.created_at), startOfDay(dateFrom)));
                if (dateTo) filtered = filtered.filter((t: any) => !isAfter(new Date(t.created_at), endOfDay(dateTo)));
                const totalUnits = filtered.reduce((s: number, t: any) => s + t.quantity, 0);
                return (filterDrug !== "all" || dateFrom || dateTo) ? (
                  <Badge variant="secondary" className="gap-1">
                    Total transferred: {totalUnits} units ({filtered.length} records)
                  </Badge>
                ) : null;
              })()}

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Drug Name</TableHead>
                    <TableHead className="text-center">Quantity</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    let filtered = filterDrug === "all" ? transfers : transfers.filter((t: any) => t.drug_name === filterDrug);
                    if (dateFrom) filtered = filtered.filter((t: any) => !isBefore(new Date(t.created_at), startOfDay(dateFrom)));
                    if (dateTo) filtered = filtered.filter((t: any) => !isAfter(new Date(t.created_at), endOfDay(dateTo)));
                    return filtered.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No transfers recorded</TableCell></TableRow>
                    ) : filtered.map((t: any) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">{t.drug_name}</TableCell>
                        <TableCell className="text-center"><Badge variant="secondary">{t.quantity}</Badge></TableCell>
                        <TableCell className="text-muted-foreground text-sm">{t.notes || "—"}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{format(new Date(t.created_at), "dd MMM yyyy HH:mm")}</TableCell>
                      </TableRow>
                    ));
                  })()}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ INVOICE HISTORY ═══ */}
        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Invoice History</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No invoices found</TableCell></TableRow>
                  ) : invoices.map((inv: any) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-mono text-sm">{inv.invoice_number}</TableCell>
                      <TableCell>{inv.supplier}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{inv.store_invoice_items?.length || 0} items</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">UGX {Number(inv.total_amount).toLocaleString()}</TableCell>
                      <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">{inv.notes || "—"}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{format(new Date(inv.created_at), "dd MMM yyyy")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ INVOICE SUMMARY ═══ */}
        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Invoice Summary by Month</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-center">Invoices</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.keys(invoiceSummary).length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No data yet</TableCell></TableRow>
                  ) : Object.entries(invoiceSummary).map(([month, data]) => (
                    <TableRow key={month}>
                      <TableCell className="font-medium">{month}</TableCell>
                      <TableCell className="text-center"><Badge variant="secondary">{data.count}</Badge></TableCell>
                      <TableCell className="text-right font-medium">UGX {data.total.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ═══ CREATE INVOICE DIALOG ═══ */}
      <Dialog open={showInsert} onOpenChange={setShowInsert}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Stock Invoice</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Supplier Name</Label>
                <Input placeholder="e.g. National Medical Stores" value={supplier} onChange={e => setSupplier(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Notes (optional)</Label>
                <Input placeholder="e.g. PO-12345" value={invoiceNotes} onChange={e => setInvoiceNotes(e.target.value)} />
              </div>
            </div>

            <div className="border rounded-lg p-4 space-y-3">
              <Label className="text-sm font-medium">Add Items</Label>
              <div className="grid grid-cols-4 gap-3 items-end">
                <div className="space-y-1">
                  <Label className="text-xs">Drug</Label>
                  <Select value={selectedDrug} onValueChange={setSelectedDrug}>
                    <SelectTrigger><SelectValue placeholder="Select drug" /></SelectTrigger>
                    <SelectContent>
                      {inventory.map(d => (
                        <SelectItem key={d.id} value={d.id}>{d.drug_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Quantity</Label>
                  <Input type="number" placeholder="0" value={insertQty} onChange={e => setInsertQty(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Cost Price</Label>
                  <Input type="number" placeholder="Auto" value={insertCost} onChange={e => setInsertCost(e.target.value)} />
                </div>
                <Button variant="outline" onClick={addInvoiceItem}>
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </div>
            </div>

            {invoiceItems.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Drug</TableHead>
                    <TableHead className="text-center">Qty</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoiceItems.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{item.drug_name}</TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell className="text-right">UGX {item.cost_price.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-medium">UGX {(item.quantity * item.cost_price).toLocaleString()}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => removeInvoiceItem(idx)}>
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={3} className="font-bold text-right">Grand Total</TableCell>
                    <TableCell className="text-right font-bold">
                      UGX {invoiceItems.reduce((s, i) => s + i.quantity * i.cost_price, 0).toLocaleString()}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableBody>
              </Table>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInsert(false)}>Cancel</Button>
            <Button onClick={handleCreateInvoice} disabled={createInvoice.isPending}>
              {createInvoice.isPending ? "Saving..." : "Save Invoice & Update Stock"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ TRANSFER DIALOG ═══ */}
      <Dialog open={showTransfer} onOpenChange={setShowTransfer}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer to Shelves</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Drug</Label>
              <Select value={transferDrug} onValueChange={setTransferDrug}>
                <SelectTrigger><SelectValue placeholder="Select drug" /></SelectTrigger>
                <SelectContent>
                  {inventory.filter(d => d.quantity_in_stock > 0).map(d => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.drug_name} (Stock: {d.quantity_in_stock})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Quantity to Transfer</Label>
              <Input type="number" placeholder="0" value={transferQty} onChange={e => setTransferQty(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Textarea placeholder="e.g. Restocking front shelves" value={transferNotes} onChange={e => setTransferNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTransfer(false)}>Cancel</Button>
            <Button onClick={handleTransfer} disabled={createTransfer.isPending}>
              {createTransfer.isPending ? "Transferring..." : "Confirm Transfer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <p className="text-xs text-center text-muted-foreground pt-4">
        This system was created by MEDCORE Systems. For help or support contact +256700123457
      </p>
    </motion.div>
  );
};

export default StorePage;

