import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Pencil } from "lucide-react";
import EditOrderDialog from "@/components/admin/EditOrderDialog";
import type { Tables } from "@/integrations/supabase/types";

type Order = Tables<"orders">;
type Student = Tables<"students">;

const statusLabels: Record<string, string> = {
  booked: "Booked",
  boxes_delivered: "Boxes Delivered",
  boxes_picked_up: "Picked Up",
  in_storage: "In Storage",
  delivered_back: "Delivered Back",
  cancelled: "Cancelled",
};

const statusOptions = ["booked", "boxes_delivered", "boxes_picked_up", "in_storage", "delivered_back", "cancelled"] as const;

const termLabels: Record<string, string> = {
  summer: "Summer",
  study_abroad: "Summer + Study Abroad",
};

const AdminOrders = () => {
  const [orders, setOrders] = useState<(Order & { student?: Student })[]>([]);
  const [_students, setStudents] = useState<Student[]>([]);
  const [filterSchool, setFilterSchool] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<(Order & { student?: Student }) | null>(null);
  const [selectedDetails, setSelectedDetails] = useState<any | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editOrder, setEditOrder] = useState<(Order & { student?: Student }) | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const { toast } = useToast();

  const fetchData = async () => {
    const [ordersRes, studentsRes] = await Promise.all([
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("students").select("*"),
    ]);
    const studentsData = studentsRes.data || [];
    setStudents(studentsData);
    const ordersWithStudents = (ordersRes.data || []).map((o) => ({
      ...o,
      student: studentsData.find((s) => s.id === o.student_id),
    }));
    setOrders(ordersWithStudents);
  };

  const openView = async (order: Order & { student?: Student }) => {
    setSelectedOrder(order);
    setViewOpen(true);
    setDetailsLoading(true);
    setSelectedDetails(null);

    const [pkgRes, itemsRes, dropRes, pickRes, dormRes, paymentsRes] = await Promise.all([
      order.package_id
        ? supabase.from("packages").select("name, num_boxes, price_cents").eq("id", order.package_id).maybeSingle()
        : Promise.resolve({ data: null } as any),
      supabase.from("order_items").select("*").eq("order_id", order.id),
      order.dropoff_date_id
        ? supabase.from("available_dates").select("available_date, time_slot").eq("id", order.dropoff_date_id).maybeSingle()
        : Promise.resolve({ data: null } as any),
      order.pickup_date_id
        ? supabase.from("available_dates").select("available_date, time_slot").eq("id", order.pickup_date_id).maybeSingle()
        : Promise.resolve({ data: null } as any),
      order.student?.dorm_id
        ? supabase.from("dorms").select("name").eq("id", order.student.dorm_id).maybeSingle()
        : Promise.resolve({ data: null } as any),
      supabase.from("payments").select("*").eq("order_id", order.id).order("created_at"),
    ]);

    setSelectedDetails({
      pkg: pkgRes.data,
      items: itemsRes.data || [],
      dropoff: dropRes.data,
      pickup: pickRes.data,
      dorm: dormRes.data,
      payments: paymentsRes.data || [],
    });
    setDetailsLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const updateStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus as any })
      .eq("id", orderId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Status updated" });
      fetchData();
    }
  };

  const filtered = orders.filter((o) => {
    if (filterSchool !== "all" && o.student?.school !== filterSchool) return false;
    if (filterStatus !== "all" && o.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      const name = `${o.student?.first_name} ${o.student?.last_name}`.toLowerCase();
      if (!name.includes(q) && !o.student?.email.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Orders</h1>

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
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {statusOptions.map((s) => (
              <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>School</TableHead>
                <TableHead>Term</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">No orders found</TableCell></TableRow>
              )}
              {filtered.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <div className="font-medium">{order.student?.first_name} {order.student?.last_name}</div>
                    <div className="text-xs text-muted-foreground">{order.student?.email}</div>
                  </TableCell>
                  <TableCell>{order.student?.school === "cu_boulder" ? "CU Boulder" : "DU"}</TableCell>
                  <TableCell>
                    <Badge variant={order.storage_term === "study_abroad" ? "default" : "outline"} className="text-xs">
                      {termLabels[order.storage_term] || order.storage_term}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Select value={order.status} onValueChange={(v) => updateStatus(order.id, v)}>
                      <SelectTrigger className="h-8 w-36">
                        <Badge variant={order.status === "cancelled" ? "destructive" : "secondary"} className="text-xs">
                          {statusLabels[order.status]}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((s) => (
                          <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>${(order.total_cents / 100).toFixed(2)}</TableCell>
                  <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setEditOrder(order); setEditOpen(true); }}
                      >
                        <Pencil className="mr-1 h-3 w-3" /> Edit
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openView(order)}>View</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4 text-sm">
              {/* Student */}
              <section className="space-y-1">
                <h3 className="font-semibold text-foreground">Student</h3>
                <div>{selectedOrder.student?.first_name} {selectedOrder.student?.last_name}</div>
                <div className="text-muted-foreground">{selectedOrder.student?.email}</div>
                <div className="text-muted-foreground">{selectedOrder.student?.phone || "No phone"}</div>
                <div className="text-muted-foreground">
                  {selectedOrder.student?.school === "cu_boulder" ? "CU Boulder" : "DU"}
                  {selectedDetails?.dorm?.name ? ` — ${selectedDetails.dorm.name}` : ""}
                  {selectedOrder.student?.is_off_campus ? " (Off-Campus)" : ""}
                </div>
                {selectedOrder.student?.address_line && (
                  <div className="text-muted-foreground">{selectedOrder.student.address_line}</div>
                )}
              </section>

              {/* Order summary */}
              <section className="grid grid-cols-2 gap-3 border-t pt-3">
                <div>
                  <div className="text-xs text-muted-foreground">Status</div>
                  <div>{statusLabels[selectedOrder.status]}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Storage Term</div>
                  <div>{termLabels[selectedOrder.storage_term] || selectedOrder.storage_term}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Booked On</div>
                  <div>{new Date(selectedOrder.created_at).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Deposit Paid</div>
                  <div>{selectedOrder.deposit_paid ? "Yes" : "No"}</div>
                </div>
              </section>

              {/* Schedule */}
              <section className="border-t pt-3">
                <h3 className="mb-1 font-semibold text-foreground">Schedule</h3>
                {detailsLoading ? (
                  <div className="text-muted-foreground">Loading…</div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-muted-foreground">Drop-Off</div>
                      <div>
                        {selectedDetails?.dropoff
                          ? `${new Date(selectedDetails.dropoff.available_date + "T12:00:00").toLocaleDateString()}${selectedDetails.dropoff.time_slot ? ` · ${selectedDetails.dropoff.time_slot}` : ""}`
                          : "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Pick-Up</div>
                      <div>
                        {selectedDetails?.pickup
                          ? `${new Date(selectedDetails.pickup.available_date + "T12:00:00").toLocaleDateString()}${selectedDetails.pickup.time_slot ? ` · ${selectedDetails.pickup.time_slot}` : ""}`
                          : "—"}
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* Package & items */}
              <section className="border-t pt-3">
                <h3 className="mb-1 font-semibold text-foreground">Package & Items</h3>
                {detailsLoading ? (
                  <div className="text-muted-foreground">Loading…</div>
                ) : (
                  <div className="space-y-1">
                    {selectedDetails?.pkg ? (
                      <div className="flex justify-between">
                        <span>{selectedDetails.pkg.name} — {selectedDetails.pkg.num_boxes} box{selectedDetails.pkg.num_boxes !== 1 ? "es" : ""}</span>
                        <span>${(selectedDetails.pkg.price_cents / 100).toFixed(2)}</span>
                      </div>
                    ) : (
                      <div className="text-muted-foreground">No package selected</div>
                    )}
                    {(selectedDetails?.items || []).map((it: any) => (
                      <div key={it.id} className="flex justify-between">
                        <span>{it.description || "Item"}{it.quantity > 1 ? ` × ${it.quantity}` : ""}</span>
                        <span>${(it.price_cents / 100).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between border-t pt-2 font-semibold">
                      <span>Total</span>
                      <span>${(selectedOrder.total_cents / 100).toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </section>

              {/* Payments */}
              {selectedDetails?.payments?.length > 0 && (
                <section className="border-t pt-3">
                  <h3 className="mb-1 font-semibold text-foreground">Payments</h3>
                  <div className="space-y-1">
                    {selectedDetails.payments.map((p: any) => (
                      <div key={p.id} className="flex justify-between text-muted-foreground">
                        <span>{p.description || p.payment_type} · {new Date(p.created_at).toLocaleDateString()}</span>
                        <span>${(p.amount_cents / 100).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Comments */}
              {selectedOrder.comments && (
                <section className="border-t pt-3">
                  <h3 className="mb-1 font-semibold text-foreground">Comments / Notes</h3>
                  <p className="whitespace-pre-wrap text-muted-foreground">{selectedOrder.comments}</p>
                </section>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <EditOrderDialog
        order={editOrder}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={fetchData}
      />
    </div>
  );
};

export default AdminOrders;
