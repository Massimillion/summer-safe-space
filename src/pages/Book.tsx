import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import DepositPayment from "@/components/DepositPayment";
import type { Tables } from "@/integrations/supabase/types";

type Package = Tables<"packages">;
type AddOn = Tables<"add_ons">;
type Dorm = Tables<"dorms">;
type AvailableDate = Tables<"available_dates">;

const STEPS = [
  "Student Info",
  "Parent Info",
  "School & Location",
  "Box Drop-Off Date",
  "Pickup Date",
  "Package Selection",
  "Comments",
  "Review",
  "Payment",
];

const Book = () => {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  // Form state
  const [studentInfo, setStudentInfo] = useState({ firstName: "", lastName: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [parentInfo, setParentInfo] = useState({ firstName: "", lastName: "", email: "", phone: "" });
  const [school, setSchool] = useState<"cu_boulder" | "du" | "">("");
  const [dormId, setDormId] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [dropoffDateId, setDropoffDateId] = useState("");
  const [pickupDateId, setPickupDateId] = useState("");
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [customBoxCount, setCustomBoxCount] = useState<number | null>(null);
  const [selectedAddOns, setSelectedAddOns] = useState<Record<string, number>>({});
  const [comments, setComments] = useState("");
  const [furnitureDescription, setFurnitureDescription] = useState("");
  const [valetSelected, setValetSelected] = useState(false);

  // Data from DB
  const [packages, setPackages] = useState<Package[]>([]);
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [dorms, setDorms] = useState<Dorm[]>([]);
  const [dropoffDates, setDropoffDates] = useState<AvailableDate[]>([]);
  const [pickupDates, setPickupDates] = useState<AvailableDate[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [pkgRes, addOnRes, dormRes, dateRes] = await Promise.all([
        supabase.from("packages").select("*").eq("is_active", true).order("sort_order"),
        supabase.from("add_ons").select("*").eq("is_active", true).order("sort_order"),
        supabase.from("dorms").select("*").eq("is_active", true).order("sort_order"),
        supabase.from("available_dates").select("*").eq("is_active", true).order("available_date"),
      ]);
      if (pkgRes.data) setPackages(pkgRes.data);
      if (addOnRes.data) setAddOns(addOnRes.data);
      if (dormRes.data) setDorms(dormRes.data);
      if (dateRes.data) {
        setDropoffDates(dateRes.data.filter((d) => d.date_type === "dropoff"));
        setPickupDates(dateRes.data.filter((d) => d.date_type === "pickup"));
      }
    };
    fetchData();
  }, []);

  const filteredDorms = dorms.filter((d) => d.school === school);
  const selectedDorm = dorms.find((d) => d.id === dormId);
  const requiresAddress = selectedDorm ? (selectedDorm as any).requires_address : false;
  const filteredDropoffDates = dropoffDates.filter((d) => d.school === school);
  const filteredPickupDates = pickupDates.filter((d) => d.school === school);

  const selectedPackage = packages.find((p) => p.id === selectedPackageId);

  // Separate valet add-on from regular add-ons
  const valetAddOn = addOns.find((a) => a.name.toLowerCase().includes("valet"));
  const regularAddOns = addOns.filter((a) => !a.name.toLowerCase().includes("valet"));

  const calculateTotal = () => {
    let total = 0;
    if (selectedPackage) total += selectedPackage.price_cents;
    if (valetSelected && valetAddOn) total += valetAddOn.price_cents;
    Object.entries(selectedAddOns).forEach(([addOnId, qty]) => {
      const addOn = addOns.find((a) => a.id === addOnId);
      if (addOn && qty > 0) total += addOn.price_cents * qty;
    });
    return total;
  };

  const canProceed = () => {
    switch (step) {
      case 0: return studentInfo.firstName && studentInfo.lastName && studentInfo.email && studentInfo.password.length >= 6 && studentInfo.password === studentInfo.confirmPassword;
      case 1: return parentInfo.firstName && parentInfo.lastName;
      case 2: return school && dormId && (requiresAddress ? addressLine : true);
      case 3: return dropoffDateId;
      case 4: return pickupDateId;
      case 5: return selectedPackageId || (customBoxCount && customBoxCount > 0);
      case 6: return true;
      case 7: return true;
      default: return false;
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // 1. Sign up user if not logged in
      let userId = user?.id;
      if (!userId) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: studentInfo.email,
          password: studentInfo.password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (authError) throw authError;
        userId = authData.user?.id;
      }
      if (!userId) throw new Error("Failed to create account");

      // 2. Check for existing student or create new one
      let student: any;
      const { data: existingStudent } = await supabase
        .from("students")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (existingStudent) {
        const { data: updated, error: updateError } = await supabase
          .from("students")
          .update({
            first_name: studentInfo.firstName,
            last_name: studentInfo.lastName,
            email: studentInfo.email,
            phone: studentInfo.phone || null,
            school: school as "cu_boulder" | "du",
            dorm_id: dormId || null,
            address_line: requiresAddress ? addressLine : null,
            is_off_campus: requiresAddress,
          })
          .eq("id", existingStudent.id)
          .select()
          .single();
        if (updateError) throw updateError;
        student = updated;
      } else {
        const { data: newStudent, error: studentError } = await supabase
          .from("students")
          .insert({
            user_id: userId,
            first_name: studentInfo.firstName,
            last_name: studentInfo.lastName,
            email: studentInfo.email,
            phone: studentInfo.phone || null,
            school: school as "cu_boulder" | "du",
            dorm_id: dormId || null,
            address_line: requiresAddress ? addressLine : null,
            is_off_campus: requiresAddress,
          })
          .select()
          .single();
        if (studentError) throw studentError;
        student = newStudent;
      }

      // 3. Create parent record
      await supabase.from("parents").insert({
        student_id: student.id,
        first_name: parentInfo.firstName,
        last_name: parentInfo.lastName,
        email: parentInfo.email || null,
        phone: parentInfo.phone || null,
      });

      // 4. Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          student_id: student.id,
          package_id: selectedPackageId || null,
          custom_box_count: customBoxCount,
          dropoff_date_id: dropoffDateId || null,
          pickup_date_id: pickupDateId || null,
          comments: [comments, furnitureDescription ? `Furniture items: ${furnitureDescription}` : ""].filter(Boolean).join("\n") || null,
          total_cents: calculateTotal(),
        })
        .select()
        .single();
      if (orderError) throw orderError;

      // 5. Create order items for add-ons + valet
      const orderItems = Object.entries(selectedAddOns)
        .filter(([, qty]) => qty > 0)
        .map(([addOnId, qty]) => {
          const addOn = addOns.find((a) => a.id === addOnId)!;
          return {
            order_id: order.id,
            add_on_id: addOnId,
            quantity: qty,
            price_cents: addOn.price_cents * qty,
            description: addOn.name,
          };
        });
      if (valetSelected && valetAddOn) {
        orderItems.push({
          order_id: order.id,
          add_on_id: valetAddOn.id,
          quantity: 1,
          price_cents: valetAddOn.price_cents,
          description: "Valet Service",
        });
      }
      if (orderItems.length > 0) {
        await supabase.from("order_items").insert(orderItems);
      }

      // 6. Create PaymentIntent for embedded deposit payment
      const { data: piData, error: piError } = await supabase.functions.invoke(
        "create-payment-intent",
        { body: { orderId: order.id } }
      );
      if (piError) throw piError;
      if (piData?.error) throw new Error(piData.error);

      setClientSecret(piData.clientSecret);
      setOrderId(order.id);
      setStep(8); // Move to payment step
    } catch (err: any) {
      toast({ title: "Booking failed", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentSuccess = () => {
    setPaymentSuccess(true);
    navigate("/payment-success?order_id=" + orderId);
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container max-w-2xl">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            {STEPS.map((s, i) => (
              <div
                key={i}
                className={`hidden text-center sm:block ${i <= step ? "text-primary font-medium" : ""}`}
              >
                {s}
              </div>
            ))}
          </div>
          <div className="mt-2 h-2 rounded-full bg-secondary">
            <div
              className="h-2 rounded-full bg-primary transition-all"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-muted-foreground sm:hidden">
            Step {step + 1} of {STEPS.length}: {STEPS[step]}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-xl">{STEPS[step]}</CardTitle>
            <CardDescription>
              {step === 0 && "Tell us about yourself"}
              {step === 1 && "Parent or guardian contact info"}
              {step === 2 && "Where should we deliver and pick up?"}
              {step === 3 && "When should we drop off your empty boxes?"}
              {step === 4 && "When should we pick up your packed boxes?"}
              {step === 5 && "Choose your storage package and add-ons"}
              {step === 6 && "Any special instructions?"}
              {step === 7 && "Review your order"}
              {step === 8 && "Enter your payment details"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Step 0: Student Info */}
            {step === 0 && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>First Name *</Label>
                    <Input value={studentInfo.firstName} onChange={(e) => setStudentInfo({ ...studentInfo, firstName: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name *</Label>
                    <Input value={studentInfo.lastName} onChange={(e) => setStudentInfo({ ...studentInfo, lastName: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input type="email" value={studentInfo.email} onChange={(e) => setStudentInfo({ ...studentInfo, email: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input type="tel" value={studentInfo.phone} onChange={(e) => setStudentInfo({ ...studentInfo, phone: e.target.value })} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Password *</Label>
                    <Input type="password" placeholder="Min 6 characters" value={studentInfo.password} onChange={(e) => setStudentInfo({ ...studentInfo, password: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Confirm Password *</Label>
                    <Input type="password" placeholder="Re-enter password" value={studentInfo.confirmPassword} onChange={(e) => setStudentInfo({ ...studentInfo, confirmPassword: e.target.value })} />
                  </div>
                </div>
                {studentInfo.password && studentInfo.confirmPassword && studentInfo.password !== studentInfo.confirmPassword && (
                  <p className="text-sm text-destructive">Passwords do not match</p>
                )}
                {studentInfo.password && studentInfo.password.length < 6 && (
                  <p className="text-sm text-destructive">Password must be at least 6 characters</p>
                )}
              </>
            )}

            {/* Step 1: Parent Info */}
            {step === 1 && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>First Name *</Label>
                    <Input value={parentInfo.firstName} onChange={(e) => setParentInfo({ ...parentInfo, firstName: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name *</Label>
                    <Input value={parentInfo.lastName} onChange={(e) => setParentInfo({ ...parentInfo, lastName: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={parentInfo.email} onChange={(e) => setParentInfo({ ...parentInfo, email: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input type="tel" value={parentInfo.phone} onChange={(e) => setParentInfo({ ...parentInfo, phone: e.target.value })} />
                </div>
              </>
            )}

            {/* Step 2: School & Location */}
            {step === 2 && (
              <>
                <div className="space-y-2">
                  <Label>School *</Label>
                  <Select value={school} onValueChange={(v) => { setSchool(v as any); setDormId(""); setAddressLine(""); }}>
                    <SelectTrigger><SelectValue placeholder="Select your school" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cu_boulder">CU Boulder</SelectItem>
                      <SelectItem value="du">University of Denver</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {school && (
                  <div className="space-y-2">
                    <Label>Location *</Label>
                    <Select value={dormId} onValueChange={(v) => { setDormId(v); setAddressLine(""); }}>
                      <SelectTrigger><SelectValue placeholder="Select your location" /></SelectTrigger>
                      <SelectContent>
                        {filteredDorms.length === 0 && (
                          <SelectItem value="none" disabled>No locations configured yet</SelectItem>
                        )}
                        {filteredDorms.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            <div className="flex flex-col">
                              <span>{d.name}</span>
                              {(d as any).description && (
                                <span className="text-xs text-muted-foreground">{(d as any).description}</span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {requiresAddress && (
                  <div className="space-y-2">
                    <Label>{school === "cu_boulder" ? "Apartment Name & Address *" : "Address *"}</Label>
                    <Input value={addressLine} onChange={(e) => setAddressLine(e.target.value)} placeholder={school === "cu_boulder" ? "e.g. Bear Creek Apartments, 123 Main St" : "e.g. 123 Main St, Apt 4B"} />
                  </div>
                )}
              </>
            )}

            {/* Step 3: Drop-off Date */}
            {step === 3 && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Empty Box Drop-Off Date *</Label>
                  <Select value={dropoffDateId} onValueChange={setDropoffDateId}>
                    <SelectTrigger><SelectValue placeholder="Select a date" /></SelectTrigger>
                    <SelectContent>
                      {filteredDropoffDates.length === 0 && (
                        <SelectItem value="none" disabled>No dates available yet</SelectItem>
                      )}
                      {filteredDropoffDates.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {new Date(d.available_date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-sm text-muted-foreground rounded-md bg-accent px-3 py-2">
                  📦 All drop-off times are <span className="font-medium text-foreground">9am – 12pm</span>
                </p>
              </div>
            )}

            {/* Step 4: Pickup Date */}
            {step === 4 && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Full Box Pickup Date *</Label>
                  <Select value={pickupDateId} onValueChange={setPickupDateId}>
                    <SelectTrigger><SelectValue placeholder="Select a date" /></SelectTrigger>
                    <SelectContent>
                      {filteredPickupDates.length === 0 && (
                        <SelectItem value="none" disabled>No dates available yet</SelectItem>
                      )}
                      {filteredPickupDates.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {new Date(d.available_date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-sm text-muted-foreground rounded-md bg-accent px-3 py-2">
                  🚚 All pickup times are <span className="font-medium text-foreground">9am – 12pm</span>
                </p>
              </div>
            )}

            {/* Step 5: Package Selection */}
            {step === 5 && (
              <>
                <Label>Box Package *</Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {packages.map((pkg) => (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => { setSelectedPackageId(pkg.id); setCustomBoxCount(null); }}
                      className={`rounded-lg border p-4 text-left transition-colors ${
                        selectedPackageId === pkg.id ? "border-primary bg-accent" : "border-border hover:border-primary/40"
                      }`}
                    >
                      <div className="font-display font-semibold text-foreground">{pkg.name}</div>
                      <div className="text-sm text-muted-foreground">{pkg.num_boxes} boxes</div>
                      <div className="mt-1 font-display text-lg font-bold text-primary">
                        ${(pkg.price_cents / 100).toFixed(0)}
                      </div>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => { setSelectedPackageId(""); setCustomBoxCount(customBoxCount || 1); }}
                    className={`rounded-lg border p-4 text-left transition-colors ${
                      !selectedPackageId && customBoxCount ? "border-primary bg-accent" : "border-border hover:border-primary/40"
                    }`}
                  >
                    <div className="font-display font-semibold text-foreground">Custom</div>
                    <div className="text-sm text-muted-foreground">Choose your own count</div>
                  </button>
                </div>

                {!selectedPackageId && customBoxCount !== null && (
                  <div className="space-y-2">
                    <Label>Number of Boxes</Label>
                    <Input
                      type="number"
                      min={1}
                      value={customBoxCount || ""}
                      onChange={(e) => setCustomBoxCount(parseInt(e.target.value) || null)}
                    />
                  </div>
                )}

                {/* Valet Service Choice */}
                <Label className="mt-6 block">Service Type</Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setValetSelected(false)}
                    className={`rounded-lg border p-4 text-left transition-colors ${
                      !valetSelected ? "border-primary bg-accent" : "border-border hover:border-primary/40"
                    }`}
                  >
                    <div className="font-display font-semibold text-foreground">Standard</div>
                    <div className="text-sm text-muted-foreground">You bring items to the pickup location</div>
                    <div className="mt-1 font-display text-lg font-bold text-primary">Included</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setValetSelected(true)}
                    className={`rounded-lg border p-4 text-left transition-colors ${
                      valetSelected ? "border-primary bg-accent" : "border-border hover:border-primary/40"
                    }`}
                  >
                    <div className="font-display font-semibold text-foreground">Valet Service</div>
                    <div className="text-sm text-muted-foreground">We come to your room &amp; move everything out with you</div>
                    <div className="mt-1 font-display text-lg font-bold text-primary">+$300</div>
                  </button>
                </div>

                {regularAddOns.length > 0 && (() => {
                  const boxes = regularAddOns.filter(a => a.name.toLowerCase().includes("box"));
                  const others = regularAddOns.filter(a => !a.name.toLowerCase().includes("box"));
                  const renderAddOn = (addOn: AddOn) => (
                    <div key={addOn.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                      <div>
                        <span className="font-medium text-foreground">{addOn.name}</span>
                        <span className="ml-2 text-sm text-primary">+${(addOn.price_cents / 100).toFixed(0)}</span>
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
                  );
                  return (
                    <div className="space-y-4">
                      {boxes.length > 0 && (
                        <div>
                          <Label className="mt-6 mb-2 block">📦 Extra Boxes</Label>
                          <div className="space-y-2">{boxes.map(renderAddOn)}</div>
                        </div>
                      )}
                      {others.length > 0 && (
                        <div>
                          <Label className="mt-4 mb-2 block">🏠 Special Items</Label>
                          <div className="space-y-2">{others.map(renderAddOn)}</div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                    {/* Show furniture description box if any furniture add-on is selected */}
                    {addOns.some(
                      (a) =>
                        (a.name.toLowerCase().includes("furniture") || a.name.toLowerCase().includes("person carry")) &&
                        (selectedAddOns[a.id] || 0) > 0
                    ) && (
                      <div className="space-y-2">
                        <Label>Please describe your furniture item(s) *</Label>
                        <Textarea
                          value={furnitureDescription}
                          onChange={(e) => setFurnitureDescription(e.target.value)}
                          placeholder="e.g. IKEA desk, standing lamp, small bookshelf..."
                          rows={3}
                        />
                      </div>
                    )}
              </>
            )}

            {/* Step 6: Comments */}
            {step === 6 && (
              <div className="space-y-2">
                <Label>Special Instructions (optional)</Label>
                <Textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Anything we should know? Fragile items, access instructions, etc."
                  rows={5}
                />
              </div>
            )}

            {/* Step 7: Review */}
            {step === 7 && (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground">Student</h4>
                    <p className="text-foreground">{studentInfo.firstName} {studentInfo.lastName}</p>
                    <p className="text-sm text-muted-foreground">{studentInfo.email}</p>
                    {studentInfo.phone && <p className="text-sm text-muted-foreground">{studentInfo.phone}</p>}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground">Parent / Guardian</h4>
                    <p className="text-foreground">{parentInfo.firstName} {parentInfo.lastName}</p>
                    {parentInfo.email && <p className="text-sm text-muted-foreground">{parentInfo.email}</p>}
                    {parentInfo.phone && <p className="text-sm text-muted-foreground">{parentInfo.phone}</p>}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground">School & Location</h4>
                  <p className="text-foreground">{school === "cu_boulder" ? "CU Boulder" : "University of Denver"}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedDorm?.name || "—"}
                    {requiresAddress && addressLine && ` — ${addressLine}`}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground">Package</h4>
                  <p className="text-foreground">
                    {selectedPackage ? `${selectedPackage.name} (${selectedPackage.num_boxes} boxes)` : `Custom: ${customBoxCount} boxes`}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground">Service Type</h4>
                  <p className="text-foreground">{valetSelected ? "Valet Service (+$300)" : "Standard (self drop-off)"}</p>
                </div>

                {Object.entries(selectedAddOns).filter(([, qty]) => qty > 0).length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground">Add-Ons</h4>
                    {Object.entries(selectedAddOns)
                      .filter(([, qty]) => qty > 0)
                      .map(([id, qty]) => {
                        const addOn = addOns.find((a) => a.id === id)!;
                        return (
                          <p key={id} className="text-sm text-foreground">
                            {addOn.name} × {qty} — ${((addOn.price_cents * qty) / 100).toFixed(0)}
                          </p>
                        );
                      })}
                  </div>
                )}

                {comments && (
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground">Comments</h4>
                    <p className="text-sm text-foreground">{comments}</p>
                  </div>
                )}

                <div className="rounded-lg bg-primary/10 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Estimated Total</span>
                    <span className="font-display text-lg font-semibold text-foreground">
                      ${(calculateTotal() / 100).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-primary/20 pt-2">
                    <span className="font-display text-lg font-semibold text-foreground">Deposit Due Today</span>
                    <span className="font-display text-2xl font-bold text-primary">$50.00</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Remaining Balance</span>
                    <span className="text-sm font-medium text-foreground">
                      ${(Math.max(0, calculateTotal() - 5000) / 100).toFixed(2)}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground rounded-md bg-accent px-3 py-2">
                  💳 Your card will be saved on file. The remaining balance will be charged once we've picked up and verified your items.
                </p>
              </div>
            )}

            {/* Step 8: Embedded Payment */}
            {step === 8 && clientSecret && orderId && (
              <div className="space-y-4">
                <div className="rounded-lg bg-primary/10 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Estimated Total</span>
                    <span className="font-display text-lg font-semibold text-foreground">
                      ${(calculateTotal() / 100).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-primary/20 pt-2">
                    <span className="font-display text-lg font-semibold text-foreground">Deposit Due Today</span>
                    <span className="font-display text-2xl font-bold text-primary">$50.00</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground rounded-md bg-accent px-3 py-2">
                  💳 Your card will be saved on file. The remaining balance will be charged after pickup.
                </p>
                <DepositPayment
                  clientSecret={clientSecret}
                  orderId={orderId}
                  onSuccess={handlePaymentSuccess}
                />
              </div>
            )}

            {/* Navigation */}
            {step < 8 && (
              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                  disabled={step === 0}
                >
                  <ArrowLeft className="mr-1 h-4 w-4" /> Back
                </Button>

                {step < 7 ? (
                  <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
                    Next <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                ) : (
                  <Button onClick={handleSubmit} disabled={submitting}>
                    {submitting ? (
                      <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Saving…</>
                    ) : (
                      <>Continue to Payment <ArrowRight className="ml-1 h-4 w-4" /></>
                    )}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Book;
