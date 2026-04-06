import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(order)}>View</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                          <DialogHeader>
                            <DialogTitle className="font-display">Order Details</DialogTitle>
                          </DialogHeader>
                          {selectedOrder && (
                            <div className="space-y-3 text-sm">
                              <div><span className="font-semibold">Student:</span> {selectedOrder.student?.first_name} {selectedOrder.student?.last_name}</div>
                              <div><span className="font-semibold">Email:</span> {selectedOrder.student?.email}</div>
                              <div><span className="font-semibold">Phone:</span> {selectedOrder.student?.phone || "—"}</div>
                              <div><span className="font-semibold">School:</span> {selectedOrder.student?.school === "cu_boulder" ? "CU Boulder" : "DU"}</div>
                              <div><span className="font-semibold">Storage Term:</span> {termLabels[selectedOrder.storage_term] || selectedOrder.storage_term}</div>
                              <div><span className="font-semibold">Status:</span> {statusLabels[selectedOrder.status]}</div>
                              <div><span className="font-semibold">Total:</span> ${(selectedOrder.total_cents / 100).toFixed(2)}</div>
                              {selectedOrder.comments && <div><span className="font-semibold">Comments:</span> {selectedOrder.comments}</div>}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
