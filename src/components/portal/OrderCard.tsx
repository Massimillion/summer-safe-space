import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Package, CalendarDays, MapPin, Box, CreditCard, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import EditOrderDialog from "./EditOrderDialog";

interface OrderItemRow {
  id: string;
  description: string | null;
  quantity: number;
  price_cents: number;
}

interface PaymentRow {
  id: string;
  amount_cents: number;
  payment_type: string;
  description: string | null;
  created_at: string;
}

interface OrderData {
  id: string;
  created_at: string;
  status: string;
  storage_term: string;
  total_cents: number;
  comments: string | null;
  package_name: string | null;
  num_boxes: number | null;
  package_price_cents: number | null;
  dropoff_date: string | null;
  dropoff_time: string | null;
  pickup_date: string | null;
  pickup_time: string | null;
  dorm_name: string | null;
  items: OrderItemRow[];
  payments: PaymentRow[];
}

const statusLabels: Record<string, string> = {
  booked: "Booked",
  boxes_delivered: "Boxes Delivered",
  boxes_picked_up: "Picked Up",
  in_storage: "In Storage",
  delivered_back: "Delivered Back",
  cancelled: "Cancelled",
};

const statusColors: Record<string, string> = {
  booked: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  boxes_delivered: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  boxes_picked_up: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  in_storage: "bg-primary/10 text-primary",
  delivered_back: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  cancelled: "bg-destructive/10 text-destructive",
};

const formatDate = (d: string | null) => {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

interface OrderCardProps {
  order: OrderData;
  studentSchool?: string | null;
  onOrderUpdated?: () => void;
}

const OrderCard = ({ order, studentSchool, onOrderUpdated }: OrderCardProps) => {
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const totalPaid = order.payments.reduce((s, p) => s + p.amount_cents, 0);
  const balance = order.total_cents - totalPaid;
  const canEdit = order.status === "booked";

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="overflow-hidden">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle className="text-base">
                    {order.package_name || "Custom"} — {order.storage_term === "study_abroad" ? "Study Abroad" : "Summer"}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Ordered {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-muted-foreground hover:text-primary"
                    onClick={(e) => { e.stopPropagation(); setEditOpen(true); }}
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1" />
                    Edit
                  </Button>
                )}
                <Badge className={cn("border-0", statusColors[order.status] || "")}>
                  {statusLabels[order.status] || order.status}
                </Badge>
                <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="border-t border-border pt-4 space-y-5">
            {/* Schedule */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <CalendarDays className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Drop-off</p>
                  <p className="text-sm text-muted-foreground">{formatDate(order.dropoff_date)}</p>
                  {order.dropoff_time && <p className="text-xs text-muted-foreground">{order.dropoff_time}</p>}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CalendarDays className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Pick-up</p>
                  <p className="text-sm text-muted-foreground">{formatDate(order.pickup_date)}</p>
                  {order.pickup_time && <p className="text-xs text-muted-foreground">{order.pickup_time}</p>}
                </div>
              </div>
            </div>

            {/* Location */}
            {order.dorm_name && (
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Location</p>
                  <p className="text-sm text-muted-foreground">{order.dorm_name}</p>
                </div>
              </div>
            )}

            {/* Price Breakdown */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Box className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">Order Breakdown</p>
              </div>
              <div className="rounded-md border border-border">
                {/* Package line */}
                {order.package_name && (
                  <div className="flex justify-between px-3 py-2 text-sm">
                    <span className="text-foreground">
                      {order.package_name}
                      {order.num_boxes ? ` (${order.num_boxes} boxes)` : ""}
                    </span>
                    <span className="text-muted-foreground">
                      {order.package_price_cents != null ? `$${(order.package_price_cents / 100).toFixed(2)}` : "—"}
                    </span>
                  </div>
                )}
                {/* Add-on items */}
                {order.items.map((item) => (
                  <div key={item.id} className={cn("flex justify-between px-3 py-2 text-sm border-t border-border")}>
                    <span className="text-foreground">
                      {item.quantity > 1 && `${item.quantity}× `}
                      {item.description || "Item"}
                    </span>
                    <span className="text-muted-foreground">${(item.price_cents / 100).toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex justify-between px-3 py-2 text-sm font-medium border-t border-border bg-muted/30">
                  <span>Total</span>
                  <span>${(order.total_cents / 100).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payments */}
            {order.payments.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Payments</p>
                </div>
                <div className="rounded-md border border-border">
                  {order.payments.map((p, i) => (
                    <div key={p.id} className={cn("flex justify-between px-3 py-2 text-sm", i > 0 && "border-t border-border")}>
                      <span className="text-foreground">
                        {p.description || p.payment_type}{" "}
                        <span className="text-muted-foreground">· {new Date(p.created_at).toLocaleDateString()}</span>
                      </span>
                      <span className="text-primary font-medium">${(p.amount_cents / 100).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                {balance > 0 && (
                  <p className="text-sm text-destructive mt-1">Balance remaining: ${(balance / 100).toFixed(2)}</p>
                )}
              </div>
            )}

            {/* Comments */}
            {order.comments && (
              <div className="rounded-md bg-muted/30 p-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">Notes</p>
                <p className="text-sm text-foreground">{order.comments}</p>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default OrderCard;
export type { OrderData };
