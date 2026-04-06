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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Package, Truck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type AvailableDate = Tables<"available_dates">;

interface OrderItem {
  description: string | null;
  quantity: number;
}

interface OrderAppointment {
  id: string;
  status: string;
  total_cents: number;
  comments: string | null;
  deposit_paid: boolean | null;
  package_name: string | null;
  package_boxes: number | null;
  student_first: string;
  student_last: string;
  student_email: string;
  student_phone: string | null;
  student_school: string;
  dorm_name: string | null;
  address_line: string | null;
  dropoff_date: string | null;
  dropoff_time: string | null;
  pickup_date: string | null;
  pickup_time: string | null;
  items: OrderItem[];
  hasValet: boolean;
}

const AdminScheduling = () => {
  const [dates, setDates] = useState<AvailableDate[]>([]);
  const [appointments, setAppointments] = useState<OrderAppointment[]>([]);
  const [newDate, setNewDate] = useState("");
  const [newSchool, setNewSchool] = useState<"cu_boulder" | "du">("cu_boulder");
  const [newType, setNewType] = useState<"dropoff" | "pickup">("dropoff");
  const [newTimeSlot, setNewTimeSlot] = useState("");
  const [newSlots, setNewSlots] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchDates = async () => {
    const { data } = await supabase.from("available_dates").select("*").order("available_date");
    if (data) setDates(data);
  };

  const fetchAppointments = async () => {
    const { data } = await supabase
      .from("orders")
      .select(`
        id, status, total_cents, comments, deposit_paid,
        packages(name, num_boxes),
        students(first_name, last_name, email, phone, school, address_line, dorms(name)),
        dropoff_date:available_dates!orders_dropoff_date_id_fkey(available_date, time_slot),
        pickup_date:available_dates!orders_pickup_date_id_fkey(available_date, time_slot),
        order_items(description, quantity)
      `)
      .neq("status", "cancelled")
      .order("created_at", { ascending: false });

    if (data) {
      const mapped: OrderAppointment[] = data.map((o: any) => ({
        id: o.id,
        status: o.status,
        total_cents: o.total_cents,
        comments: o.comments,
        deposit_paid: o.deposit_paid,
        package_name: o.packages?.name ?? null,
        package_boxes: o.packages?.num_boxes ?? null,
        student_first: o.students?.first_name ?? "",
        student_last: o.students?.last_name ?? "",
        student_email: o.students?.email ?? "",
        student_phone: o.students?.phone ?? null,
        student_school: o.students?.school ?? "",
        dorm_name: o.students?.dorms?.name ?? null,
        address_line: o.students?.address_line ?? null,
        dropoff_date: o.dropoff_date?.available_date ?? null,
        dropoff_time: o.dropoff_date?.time_slot ?? null,
        pickup_date: o.pickup_date?.available_date ?? null,
        pickup_time: o.pickup_date?.time_slot ?? null,
        items: o.order_items ?? [],
      }));
      setAppointments(mapped);
    }
  };

  useEffect(() => {
    fetchDates();
    fetchAppointments();
  }, []);

  const addDate = async () => {
    if (!newDate) return;
    const { error } = await supabase.from("available_dates").insert({
      school: newSchool,
      date_type: newType,
      available_date: newDate,
      time_slot: newTimeSlot || null,
      slots_remaining: newSlots ? parseInt(newSlots) : null,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Date added" });
      setNewDate(""); setNewTimeSlot(""); setNewSlots("");
      setDialogOpen(false);
      fetchDates();
    }
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    await supabase.from("available_dates").update({ is_active: !currentActive }).eq("id", id);
    fetchDates();
  };

  const deleteDate = async (id: string) => {
    await supabase.from("available_dates").delete().eq("id", id);
    toast({ title: "Date removed" });
    fetchDates();
  };

  const dropoffs = dates.filter((d) => d.date_type === "dropoff");
  const pickups = dates.filter((d) => d.date_type === "pickup");

  // Group appointments by date
  const groupByDate = (appts: OrderAppointment[], dateKey: "dropoff_date" | "pickup_date") => {
    const groups: Record<string, OrderAppointment[]> = {};
    appts.forEach((a) => {
      const date = a[dateKey];
      if (!date) return;
      if (!groups[date]) groups[date] = [];
      groups[date].push(a);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  };

  const dropoffAppointments = groupByDate(appointments, "dropoff_date");
  const pickupAppointments = groupByDate(appointments, "pickup_date");

  const formatDate = (dateStr: string) =>
    new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });

  const statusColor = (status: string) => {
    switch (status) {
      case "booked": return "default";
      case "boxes_delivered": return "secondary";
      case "boxes_picked_up": return "secondary";
      case "in_storage": return "outline";
      case "delivered_back": return "default";
      default: return "secondary";
    }
  };

  const DateTable = ({ items, title }: { items: AvailableDate[]; title: string }) => (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>School</TableHead>
              <TableHead>Time Slot</TableHead>
              <TableHead>Slots</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No dates</TableCell></TableRow>
            )}
            {items.map((d) => (
              <TableRow key={d.id}>
                <TableCell>{new Date(d.available_date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</TableCell>
                <TableCell>{d.school === "cu_boulder" ? "CU Boulder" : "DU"}</TableCell>
                <TableCell>{d.time_slot || "—"}</TableCell>
                <TableCell>{d.slots_remaining ?? "∞"}</TableCell>
                <TableCell>
                  <Badge
                    variant={d.is_active ? "default" : "secondary"}
                    className="cursor-pointer"
                    onClick={() => toggleActive(d.id, d.is_active)}
                  >
                    {d.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => deleteDate(d.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  const AppointmentGroup = ({
    grouped,
    icon,
    timeKey,
  }: {
    grouped: [string, OrderAppointment[]][];
    icon: React.ReactNode;
    timeKey: "dropoff_time" | "pickup_time";
  }) => (
    <div className="space-y-4">
      {grouped.length === 0 && (
        <p className="text-center text-muted-foreground py-8">No appointments scheduled</p>
      )}
      {grouped.map(([date, orders]) => (
        <Card key={date}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 font-display text-base">
              {icon}
              {formatDate(date)}
              {orders[0]?.[timeKey] && (
                <span className="text-sm font-normal text-muted-foreground">
                  ({orders[0][timeKey]})
                </span>
              )}
              <Badge variant="outline" className="ml-auto">
                {orders.length} {orders.length === 1 ? "order" : "orders"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Package</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Deposit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium">
                      {o.student_first} {o.student_last}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{o.student_email}</div>
                      {o.student_phone && (
                        <div className="text-xs text-muted-foreground">{o.student_phone}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{o.dorm_name || "Off Campus"}</div>
                      {o.address_line && (
                        <div className="text-xs text-muted-foreground">{o.address_line}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      {o.package_name ? (
                        <div className="text-sm">
                          {o.package_name}
                          <span className="text-xs text-muted-foreground ml-1">
                            ({o.package_boxes} boxes)
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {o.items.length > 0 ? (
                        <div className="space-y-0.5">
                          {o.items.map((item, idx) => (
                            <div key={idx} className="text-xs">
                              {item.quantity > 1 && <span className="font-medium">{item.quantity}× </span>}
                              {item.description || "Item"}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Package only</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusColor(o.status) as any}>
                        {o.status.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={o.deposit_paid ? "default" : "destructive"}>
                        {o.deposit_paid ? "Paid" : "Unpaid"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Scheduling</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-1 h-4 w-4" /> Add Date</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">Add Available Date</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>School</Label>
                  <Select value={newSchool} onValueChange={(v) => setNewSchool(v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cu_boulder">CU Boulder</SelectItem>
                      <SelectItem value="du">DU</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Type</Label>
                  <Select value={newType} onValueChange={(v) => setNewType(v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dropoff">Drop-Off</SelectItem>
                      <SelectItem value="pickup">Pickup</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label>Date</Label>
                <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Time Slot (optional, for pickups)</Label>
                <Input value={newTimeSlot} onChange={(e) => setNewTimeSlot(e.target.value)} placeholder="e.g. 9am-12pm" />
              </div>
              <div className="space-y-1">
                <Label>Available Slots (optional)</Label>
                <Input type="number" value={newSlots} onChange={(e) => setNewSlots(e.target.value)} placeholder="Leave blank for unlimited" />
              </div>
              <Button onClick={addDate} className="w-full">Add Date</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="appointments">
        <TabsList>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="manage-dates">Manage Dates</TabsTrigger>
        </TabsList>

        <TabsContent value="appointments" className="space-y-6 mt-4">
          <div>
            <h2 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
              <Package className="h-5 w-5" /> Box Drop-Off Appointments
            </h2>
            <AppointmentGroup
              grouped={dropoffAppointments}
              icon={<Package className="h-4 w-4 text-primary" />}
              timeKey="dropoff_time"
            />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
              <Truck className="h-5 w-5" /> Box Pickup Appointments
            </h2>
            <AppointmentGroup
              grouped={pickupAppointments}
              icon={<Truck className="h-4 w-4 text-primary" />}
              timeKey="pickup_time"
            />
          </div>
        </TabsContent>

        <TabsContent value="manage-dates" className="space-y-4 mt-4">
          <DateTable items={dropoffs} title="Box Drop-Off Dates" />
          <DateTable items={pickups} title="Box Pickup Dates" />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminScheduling;
