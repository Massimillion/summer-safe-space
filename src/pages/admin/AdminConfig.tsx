import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Pkg = Tables<"packages">;
type AddOn = Tables<"add_ons">;
type Dorm = Tables<"dorms">;

const AdminConfig = () => {
  const [packages, setPackages] = useState<Pkg[]>([]);
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [dorms, setDorms] = useState<Dorm[]>([]);
  const { toast } = useToast();

  // Package form
  const [pkgDialog, setPkgDialog] = useState(false);
  const [editPkgId, setEditPkgId] = useState<string | null>(null);
  const [pkgName, setPkgName] = useState("");
  const [pkgDesc, setPkgDesc] = useState("");
  const [pkgBoxes, setPkgBoxes] = useState("2");
  const [pkgPrice, setPkgPrice] = useState("");
  const [pkgOrder, setPkgOrder] = useState("0");

  // Add-on form
  const [addOnDialog, setAddOnDialog] = useState(false);
  const [editAddOnId, setEditAddOnId] = useState<string | null>(null);
  const [addOnName, setAddOnName] = useState("");
  const [addOnPrice, setAddOnPrice] = useState("");

  // Dorm form
  const [dormDialog, setDormDialog] = useState(false);
  const [dormName, setDormName] = useState("");
  const [dormSchool, setDormSchool] = useState<"cu_boulder" | "du">("cu_boulder");

  const fetchAll = async () => {
    const [p, a, d] = await Promise.all([
      supabase.from("packages").select("*").order("sort_order"),
      supabase.from("add_ons").select("*").order("sort_order"),
      supabase.from("dorms").select("*").order("school").order("name"),
    ]);
    if (p.data) setPackages(p.data);
    if (a.data) setAddOns(a.data);
    if (d.data) setDorms(d.data);
  };

  useEffect(() => { fetchAll(); }, []);

  // Package CRUD
  const openPkgEdit = (pkg: Pkg) => {
    setEditPkgId(pkg.id);
    setPkgName(pkg.name);
    setPkgDesc(pkg.description || "");
    setPkgBoxes(String(pkg.num_boxes));
    setPkgPrice(String(pkg.price_cents / 100));
    setPkgOrder(String(pkg.sort_order));
    setPkgDialog(true);
  };

  const savePkg = async () => {
    const data = {
      name: pkgName,
      description: pkgDesc || null,
      num_boxes: parseInt(pkgBoxes) || 2,
      price_cents: Math.round(parseFloat(pkgPrice) * 100) || 0,
      sort_order: parseInt(pkgOrder) || 0,
    };
    if (editPkgId) {
      await supabase.from("packages").update(data).eq("id", editPkgId);
    } else {
      await supabase.from("packages").insert(data);
    }
    toast({ title: editPkgId ? "Package updated" : "Package added" });
    setPkgDialog(false);
    setEditPkgId(null);
    setPkgName(""); setPkgDesc(""); setPkgBoxes("2"); setPkgPrice(""); setPkgOrder("0");
    fetchAll();
  };

  const deletePkg = async (id: string) => {
    await supabase.from("packages").update({ is_active: false }).eq("id", id);
    toast({ title: "Package deactivated" });
    fetchAll();
  };

  // Add-on CRUD
  const openAddOnEdit = (a: AddOn) => {
    setEditAddOnId(a.id);
    setAddOnName(a.name);
    setAddOnPrice(String(a.price_cents / 100));
    setAddOnDialog(true);
  };

  const saveAddOn = async () => {
    const data = { name: addOnName, price_cents: Math.round(parseFloat(addOnPrice) * 100) || 0 };
    if (editAddOnId) {
      await supabase.from("add_ons").update(data).eq("id", editAddOnId);
    } else {
      await supabase.from("add_ons").insert(data);
    }
    toast({ title: editAddOnId ? "Add-on updated" : "Add-on added" });
    setAddOnDialog(false);
    setEditAddOnId(null);
    setAddOnName(""); setAddOnPrice("");
    fetchAll();
  };

  const deleteAddOn = async (id: string) => {
    await supabase.from("add_ons").update({ is_active: false }).eq("id", id);
    toast({ title: "Add-on deactivated" });
    fetchAll();
  };

  // Dorm CRUD
  const saveDorm = async () => {
    await supabase.from("dorms").insert({ name: dormName, school: dormSchool });
    toast({ title: "Dorm added" });
    setDormDialog(false);
    setDormName("");
    fetchAll();
  };

  const deleteDorm = async (id: string) => {
    await supabase.from("dorms").update({ is_active: false }).eq("id", id);
    toast({ title: "Dorm deactivated" });
    fetchAll();
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Configuration</h1>

      <Tabs defaultValue="packages">
        <TabsList>
          <TabsTrigger value="packages">Packages</TabsTrigger>
          <TabsTrigger value="addons">Add-Ons</TabsTrigger>
          <TabsTrigger value="dorms">Dorms</TabsTrigger>
        </TabsList>

        {/* Packages */}
        <TabsContent value="packages" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={pkgDialog} onOpenChange={(o) => { setPkgDialog(o); if (!o) setEditPkgId(null); }}>
              <DialogTrigger asChild>
                <Button onClick={() => { setEditPkgId(null); setPkgName(""); setPkgDesc(""); setPkgBoxes("2"); setPkgPrice(""); setPkgOrder("0"); }}>
                  <Plus className="mr-1 h-4 w-4" /> Add Package
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle className="font-display">{editPkgId ? "Edit" : "Add"} Package</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-1"><Label>Name</Label><Input value={pkgName} onChange={(e) => setPkgName(e.target.value)} /></div>
                  <div className="space-y-1"><Label>Description</Label><Textarea value={pkgDesc} onChange={(e) => setPkgDesc(e.target.value)} rows={2} /></div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="space-y-1"><Label>Boxes</Label><Input type="number" value={pkgBoxes} onChange={(e) => setPkgBoxes(e.target.value)} /></div>
                    <div className="space-y-1"><Label>Price ($)</Label><Input type="number" step="0.01" value={pkgPrice} onChange={(e) => setPkgPrice(e.target.value)} /></div>
                    <div className="space-y-1"><Label>Sort Order</Label><Input type="number" value={pkgOrder} onChange={(e) => setPkgOrder(e.target.value)} /></div>
                  </div>
                  <Button onClick={savePkg} className="w-full">Save</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Boxes</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {packages.map((pkg) => (
                    <TableRow key={pkg.id}>
                      <TableCell className="font-medium">{pkg.name}</TableCell>
                      <TableCell>{pkg.num_boxes}</TableCell>
                      <TableCell>${(pkg.price_cents / 100).toFixed(0)}</TableCell>
                      <TableCell><Badge variant={pkg.is_active ? "default" : "secondary"}>{pkg.is_active ? "Active" : "Inactive"}</Badge></TableCell>
                      <TableCell className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openPkgEdit(pkg)}><Pencil className="h-4 w-4" /></Button>
                        {pkg.is_active && <Button variant="ghost" size="icon" onClick={() => deletePkg(pkg.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                      </TableCell>
                    </TableRow>
                  ))}
                  {packages.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No packages</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Add-Ons */}
        <TabsContent value="addons" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={addOnDialog} onOpenChange={(o) => { setAddOnDialog(o); if (!o) setEditAddOnId(null); }}>
              <DialogTrigger asChild>
                <Button onClick={() => { setEditAddOnId(null); setAddOnName(""); setAddOnPrice(""); }}>
                  <Plus className="mr-1 h-4 w-4" /> Add Add-On
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle className="font-display">{editAddOnId ? "Edit" : "Add"} Add-On</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-1"><Label>Name</Label><Input value={addOnName} onChange={(e) => setAddOnName(e.target.value)} /></div>
                  <div className="space-y-1"><Label>Price ($)</Label><Input type="number" step="0.01" value={addOnPrice} onChange={(e) => setAddOnPrice(e.target.value)} /></div>
                  <Button onClick={saveAddOn} className="w-full">Save</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {addOns.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.name}</TableCell>
                      <TableCell>${(a.price_cents / 100).toFixed(0)}</TableCell>
                      <TableCell><Badge variant={a.is_active ? "default" : "secondary"}>{a.is_active ? "Active" : "Inactive"}</Badge></TableCell>
                      <TableCell className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openAddOnEdit(a)}><Pencil className="h-4 w-4" /></Button>
                        {a.is_active && <Button variant="ghost" size="icon" onClick={() => deleteAddOn(a.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                      </TableCell>
                    </TableRow>
                  ))}
                  {addOns.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No add-ons</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dorms */}
        <TabsContent value="dorms" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={dormDialog} onOpenChange={setDormDialog}>
              <DialogTrigger asChild>
                <Button><Plus className="mr-1 h-4 w-4" /> Add Dorm</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle className="font-display">Add Dorm / Building</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label>School</Label>
                    <Select value={dormSchool} onValueChange={(v) => setDormSchool(v as any)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cu_boulder">CU Boulder</SelectItem>
                        <SelectItem value="du">DU</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1"><Label>Name</Label><Input value={dormName} onChange={(e) => setDormName(e.target.value)} /></div>
                  <Button onClick={saveDorm} className="w-full">Add</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>School</TableHead>
                    <TableHead>Dorm / Building</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dorms.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell>{d.school === "cu_boulder" ? "CU Boulder" : "DU"}</TableCell>
                      <TableCell className="font-medium">{d.name}</TableCell>
                      <TableCell><Badge variant={d.is_active ? "default" : "secondary"}>{d.is_active ? "Active" : "Inactive"}</Badge></TableCell>
                      <TableCell>
                        {d.is_active && <Button variant="ghost" size="icon" onClick={() => deleteDorm(d.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                      </TableCell>
                    </TableRow>
                  ))}
                  {dorms.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No dorms</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminConfig;
