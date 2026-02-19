import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LogOut, Package, CreditCard } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Order = Tables<"orders">;
type OrderItem = Tables<"order_items">;
type Payment = Tables<"payments">;

const statusLabels: Record<string, string> = {
  booked: "Booked",
  boxes_delivered: "Boxes Delivered",
  boxes_picked_up: "Picked Up",
  in_storage: "In Storage",
  delivered_back: "Delivered Back",
  cancelled: "Cancelled",
};

const Portal = () => {
  const { user, signOut } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      // Get student record
      const { data: student } = await supabase
        .from("students")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!student) { setLoading(false); return; }

      const [ordersRes, itemsRes, paymentsRes] = await Promise.all([
        supabase.from("orders").select("*").eq("student_id", student.id).order("created_at", { ascending: false }),
        supabase.from("order_items").select("*"),
        supabase.from("payments").select("*"),
      ]);

      if (ordersRes.data) setOrders(ordersRes.data);
      if (itemsRes.data) setOrderItems(itemsRes.data);
      if (paymentsRes.data) setPayments(paymentsRes.data);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <p className="text-muted-foreground">Please log in to view your portal.</p>
            <Button className="mt-4" asChild><Link to="/login">Log In</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalPaid = payments.reduce((sum, p) => sum + p.amount_cents, 0);
  const totalCharged = orders.reduce((sum, o) => sum + o.total_cents, 0);
  const balance = totalCharged - totalPaid;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🐿️</span>
            <span className="font-display text-xl font-bold">
              Squirrel<span className="text-primary">Box</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{user.email}</span>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="mr-1 h-4 w-4" /> Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-8">
        <h1 className="font-display text-3xl font-bold text-foreground">Student Portal</h1>

        {loading ? (
          <p className="mt-8 text-muted-foreground">Loading…</p>
        ) : orders.length === 0 ? (
          <Card className="mt-8">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No orders yet.</p>
              <Button className="mt-4" asChild><Link to="/book">Book Storage</Link></Button>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {/* Summary cards */}
            <Card>
              <CardHeader className="flex flex-row items-center gap-3 pb-2">
                <Package className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">My Storage</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-foreground">{orders.length}</p>
                <p className="text-sm text-muted-foreground">active order{orders.length !== 1 ? "s" : ""}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center gap-3 pb-2">
                <CreditCard className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Total Charged</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-foreground">${(totalCharged / 100).toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center gap-3 pb-2">
                <CreditCard className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-3xl font-bold ${balance > 0 ? "text-destructive" : "text-primary"}`}>
                  ${(balance / 100).toFixed(2)}
                </p>
              </CardContent>
            </Card>

            {/* Orders table */}
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle className="font-display">Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => {
                        const items = orderItems.filter((i) => i.order_id === order.id);
                        return (
                          <TableRow key={order.id}>
                            <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Badge variant={order.status === "cancelled" ? "destructive" : "secondary"}>
                                {statusLabels[order.status] || order.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {items.length > 0
                                ? items.map((i) => i.description || "Item").join(", ")
                                : "Package only"}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              ${(order.total_cents / 100).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            {/* Payments table */}
            {payments.length > 0 && (
              <div className="lg:col-span-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-display">Payments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell>{new Date(payment.created_at).toLocaleDateString()}</TableCell>
                            <TableCell className="capitalize">{payment.payment_type}</TableCell>
                            <TableCell>{payment.description || "—"}</TableCell>
                            <TableCell className="text-right font-medium">
                              ${(payment.amount_cents / 100).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Portal;
