import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Order = Tables<"orders">;
type Student = Tables<"students">;
type OrderItem = Tables<"order_items">;
type Package = Tables<"packages">;
type AddOn = Tables<"add_ons">;
type AvailableDate = Tables<"available_dates">;

interface EditOrderDialogProps {
  order: (Order & { student?: Student }) | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

const statusOptions = ["booked", "boxes_delivered", "boxes_picked_up", "in_storage", "delivered_back", "cancelled"] as const;
const statusLabels: Record<string, string> = {
  booked: "Booked",
  boxes_delivered: "Boxes Delivered",
  boxes_picked_up: "Picked Up",
  in_storage: "In Storage",
  delivered_back: "Delivered Back",
  cancelled: "Cancelled",
};

const EditOrderDialog = ({ order, open, onOpenChange, onSaved }: EditOrderDialogProps) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Order fields
  const [status, setStatus] = useState("");
  const [storageTerm, setStorageTerm] = useState("summer");
  const [packageId, setPackageId] = useState<string | null>(null);
  const [dropoffDateId, setDropoffDateId] = useState<string | null>(null);
  const [pickupDateId, setPickupDateId] = useState<string | null>(null);
  const [totalCents, setTotalCents] = useState(0);
  const [comments, setComments] = useState("");

  // Order items
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [dropoffDates, setDropoffDates] = useState<AvailableDate[]>([]);
  const [pickupDates, setPickupDates] = useState<AvailableDate[]>([]);

  // New item form
  const [newAddOnId, setNewAddOnId] = useState("");
  const [newQty, setNewQty] = useState(1);

  useEffect(() => {
    if (!order || !open) return;
    setStatus(order.status);
    setStorageTerm(order.storage_term || "summer");
    setPackageId(order.package_id);
    setDropoffDateId(order.dropoff_date_id);
    setPickupDateId(order.pickup_date_id);
    setTotalCents(order.total_cents);
    setComments(order.comments || "");
    setLoading(true);

    const school = order.student?.school;
    const fetch = async () => {
      const [itemsRes, pkgRes, addOnRes, dropRes, pickRes] = await Promise.all([
        supabase.from("order_items").select("*").eq("order_id", order.id),
        supabase.from("packages").select("*").order("sort_order"),
        supabase.from("add_ons").select("*").order("sort_order"),
        school
          ? supabase.from("available_dates").select("*").eq("school", school).eq("date_type", "dropoff").eq("is_active", true).order("available_date")
          : Promise.resolve({ data: [] } as any),
        school
          ? supabase.from("available_dates").select("*").eq("school", school).eq("date_type", "pickup").eq("is_active", true).order("available_date")
          : Promise.resolve({ data: [] } as any),
      ]);
      if (itemsRes.data) setOrderItems(itemsRes.data);
      if (pkgRes.data) setPackages(pkgRes.data);
      if (addOnRes.data) setAddOns(addOnRes.data);
      if (dropRes.data) setDropoffDates(dropRes.data);
      if (pickRes.data) setPickupDates(pickRes.data);
      setLoading(false);
    };
    fetch();
  }, [order, open]);

  const handleSave = async () => {
    if (!order) return;
    setSaving(true);

    // Update order
    const { error: orderErr } = await supabase
      .from("orders")
      .update({
        status: status as any,
        storage_term: storageTerm,
        package_id: packageId,
        dropoff_date_id: dropoffDateId,
        pickup_date_id: pickupDateId,
        total_cents: totalCents,
        comments: comments || null,
      })
      .eq("id", order.id);

    if (orderErr) {
      toast({ title: "Error", description: orderErr.message, variant: "destructive" });
      setSaving(false);
      return;
    }

    toast({ title: "Order updated" });
    setSaving(false);
    onSaved();
    onOpenChange(false);
  };

  const addItem = async () => {
    if (!order || !newAddOnId) return;
    const addOn = addOns.find((a) => a.id === newAddOnId);
    if (!addOn) return;

    const { error } = await supabase.from("order_items").insert({
      order_id: order.id,
      add_on_id: addOn.id,
      description: addOn.name,
      price_cents: addOn.price_cents,
      quantity: newQty,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      const { data } = await supabase.from("order_items").select("*").eq("order_id", order.id);
      if (data) setOrderItems(data);
      setNewAddOnId("");
      setNewQty(1);
    }
  };

  const removeItem = async (itemId: string) => {
    await supabase.from("order_items").delete().eq("id", itemId);
    setOrderItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  const updateItemQty = async (itemId: string, qty: number) => {
    if (qty < 1) return;
    await supabase.from("order_items").update({ quantity: qty }).eq("id", itemId);
    setOrderItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, quantity: qty } : i)));
  };

  const recalcTotal = () => {
    const pkg = packages.find((p) => p.id === packageId);
    let base = pkg ? pkg.price_cents : 0;
    const valetItem = orderItems.find((i) => {
      const ao = addOns.find((a) => a.id === i.add_on_id);
      return ao?.name.toLowerCase().includes("valet");
    });
    const nonValetItems = orderItems.filter((i) => {
      const ao = addOns.find((a) => a.id === i.add_on_id);
      return !ao?.name.toLowerCase().includes("valet");
    });
    let addOnTotal = nonValetItems.reduce((s, i) => s + i.price_cents * i.quantity, 0);
    base += addOnTotal;
    if (storageTerm === "study_abroad") base *= 2;
    if (valetItem) base += valetItem.price_cents * valetItem.quantity;
    setTotalCents(base);
  };

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">
            Edit Order — {order.student?.first_name} {order.student?.last_name}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-5">
            {/* Status & Storage Term */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((s) => (
                      <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Storage Term</Label>
                <Select value={storageTerm} onValueChange={setStorageTerm}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="summer">Summer Storage</SelectItem>
                    <SelectItem value="study_abroad">Summer + Study Abroad</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Package */}
            <div className="space-y-1.5">
              <Label>Package</Label>
              <Select value={packageId || "none"} onValueChange={(v) => setPackageId(v === "none" ? null : v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Package</SelectItem>
                  {packages.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({p.num_boxes} boxes — ${(p.price_cents / 100).toFixed(2)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Drop-off / Pick-up dates */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Drop-Off Date</Label>
                <Select value={dropoffDateId || "none"} onValueChange={(v) => setDropoffDateId(v === "none" ? null : v)}>
                  <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— None —</SelectItem>
                    {dropoffDates.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {new Date(d.available_date).toLocaleDateString()}{d.time_slot ? ` · ${d.time_slot}` : ""}
                      </SelectItem>
                    ))}
                    {dropoffDateId && !dropoffDates.find((d) => d.id === dropoffDateId) && (
                      <SelectItem value={dropoffDateId}>Current selection (inactive)</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Pick-Up Date</Label>
                <Select value={pickupDateId || "none"} onValueChange={(v) => setPickupDateId(v === "none" ? null : v)}>
                  <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— None —</SelectItem>
                    {pickupDates.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {new Date(d.available_date).toLocaleDateString()}{d.time_slot ? ` · ${d.time_slot}` : ""}
                      </SelectItem>
                    ))}
                    {pickupDateId && !pickupDates.find((d) => d.id === pickupDateId) && (
                      <SelectItem value={pickupDateId}>Current selection (inactive)</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Order Items */}
            <div className="space-y-2">
              <Label>Items / Add-Ons</Label>
              <div className="rounded-md border">
                {orderItems.length === 0 ? (
                  <p className="p-3 text-sm text-muted-foreground text-center">No items</p>
                ) : (
                  <div className="divide-y">
                    {orderItems.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 p-3">
                        <span className="flex-1 text-sm">{item.description || "Item"}</span>
                        <span className="text-xs text-muted-foreground">
                          ${(item.price_cents / 100).toFixed(2)} ea
                        </span>
                        <Input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => updateItemQty(item.id, parseInt(e.target.value) || 1)}
                          className="w-16 h-8"
                        />
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeItem(item.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                {/* Add item row */}
                <div className="flex items-center gap-2 p-3 border-t bg-muted/30">
                  <Select value={newAddOnId} onValueChange={setNewAddOnId}>
                    <SelectTrigger className="flex-1 h-8"><SelectValue placeholder="Add item…" /></SelectTrigger>
                    <SelectContent>
                      {addOns.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name} (${(a.price_cents / 100).toFixed(2)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min={1}
                    value={newQty}
                    onChange={(e) => setNewQty(parseInt(e.target.value) || 1)}
                    className="w-16 h-8"
                  />
                  <Button variant="outline" size="sm" onClick={addItem} disabled={!newAddOnId}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Total */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Label>Total ($)</Label>
                <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={recalcTotal}>
                  Recalculate
                </Button>
              </div>
              <Input
                type="number"
                step="0.01"
                value={(totalCents / 100).toFixed(2)}
                onChange={(e) => setTotalCents(Math.round(parseFloat(e.target.value || "0") * 100))}
              />
            </div>

            {/* Comments */}
            <div className="space-y-1.5">
              <Label>Comments</Label>
              <Textarea value={comments} onChange={(e) => setComments(e.target.value)} rows={3} />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditOrderDialog;
