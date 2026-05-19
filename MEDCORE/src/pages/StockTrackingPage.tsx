import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Package, TrendingUp, TrendingDown, AlertTriangle, ChevronLeft,
  BarChart3, Activity, Search, ArrowUpDown, Heart, RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const StockTrackingPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("dashboard");

  const { data: inventory = [], isLoading } = useQuery({
    queryKey: ["stock-inventory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pharmacy_inventory")
        .select("*")
        .order("drug_name");
      if (error) throw error;
      return data;
    },
  });

  const { data: transfers = [] } = useQuery({
    queryKey: ["stock-transfers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_transfers")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  const { data: saleItems = [] } = useQuery({
    queryKey: ["stock-sale-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pharmacy_sale_items")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data;
    },
  });

  const stats = useMemo(() => {
    const totalDrugs = inventory.length;
    const totalQty = inventory.reduce((s, d) => s + d.quantity_in_stock, 0);
    const totalValue = inventory.reduce((s, d) => s + d.quantity_in_stock * d.unit_price, 0);

    const critical = inventory.filter(d => d.quantity_in_stock <= 3 && d.quantity_in_stock > 0);
    const lowStock = inventory.filter(d => d.quantity_in_stock > 3 && d.quantity_in_stock <= (d.reorder_level || 10));
    const overstocked = inventory.filter(d => d.quantity_in_stock > (d.reorder_level || 10) * 5);
    const outOfStock = inventory.filter(d => d.quantity_in_stock === 0);

    // Calculate daily usage from sales
    const drugUsage: Record<string, number[]> = {};
    saleItems.forEach(si => {
      if (!drugUsage[si.drug_name]) drugUsage[si.drug_name] = [];
      drugUsage[si.drug_name].push(si.quantity);
    });

    const fastMoving = Object.entries(drugUsage)
      .map(([name, quantities]) => ({
        name,
        avgDaily: quantities.reduce((a, b) => a + b, 0) / Math.max(30, 1),
        totalSold: quantities.reduce((a, b) => a + b, 0),
      }))
      .sort((a, b) => b.avgDaily - a.avgDaily)
      .slice(0, 10);

    const slowMoving = Object.entries(drugUsage)
      .map(([name, quantities]) => ({
        name,
        avgDaily: quantities.reduce((a, b) => a + b, 0) / Math.max(30, 1),
        totalSold: quantities.reduce((a, b) => a + b, 0),
      }))
      .filter(d => d.avgDaily < 0.5)
      .sort((a, b) => a.avgDaily - b.avgDaily)
      .slice(0, 10);

    const healthScore = totalDrugs > 0
      ? Math.round(((totalDrugs - critical.length - outOfStock.length) / totalDrugs) * 100)
      : 100;

    const criticalRestockCost = critical.reduce((s, d) => s + (d.reorder_level || 10) * (d.cost_price || d.unit_price), 0);

    return {
      totalDrugs, totalQty, totalValue, critical, lowStock, overstocked,
      outOfStock, fastMoving, slowMoving, healthScore, criticalRestockCost,
    };
  }, [inventory, saleItems]);

  const filtered = inventory.filter(d =>
    d.drug_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Package className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-heading font-bold text-foreground">Stock Management</h1>
            <p className="text-sm text-muted-foreground">Inventory analytics & tracking</p>
          </div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="dashboard">📊 Dashboard</TabsTrigger>
          <TabsTrigger value="fast">⚡ Fast Moving</TabsTrigger>
          <TabsTrigger value="slow">🐢 Slow Moving</TabsTrigger>
          <TabsTrigger value="critical">🔴 Critical</TabsTrigger>
          <TabsTrigger value="all">📋 All Stock</TabsTrigger>
        </TabsList>

        {/* DASHBOARD */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Drugs", value: stats.totalDrugs, icon: Package, color: "text-primary" },
              { label: "Critical Items", value: stats.critical.length, icon: AlertTriangle, color: "text-destructive" },
              { label: "Total Value", value: `UGX ${stats.totalValue.toLocaleString()}`, icon: TrendingUp, color: "text-emerald-600" },
              { label: "Health Score", value: `${stats.healthScore}%`, icon: Heart, color: "text-primary" },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <s.icon className={`w-8 h-8 ${s.color}`} />
                    <div>
                      <p className="text-xl font-heading font-bold text-foreground">{s.value}</p>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Inventory Health */}
          <Card>
            <CardHeader><CardTitle className="text-base">Inventory Health</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Progress value={stats.healthScore} className="h-3" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-destructive" />
                  <span>Critical: {stats.critical.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-500" />
                  <span>Low Stock: {stats.lowStock.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span>Overstocked: {stats.overstocked.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-muted-foreground" />
                  <span>Out of Stock: {stats.outOfStock.length}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Critical Restock Cost: UGX {stats.criticalRestockCost.toLocaleString()}</p>
            </CardContent>
          </Card>

          {/* Recent movements */}
          <Card>
            <CardHeader><CardTitle className="text-base">🔄 Recent Stock Movements</CardTitle></CardHeader>
            <CardContent>
              {transfers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No recent movements</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Drug</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transfers.slice(0, 8).map(t => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">{t.drug_name}</TableCell>
                        <TableCell>{t.quantity}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">{new Date(t.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* AI Recommendations */}
          <Card>
            <CardHeader><CardTitle className="text-base">💡 Recommendations</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Implement FIFO (First In First Out) system</li>
                <li>• Set up automatic reorder points at 30-day supply</li>
                <li>• Regular monthly review of slow-moving items</li>
                <li>• Consider consignment stock for expensive items</li>
                <li>• Establish supplier return policies for overstock</li>
                <li>• Use demand forecasting tools for accurate ordering</li>
                {stats.overstocked.length > 0 && (
                  <li className="text-amber-600">• Potential savings from reducing overstock: UGX {Math.round(stats.overstocked.reduce((s, d) => s + (d.quantity_in_stock - (d.reorder_level || 10) * 3) * (d.cost_price || d.unit_price) * 0.2, 0)).toLocaleString()}</li>
                )}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FAST MOVING */}
        <TabsContent value="fast">
          <Card>
            <CardHeader><CardTitle className="text-base">⚡ Fast Moving Items</CardTitle></CardHeader>
            <CardContent>
              {stats.fastMoving.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No sales data yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Drug</TableHead>
                      <TableHead>Avg/Day</TableHead>
                      <TableHead>Total Sold</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.fastMoving.map(d => (
                      <TableRow key={d.name}>
                        <TableCell className="font-medium">{d.name}</TableCell>
                        <TableCell>{d.avgDaily.toFixed(2)}/d</TableCell>
                        <TableCell>{d.totalSold}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SLOW MOVING */}
        <TabsContent value="slow">
          <Card>
            <CardHeader><CardTitle className="text-base">🐢 Slow Moving Items</CardTitle></CardHeader>
            <CardContent>
              {stats.slowMoving.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No slow-moving items detected</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Drug</TableHead>
                      <TableHead>Avg/Day</TableHead>
                      <TableHead>Total Sold</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.slowMoving.map(d => (
                      <TableRow key={d.name}>
                        <TableCell className="font-medium">{d.name}</TableCell>
                        <TableCell>{d.avgDaily.toFixed(2)}/d</TableCell>
                        <TableCell>{d.totalSold}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* CRITICAL */}
        <TabsContent value="critical">
          <Card>
            <CardHeader><CardTitle className="text-base">🔴 Critically Low Stock — 3-Day Urgency</CardTitle></CardHeader>
            <CardContent>
              {stats.critical.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No critically low items 🎉</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Drug</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.critical.map(d => (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium">{d.drug_name}</TableCell>
                        <TableCell className="text-muted-foreground">{d.unit}</TableCell>
                        <TableCell>UGX {d.unit_price.toLocaleString()}</TableCell>
                        <TableCell><Badge variant="destructive">{d.quantity_in_stock}</Badge></TableCell>
                        <TableCell>UGX {(d.quantity_in_stock * d.unit_price).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ALL STOCK */}
        <TabsContent value="all">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">📋 All Inventory ({filtered.length})</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search drug..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Drug</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(d => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.drug_name}</TableCell>
                      <TableCell className="text-muted-foreground">{d.unit}</TableCell>
                      <TableCell>UGX {d.unit_price.toLocaleString()}</TableCell>
                      <TableCell>{d.quantity_in_stock}</TableCell>
                      <TableCell>UGX {(d.quantity_in_stock * d.unit_price).toLocaleString()}</TableCell>
                      <TableCell>
                        {d.quantity_in_stock === 0 ? (
                          <Badge variant="outline" className="text-muted-foreground">Out</Badge>
                        ) : d.quantity_in_stock <= 3 ? (
                          <Badge variant="destructive">Critical</Badge>
                        ) : d.quantity_in_stock <= (d.reorder_level || 10) ? (
                          <Badge className="bg-amber-100 text-amber-700">Low</Badge>
                        ) : (
                          <Badge className="bg-emerald-100 text-emerald-700">OK</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StockTrackingPage;
