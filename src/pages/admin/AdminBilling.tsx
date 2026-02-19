import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Payment = Tables<"payments">;
type Order = Tables<"orders"> & { student?: Tables<"students"> };

const AdminBilling = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const { toast } = useToast();

  // Manual charge form
  const [chargeDialog, setChargeDialog] = useState(false);
  const [chargeOrderId, setChargeOrderId] = useState("");
  const [chargeAmount, setChargeAmount] = useState("");
  const [chargeDesc, setChargeDesc] = useState("");
  const [chargeType, setChargeType] = useState("manual");

  const fetchData = async () => {
    const [paymentsRes, ordersRes, studentsRes] = await Promise.all([
      supabase.from("payments").select("*").order("created_at", { ascending: false }),
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("students").select("*"),
    ]);
    const students = studentsRes.data || [];
    setOrders((ordersRes.data || []).map((o) => ({ ...o, student: students.find((s) => s.id === o.student_id) })));
    setPayments(paymentsRes.data || []);
  };

  useEffect(() => { fetchData(); }, []);

  const addCharge = async () => {
    if (!chargeOrderId || !chargeAmount) return;
    const { error } = await supabase.from("payments").insert({
      order_id: chargeOrderId,
      amount_cents: Math.round(parseFloat(chargeAmount) * 100),
      payment_type: chargeType,
      description: chargeDesc || null,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Charge added" });
      setChargeDialog(false);
      setChargeAmount(""); setChargeDesc("");
      fetchData();
    }
  };

  // Calculate balances per order
  const orderBalances = orders.map((order) => {
    const orderPayments = payments.filter((p) => p.order_id === order.id);
    const totalPaid = orderPayments.reduce((sum, p) => sum + p.amount_cents, 0);
    return { ...order, totalPaid, balance: order.total_cents - totalPaid };
  });

  const totalRevenue = payments.reduce((sum, p) => sum + p.amount_cents, 0);
  const totalOutstanding = orderBalances.reduce((sum, o) => sum + Math.max(0, o.balance), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Billing & Payments</h1>
        <Dialog open={chargeDialog} onOpenChange={setChargeDialog}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-1 h-4 w-4" /> Add Charge</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display">Add Manual Charge / Adjustment</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Order</Label>
                <Select value={chargeOrderId} onValueChange={setChargeOrderId}>
                  <SelectTrigger><SelectValue placeholder="Select an order" /></SelectTrigger>
                  <SelectContent>
                    {orders.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.student?.first_name} {o.student?.last_name} — ${(o.total_cents / 100).toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Type</Label>
                <Select value={chargeType} onValueChange={setChargeType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual Payment</SelectItem>
                    <SelectItem value="adjustment">Adjustment / Discount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Amount ($)</Label><Input type="number" step="0.01" value={chargeAmount} onChange={(e) => setChargeAmount(e.target.value)} /></div>
              <div className="space-y-1"><Label>Description</Label><Input value={chargeDesc} onChange={(e) => setChargeDesc(e.target.value)} placeholder="e.g. Late fee, discount" /></div>
              <Button onClick={addCharge} className="w-full">Add</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Revenue</CardTitle></CardHeader>
          <CardContent><p className="font-display text-3xl font-bold text-primary">${(totalRevenue / 100).toFixed(2)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Outstanding Balance</CardTitle></CardHeader>
          <CardContent><p className={`font-display text-3xl font-bold ${totalOutstanding > 0 ? "text-destructive" : "text-primary"}`}>${(totalOutstanding / 100).toFixed(2)}</p></CardContent>
        </Card>
      </div>

      {/* Balances per student */}
      <Card>
        <CardHeader><CardTitle className="font-display">Student Balances</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Total Charged</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orderBalances.map((o) => (
                <TableRow key={o.id}>
                  <TableCell>
                    <div className="font-medium">{o.student?.first_name} {o.student?.last_name}</div>
                    <div className="text-xs text-muted-foreground">{o.student?.email}</div>
                  </TableCell>
                  <TableCell>${(o.total_cents / 100).toFixed(2)}</TableCell>
                  <TableCell>${(o.totalPaid / 100).toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={o.balance > 0 ? "destructive" : "default"}>
                      ${(o.balance / 100).toFixed(2)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {orderBalances.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No orders</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent payments */}
      <Card>
        <CardHeader><CardTitle className="font-display">Recent Payments</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((p) => {
                const order = orders.find((o) => o.id === p.order_id);
                return (
                  <TableRow key={p.id}>
                    <TableCell>{new Date(p.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>{order?.student?.first_name} {order?.student?.last_name}</TableCell>
                    <TableCell className="capitalize">{p.payment_type}</TableCell>
                    <TableCell>{p.description || "—"}</TableCell>
                    <TableCell className="text-right font-medium">${(p.amount_cents / 100).toFixed(2)}</TableCell>
                  </TableRow>
                );
              })}
              {payments.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No payments</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminBilling;
