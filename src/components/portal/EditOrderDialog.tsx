import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import type { OrderData } from "./OrderCard";

type Package = Tables<"packages">;
type AddOn = Tables<"add_ons">;

interface EditOrderDialogProps {
  order: OrderData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  studentSchool: string | null;
}

const EditOrderDialog = ({ order, open, onOpenChange, onSaved }: EditOrderDialogProps) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [packages, setPackages] = useState<Package[]>([]);
  const [addOns, setAddOns] = useState<AddOn[]>([]);

  const [packageId, setPackageId] = useState("");
  const [selectedAddOns, setSelectedAddOns] = useState<Record<string, number>>({});
  const [valetSelected, setValetSelected] = useState(false);

  // Load reference data
  useEffect(() => {
    if (!open) return;
    const fetchData = async () => {
      const [pkgRes, addOnRes] = await Promise.all([
        supabase.from("packages").select("*").eq("is_active", true).order("sort_order"),
        supabase.from("add_ons").select("*").eq("is_active", true).order("sort_order"),
      ]);
      if (pkgRes.data) setPackages(pkgRes.data);
      if (addOnRes.data) setAddOns(addOnRes.data);
    };
    fetchData();
  }, [open]);

  // Initialize form from order
  useEffect(() => {
    if (!open) return;
    const init = async () => {
      const { data: orderRow } = await supabase
        .from("orders")
        .select("package_id, storage_term")
        .eq("id", order.id)
        .single();

      if (orderRow) {
        setPackageId(orderRow.package_id || "");
      }

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

  // Display-only total (actual total is computed server-side)
  const calculateDisplayTotal = () => {
    let base = 0;
    if (selectedPackage) base += selectedPackage.price_cents;
    Object.entries(selectedAddOns).forEach(([id, qty]) => {
      const a = addOns.find((x) => x.id === id);
      if (a && qty > 0) base += a.price_cents * qty;
    });
    // Use the order's existing storage term for the multiplier
    if (order.storage_term === "study_abroad") base *= 2;
    if (valetSelected && valetAddOn) base += valetAddOn.price_cents;
    return base;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Delete existing order items, then re-insert (prices enforced by DB trigger)
      await supabase.from("order_items").delete().eq("order_id", order.id);

      const newItems: { order_id: string; add_on_id: string; quantity: number; price_cents: number; description: string }[] = [];
      Object.entries(selectedAddOns)
        .filter(([, qty]) => qty > 0)
        .forEach(([addOnId, qty]) => {
          const a = addOns.find((x) => x.id === addOnId)!;
          newItems.push({
            order_id: order.id,
            add_on_id: addOnId,
            quantity: qty,
            price_cents: a.price_cents * qty, // overwritten by trigger
            description: a.name,
          });
        });
      if (valetSelected && valetAddOn) {
        newItems.push({
          order_id: order.id,
          add_on_id: valetAddOn.id,
          quantity: 1,
          price_cents: valetAddOn.price_cents, // overwritten by trigger
          description: "Valet Service",
        });
      }
      if (newItems.length > 0) {
        const { error: itemErr } = await supabase.from("order_items").insert(newItems);
        if (itemErr) throw itemErr;
      }

      // Use secure RPC to update order (only safe fields, total recalculated server-side)
      const { error: rpcErr } = await supabase.rpc("update_order_details", {
        _order_id: order.id,
        _package_id: packageId || null,
      });
      if (rpcErr) throw rpcErr;

      toast({ title: "Order updated", description: "Your changes have been saved." });
      onOpenChange(false);
      onSaved();
    } catch (err: any) {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const displayTotal = calculateDisplayTotal();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Order</DialogTitle>
          <DialogDescription>Change your box package or add-on quantities. Prices are calculated automatically.</DialogDescription>
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
                {valetAddOn && (
                  <div className="text-xs text-primary">+${(valetAddOn.price_cents / 100).toFixed(0)}</div>
                )}
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
                    <span className="ml-2 text-xs text-primary">+${(addOn.price_cents / 100).toFixed(0)} each</span>
                  </div>
                  <Input
                    type="number"
                    min={0}
                    className="w-20"
                    value={selectedAddOns[addOn.id] || 0}
                    onChange={(e) =>
                      setSelectedAddOns({ ...selectedAddOns, [addOn.id]: Math.max(0, parseInt(e.target.value) || 0) })
                    }
                  />
                </div>
              ))}
            </div>
          )}

          {/* Estimated Total (read-only) */}
          <div className="rounded-lg bg-muted/50 p-3 flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Estimated Total</span>
            <span className="text-lg font-bold text-primary">${(displayTotal / 100).toFixed(2)}</span>
          </div>
          <p className="text-xs text-muted-foreground">Final price is confirmed server-side based on current catalog rates.</p>
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
