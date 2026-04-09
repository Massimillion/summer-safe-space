import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import type { OrderData } from "./OrderCard";

type Package = Tables<"packages">;
type AddOn = Tables<"add_ons">;
type AvailableDate = Tables<"available_dates">;

interface EditOrderDialogProps {
  order: OrderData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  studentSchool: string | null;
}

const EditOrderDialog = ({ order, open, onOpenChange, onSaved, studentSchool }: EditOrderDialogProps) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [packages, setPackages] = useState<Package[]>([]);
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [dropoffDates, setDropoffDates] = useState<AvailableDate[]>([]);
  const [pickupDates, setPickupDates] = useState<AvailableDate[]>([]);

  // Edit state
  const [packageId, setPackageId] = useState("");
  const [storageTerm, setStorageTerm] = useState("summer");
  const [dropoffDateId, setDropoffDateId] = useState("");
  const [pickupDateId, setPickupDateId] = useState("");
  const [comments, setComments] = useState("");
  const [selectedAddOns, setSelectedAddOns] = useState<Record<string, number>>({});
  const [valetSelected, setValetSelected] = useState(false);

  // Load reference data
  useEffect(() => {
    if (!open) return;
    const fetch = async () => {
      const [pkgRes, addOnRes, dateRes] = await Promise.all([
        supabase.from("packages").select("*").eq("is_active", true).order("sort_order"),
        supabase.from("add_ons").select("*").eq("is_active", true).order("sort_order"),
        supabase.from("available_dates").select("*").eq("is_active", true).order("available_date"),
      ]);
      if (pkgRes.data) setPackages(pkgRes.data);
      if (addOnRes.data) setAddOns(addOnRes.data);
      if (dateRes.data) {
        const school = studentSchool || "";
        setDropoffDates(dateRes.data.filter((d) => d.date_type === "dropoff" && d.school === school));
        setPickupDates(dateRes.data.filter((d) => d.date_type === "pickup" && d.school === school));
      }
    };
    fetch();
  }, [open, studentSchool]);

  // Initialize form from order
  useEffect(() => {
    if (!open) return;

    // We need to look up order's current package_id and date IDs from DB
    const init = async () => {
      const { data: orderRow } = await supabase
        .from("orders")
        .select("package_id, dropoff_date_id, pickup_date_id, storage_term, comments")
        .eq("id", order.id)
        .single();

      if (orderRow) {
        setPackageId(orderRow.package_id || "");
        setDropoffDateId(orderRow.dropoff_date_id || "");
        setPickupDateId(orderRow.pickup_date_id || "");
        setStorageTerm(orderRow.storage_term || "summer");
        setComments(orderRow.comments || "");
      }

      // Load existing order items to set add-on selections
      const { data: items } = await supabase
        .from("order_items")
        .select("add_on_id, quantity, description")
        .eq("order_id", order.id);

      const addOnMap: Record<string, number> = {};
      let hasValet = false;
      (items || []).forEach((item) => {
        if (item.description?.toLowerCase().includes("valet")) {
          hasValet = true;
        } else if (item.add_on_id) {
          addOnMap[item.add_on_id] = item.quantity;
        }
      });
      setSelectedAddOns(addOnMap);
      setValetSelected(hasValet);
    };
    init();
  }, [open, order.id]);

  const valetAddOn = addOns.find((a) => a.name.toLowerCase().includes("valet"));
  const regularAddOns = addOns.filter((a) => !a.name.toLowerCase().includes("valet"));
  const selectedPackage = packages.find((p) => p.id === packageId);

  const calculateTotal = () => {
    let base = 0;
    if (selectedPackage) base += selectedPackage.price_cents;
    Object.entries(selectedAddOns).forEach(([id, qty]) => {
      const a = addOns.find((x) => x.id === id);
      if (a && qty > 0) base += a.price_cents * qty;
    });
    if (storageTerm === "study_abroad") base *= 2;
    if (valetSelected && valetAddOn) base += valetAddOn.price_cents;
    return base;
  };

  const handleSave = async () => {
    setSaving(true);
    try {

      // Delete existing order items, then re-insert
      await supabase.from("order_items").delete().eq("order_id", order.id);

      const newItems: any[] = [];
      Object.entries(selectedAddOns)
        .filter(([, qty]) => qty > 0)
        .forEach(([addOnId, qty]) => {
          const a = addOns.find((x) => x.id === addOnId)!;
          newItems.push({
            order_id: order.id,
            add_on_id: addOnId,
            quantity: qty,
            price_cents: a.price_cents * qty,
            description: a.name,
          });
        });
      if (valetSelected && valetAddOn) {
        newItems.push({
          order_id: order.id,
          add_on_id: valetAddOn.id,
          quantity: 1,
          price_cents: valetAddOn.price_cents,
          description: "Valet Service",
        });
      }
      if (newItems.length > 0) {
        const { error: itemErr } = await supabase.from("order_items").insert(newItems);
        if (itemErr) throw itemErr;
      }

      toast({ title: "Order updated", description: "Your changes have been saved." });
      onOpenChange(false);
      onSaved();
    } catch (err: any) {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const total = calculateTotal();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Order</DialogTitle>
          <DialogDescription>Change your package, dates, add-ons, or comments.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Package */}
          <div className="space-y-2">
            <Label>Box Package</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {packages.map((pkg) => (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => setPackageId(pkg.id)}
                  className={`rounded-lg border p-3 text-left transition-colors ${
                    packageId === pkg.id ? "border-primary bg-accent" : "border-border hover:border-primary/40"
                  }`}
                >
                  <div className="font-semibold text-sm text-foreground">{pkg.name}</div>
                  <div className="text-xs text-muted-foreground">{pkg.num_boxes} boxes</div>
                  <div className="mt-1 font-bold text-primary">${(pkg.price_cents / 100).toFixed(0)}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Storage Term */}
          <div className="space-y-2">
            <Label>Storage Term</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setStorageTerm("summer")}
                className={`rounded-lg border p-3 text-left transition-colors ${
                  storageTerm === "summer" ? "border-primary bg-accent" : "border-border hover:border-primary/40"
                }`}
              >
                <div className="font-semibold text-sm text-foreground">Summer</div>
              </button>
              <button
                type="button"
                onClick={() => setStorageTerm("study_abroad")}
                className={`rounded-lg border p-3 text-left transition-colors ${
                  storageTerm === "study_abroad" ? "border-primary bg-accent" : "border-border hover:border-primary/40"
                }`}
              >
                <div className="font-semibold text-sm text-foreground">Summer + Study Abroad</div>
                <div className="text-xs text-primary">2× storage price</div>
              </button>
            </div>
          </div>

          {/* Service Type */}
          <div className="space-y-2">
            <Label>Service Type</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setValetSelected(false)}
                className={`rounded-lg border p-3 text-left transition-colors ${
                  !valetSelected ? "border-primary bg-accent" : "border-border hover:border-primary/40"
                }`}
              >
                <div className="font-semibold text-sm text-foreground">Standard</div>
                <div className="text-xs text-muted-foreground">Included</div>
              </button>
              <button
                type="button"
                onClick={() => setValetSelected(true)}
                className={`rounded-lg border p-3 text-left transition-colors ${
                  valetSelected ? "border-primary bg-accent" : "border-border hover:border-primary/40"
                }`}
              >
                <div className="font-semibold text-sm text-foreground">Valet Service</div>
                <div className="text-xs text-primary">+$300</div>
              </button>
            </div>
          </div>

          {/* Extra add-ons */}
          {regularAddOns.length > 0 && (
            <div className="space-y-2">
              <Label>Extra Items</Label>
              {regularAddOns.map((addOn) => (
                <div key={addOn.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                  <div>
                    <span className="text-sm font-medium text-foreground">{addOn.name}</span>
                    <span className="ml-2 text-xs text-primary">+${(addOn.price_cents / 100).toFixed(0)}</span>
                  </div>
                  <Input
                    type="number"
                    min={0}
                    className="w-20"
                    value={selectedAddOns[addOn.id] || 0}
                    onChange={(e) =>
                      setSelectedAddOns({ ...selectedAddOns, [addOn.id]: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
              ))}
            </div>
          )}

          {/* Dates */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Drop-off Date</Label>
              <Select value={dropoffDateId} onValueChange={setDropoffDateId}>
                <SelectTrigger><SelectValue placeholder="Select date" /></SelectTrigger>
                <SelectContent>
                  {dropoffDates.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {new Date(d.available_date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Pick-up Date</Label>
              <Select value={pickupDateId} onValueChange={setPickupDateId}>
                <SelectTrigger><SelectValue placeholder="Select date" /></SelectTrigger>
                <SelectContent>
                  {pickupDates.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {new Date(d.available_date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Comments */}
          <div className="space-y-2">
            <Label>Comments / Special Instructions</Label>
            <Textarea value={comments} onChange={(e) => setComments(e.target.value)} rows={3} />
          </div>

          {/* Total preview */}
          <div className="rounded-lg bg-muted/50 p-3 flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">New Total</span>
            <span className="text-lg font-bold text-primary">${(total / 100).toFixed(2)}</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !packageId}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditOrderDialog;
