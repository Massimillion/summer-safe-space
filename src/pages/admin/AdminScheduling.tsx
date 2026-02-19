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
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type AvailableDate = Tables<"available_dates">;

const AdminScheduling = () => {
  const [dates, setDates] = useState<AvailableDate[]>([]);
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

  useEffect(() => { fetchDates(); }, []);

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

      <DateTable items={dropoffs} title="Box Drop-Off Dates" />
      <DateTable items={pickups} title="Box Pickup Dates" />
    </div>
  );
};

export default AdminScheduling;
