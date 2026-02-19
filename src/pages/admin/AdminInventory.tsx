import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Order = Tables<"orders"> & { student?: Tables<"students"> };
type WarehouseLocation = Tables<"warehouse_locations">;
type OrderItem = Tables<"order_items">;

const AdminInventory = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [locations, setLocations] = useState<WarehouseLocation[]>([]);
  const [search, setSearch] = useState("");
  const [filterSchool, setFilterSchool] = useState("all");
  const { toast } = useToast();

  // Location form state
  const [editOrderId, setEditOrderId] = useState("");
  const [zone, setZone] = useState("");
  const [shelf, setShelf] = useState("");
  const [bin, setBin] = useState("");

  const fetchData = async () => {
    const [ordersRes, studentsRes, itemsRes, locsRes] = await Promise.all([
      supabase.from("orders").select("*").neq("status", "cancelled").order("created_at", { ascending: false }),
      supabase.from("students").select("*"),
      supabase.from("order_items").select("*"),
      supabase.from("warehouse_locations").select("*"),
    ]);
    const students = studentsRes.data || [];
    setOrders((ordersRes.data || []).map((o) => ({ ...o, student: students.find((s) => s.id === o.student_id) })));
    setItems(itemsRes.data || []);
    setLocations(locsRes.data || []);
  };

  useEffect(() => { fetchData(); }, []);

  const saveLocation = async () => {
    const existing = locations.find((l) => l.order_id === editOrderId);
    if (existing) {
      await supabase.from("warehouse_locations").update({ zone, shelf, bin }).eq("id", existing.id);
    } else {
      await supabase.from("warehouse_locations").insert({ order_id: editOrderId, zone, shelf, bin });
    }
    toast({ title: "Location saved" });
    fetchData();
  };

  const filtered = orders.filter((o) => {
    if (filterSchool !== "all" && o.student?.school !== filterSchool) return false;
    if (search) {
      const q = search.toLowerCase();
      const name = `${o.student?.first_name} ${o.student?.last_name}`.toLowerCase();
      if (!name.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Inventory</h1>

      <div className="flex flex-wrap gap-3">
        <Input placeholder="Search student…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-64" />
        <Select value={filterSchool} onValueChange={setFilterSchool}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Schools</SelectItem>
            <SelectItem value="cu_boulder">CU Boulder</SelectItem>
            <SelectItem value="du">DU</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Package / Boxes</TableHead>
                <TableHead>Add-Ons</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No inventory found</TableCell></TableRow>
              )}
              {filtered.map((order) => {
                const orderItems = items.filter((i) => i.order_id === order.id);
                const loc = locations.find((l) => l.order_id === order.id);
                return (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div className="font-medium">{order.student?.first_name} {order.student?.last_name}</div>
                      <div className="text-xs text-muted-foreground">{order.student?.school === "cu_boulder" ? "CU Boulder" : "DU"}</div>
                    </TableCell>
                    <TableCell>{order.custom_box_count ? `${order.custom_box_count} boxes (custom)` : "Package"}</TableCell>
                    <TableCell>
                      {orderItems.length === 0 ? "—" : orderItems.map((i) => `${i.description || "Item"} ×${i.quantity}`).join(", ")}
                    </TableCell>
                    <TableCell>
                      {loc ? `${loc.zone || "—"} / ${loc.shelf || "—"} / ${loc.bin || "—"}` : "Not assigned"}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditOrderId(order.id);
                              setZone(loc?.zone || "");
                              setShelf(loc?.shelf || "");
                              setBin(loc?.bin || "");
                            }}
                          >
                            {loc ? "Edit" : "Assign"}
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle className="font-display">Warehouse Location</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-3">
                            <div className="space-y-1">
                              <Label>Zone</Label>
                              <Input value={zone} onChange={(e) => setZone(e.target.value)} placeholder="e.g. A" />
                            </div>
                            <div className="space-y-1">
                              <Label>Shelf</Label>
                              <Input value={shelf} onChange={(e) => setShelf(e.target.value)} placeholder="e.g. 3" />
                            </div>
                            <div className="space-y-1">
                              <Label>Bin</Label>
                              <Input value={bin} onChange={(e) => setBin(e.target.value)} placeholder="e.g. B12" />
                            </div>
                            <Button onClick={saveLocation} className="w-full">Save Location</Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminInventory;
