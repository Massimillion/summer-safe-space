import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Package, CreditCard } from "lucide-react";
import PortalHeader from "@/components/portal/PortalHeader";
import OrderCard from "@/components/portal/OrderCard";
import type { OrderData } from "@/components/portal/OrderCard";

const Portal = () => {
  const { user, signOut } = useAuth();
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [studentSchool, setStudentSchool] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const { data: student } = await supabase
        .from("students")
        .select("id, dorm_id, school")
        .eq("user_id", user.id)
        .single();

      if (!student) { setLoading(false); return; }
      setStudentSchool(student.school);

      // Fetch orders with related data
      const { data: ordersData } = await supabase
        .from("orders")
        .select(`
          *,
          packages ( name, num_boxes, price_cents ),
          dropoff_date:available_dates!orders_dropoff_date_id_fkey ( available_date, time_slot ),
          pickup_date:available_dates!orders_pickup_date_id_fkey ( available_date, time_slot ),
          order_items ( id, description, quantity, price_cents ),
          payments ( id, amount_cents, payment_type, description, created_at )
        `)
        .eq("student_id", student.id)
        .order("created_at", { ascending: false });

      // Get dorm name
      let dormName: string | null = null;
      if (student.dorm_id) {
        const { data: dorm } = await supabase
          .from("dorms")
          .select("name")
          .eq("id", student.dorm_id)
          .single();
        dormName = dorm?.name ?? null;
      }

      const mapped: OrderData[] = (ordersData || []).map((o: any) => ({
        id: o.id,
        created_at: o.created_at,
        status: o.status,
        storage_term: o.storage_term,
        total_cents: o.total_cents,
        comments: o.comments,
        package_name: o.packages?.name ?? null,
        num_boxes: o.packages?.num_boxes ?? null,
        package_price_cents: o.packages?.price_cents ?? null,
        dropoff_date: o.dropoff_date?.available_date ?? null,
        dropoff_time: o.dropoff_date?.time_slot ?? null,
        pickup_date: o.pickup_date?.available_date ?? null,
        pickup_time: o.pickup_date?.time_slot ?? null,
        dorm_name: dormName,
        items: o.order_items || [],
        payments: o.payments || [],
      }));

      setOrders(mapped);
      setLoading(false);
    };
    fetchData();
  }, [user, refreshKey]);

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

  const totalCharged = orders.reduce((s, o) => s + o.total_cents, 0);
  const totalPaid = orders.reduce((s, o) => s + o.payments.reduce((ps, p) => ps + p.amount_cents, 0), 0);
  const balance = totalCharged - totalPaid;

  return (
    <div className="min-h-screen bg-background">
      <PortalHeader user={user} signOut={signOut} />

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
          <>
            {/* Summary row */}
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <Package className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-2xl font-bold text-foreground">{orders.length}</p>
                    <p className="text-xs text-muted-foreground">Order{orders.length !== 1 ? "s" : ""}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-2xl font-bold text-foreground">${(totalPaid / 100).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">Paid</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <div>
                    <p className={`text-2xl font-bold ${balance > 0 ? "text-destructive" : "text-primary"}`}>
                      ${(balance / 100).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">Balance</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order cards */}
            <div className="mt-6 space-y-4">
              <h2 className="font-display text-xl font-semibold text-foreground">Your Orders</h2>
              {orders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Portal;
