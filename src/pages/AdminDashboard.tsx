import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Plus, Trash2, Pencil, Upload, Loader2 } from "lucide-react";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

type Property = {
  id: string;
  name: string;
  location: string;
  description: string | null;
  cover_image_url: string | null;
  features: string[];
  near_cut: boolean;
  near_ufs: boolean;
  water_electricity: boolean;
  wifi: boolean;
  security_cameras: boolean;
  payment_options: string[];
  gender: string;
};

type Unit = { id: string; name: string; description: string | null; property_id: string };

type Room = {
  id: string;
  unit_id: string;
  name: string;
  room_type: string;
  monthly_price: number | null;
  is_occupied: boolean;
  features: string[];
  image_urls: string[];
  walkthrough_video_url: string | null;
};

const PAYMENTS = ["NSFAS", "Cash", "Other"];
const SIGN_EXPIRY = 60 * 60 * 24 * 365;

const emptyProperty: Omit<Property, "id"> = {
  name: "", location: "", description: "", cover_image_url: null,
  features: [], near_cut: false, near_ufs: false, water_electricity: false,
  wifi: false, security_cameras: false, payment_options: [], gender: "any",
};

const emptyRoom: Omit<Room, "id" | "unit_id"> = {
  name: "", room_type: "single", monthly_price: null, is_occupied: false,
  features: [], image_urls: [], walkthrough_video_url: null,
};

async function uploadToBucket(file: File, prefix: string): Promise<string | null> {
  const ext = file.name.split(".").pop();
  const path = `${prefix}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("property-media").upload(path, file);
  if (error) { toast({ title: "Upload failed", description: error.message, variant: "destructive" }); return null; }
  const { data } = await supabase.storage.from("property-media").createSignedUrl(path, SIGN_EXPIRY);
  return data?.signedUrl ?? null;
}

const AdminDashboard = () => {
  const { user, isAdmin, loading } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedPropId, setSelectedPropId] = useState<string | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);

  const [propDialog, setPropDialog] = useState(false);
  const [editingProp, setEditingProp] = useState<Property | (Omit<Property, "id"> & { id?: string })>(emptyProperty);
  const [unitDialog, setUnitDialog] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Partial<Unit>>({ name: "", description: "" });
  const [roomDialog, setRoomDialog] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Partial<Room>>({ ...emptyRoom });

  const refresh = async () => {
    const [{ data: p }, { data: u }, { data: r }] = await Promise.all([
      supabase.from("properties").select("*").order("name"),
      supabase.from("units").select("*").order("name"),
      supabase.from("rooms").select("*").order("name"),
    ]);
    setProperties((p as Property[]) ?? []);
    setUnits((u as Unit[]) ?? []);
    setRooms((r as Room[]) ?? []);
  };

  useEffect(() => { if (isAdmin) refresh(); }, [isAdmin]);

  if (loading) return <Layout><div className="py-20 text-center">Loading…</div></Layout>;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Layout><div className="py-20 text-center text-muted-foreground">Admin access required.</div></Layout>;

  const propertyUnits = units.filter((u) => u.property_id === selectedPropId);
  const unitRooms = rooms.filter((r) => r.unit_id === selectedUnitId);

  // --- Property handlers ---
  const saveProperty = async () => {
    const payload = {
      name: editingProp.name, location: editingProp.location,
      description: editingProp.description || null, cover_image_url: editingProp.cover_image_url,
      features: editingProp.features, near_cut: editingProp.near_cut, near_ufs: editingProp.near_ufs,
      water_electricity: editingProp.water_electricity, wifi: editingProp.wifi,
      security_cameras: editingProp.security_cameras, payment_options: editingProp.payment_options,
      gender: editingProp.gender,
    };
    const { error } = editingProp.id
      ? await supabase.from("properties").update(payload).eq("id", editingProp.id)
      : await supabase.from("properties").insert(payload);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    toast({ title: "Saved" });
    setPropDialog(false); refresh();
  };
  const deleteProperty = async (id: string) => {
    if (!confirm("Delete property and all its units/rooms?")) return;
    const { error } = await supabase.from("properties").delete().eq("id", id);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    if (selectedPropId === id) { setSelectedPropId(null); setSelectedUnitId(null); }
    refresh();
  };

  // --- Unit handlers ---
  const saveUnit = async () => {
    if (!selectedPropId && !editingUnit.id) return;
    const payload = {
      name: editingUnit.name || "",
      description: editingUnit.description || null,
      property_id: editingUnit.property_id ?? selectedPropId!,
    };
    const { error } = editingUnit.id
      ? await supabase.from("units").update(payload).eq("id", editingUnit.id)
      : await supabase.from("units").insert(payload);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    setUnitDialog(false); refresh();
  };
  const deleteUnit = async (id: string) => {
    if (!confirm("Delete unit and all its rooms?")) return;
    await supabase.from("units").delete().eq("id", id);
    if (selectedUnitId === id) setSelectedUnitId(null);
    refresh();
  };

  // --- Room handlers ---
  const saveRoom = async () => {
    if (!selectedUnitId && !editingRoom.id) return;
    const payload = {
      name: editingRoom.name || "",
      room_type: editingRoom.room_type || "single",
      monthly_price: editingRoom.monthly_price ?? null,
      is_occupied: !!editingRoom.is_occupied,
      features: editingRoom.features ?? [],
      image_urls: editingRoom.image_urls ?? [],
      walkthrough_video_url: editingRoom.walkthrough_video_url ?? null,
      unit_id: editingRoom.unit_id ?? selectedUnitId!,
    };
    const { error } = editingRoom.id
      ? await supabase.from("rooms").update(payload).eq("id", editingRoom.id)
      : await supabase.from("rooms").insert(payload);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    setRoomDialog(false); refresh();
  };
  const deleteRoom = async (id: string) => {
    if (!confirm("Delete room?")) return;
    await supabase.from("rooms").delete().eq("id", id);
    refresh();
  };

  return (
    <Layout>
      <section className="container mx-auto px-4 py-10">
        <h1 className="mb-2 text-3xl font-bold">Admin CMS</h1>
        <p className="mb-8 text-muted-foreground">Manage properties, units, rooms, and media.</p>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* PROPERTIES */}
          <div className="rounded-xl border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">Properties</h2>
              <Button size="sm" onClick={() => { setEditingProp({ ...emptyProperty }); setPropDialog(true); }}>
                <Plus className="mr-1 h-4 w-4" /> New
              </Button>
            </div>
            <div className="space-y-2">
              {properties.map((p) => (
                <div
                  key={p.id}
                  onClick={() => { setSelectedPropId(p.id); setSelectedUnitId(null); }}
                  className={`flex items-center justify-between rounded-lg border p-3 cursor-pointer ${selectedPropId === p.id ? "border-primary bg-accent" : "hover:bg-muted"}`}
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium">{p.name}</div>
                    <div className="truncate text-xs text-muted-foreground">{p.location}</div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setEditingProp(p); setPropDialog(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); deleteProperty(p.id); }}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
              {properties.length === 0 && <p className="text-sm text-muted-foreground">No properties yet.</p>}
            </div>
          </div>

          {/* UNITS */}
          <div className="rounded-xl border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">Units</h2>
              <Button size="sm" disabled={!selectedPropId} onClick={() => { setEditingUnit({ name: "", description: "" }); setUnitDialog(true); }}>
                <Plus className="mr-1 h-4 w-4" /> New
              </Button>
            </div>
            {!selectedPropId ? (
              <p className="text-sm text-muted-foreground">Select a property to manage its units.</p>
            ) : (
              <div className="space-y-2">
                {propertyUnits.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => setSelectedUnitId(u.id)}
                    className={`flex items-center justify-between rounded-lg border p-3 cursor-pointer ${selectedUnitId === u.id ? "border-primary bg-accent" : "hover:bg-muted"}`}
                  >
                    <div className="truncate font-medium">{u.name}</div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setEditingUnit(u); setUnitDialog(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); deleteUnit(u.id); }}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
                {propertyUnits.length === 0 && <p className="text-sm text-muted-foreground">No units yet.</p>}
              </div>
            )}
          </div>

          {/* ROOMS */}
          <div className="rounded-xl border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">Rooms</h2>
              <Button size="sm" disabled={!selectedUnitId} onClick={() => { setEditingRoom({ ...emptyRoom }); setRoomDialog(true); }}>
                <Plus className="mr-1 h-4 w-4" /> New
              </Button>
            </div>
            {!selectedUnitId ? (
              <p className="text-sm text-muted-foreground">Select a unit to manage its rooms.</p>
            ) : (
              <div className="space-y-2">
                {unitRooms.map((r) => (
                  <div key={r.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="min-w-0">
                      <div className="truncate font-medium">{r.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {r.room_type} · {r.monthly_price ? `R${r.monthly_price}` : "—"} · {r.is_occupied ? "Occupied" : "Available"}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setEditingRoom(r); setRoomDialog(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteRoom(r.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
                {unitRooms.length === 0 && <p className="text-sm text-muted-foreground">No rooms yet.</p>}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Property Dialog */}
      <PropertyDialog open={propDialog} onOpenChange={setPropDialog} value={editingProp} onChange={setEditingProp} onSave={saveProperty} />
      {/* Unit Dialog */}
      <Dialog open={unitDialog} onOpenChange={setUnitDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingUnit.id ? "Edit Unit" : "New Unit"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Name</Label><Input value={editingUnit.name ?? ""} onChange={(e) => setEditingUnit({ ...editingUnit, name: e.target.value })} /></div>
            <div><Label>Description</Label><Textarea value={editingUnit.description ?? ""} onChange={(e) => setEditingUnit({ ...editingUnit, description: e.target.value })} /></div>
          </div>
          <DialogFooter><Button onClick={saveUnit}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Room Dialog */}
      <RoomDialog open={roomDialog} onOpenChange={setRoomDialog} value={editingRoom} onChange={setEditingRoom} onSave={saveRoom} />
    </Layout>
  );
};

// ============ Property Dialog ============
function PropertyDialog({
  open, onOpenChange, value, onChange, onSave,
}: {
  open: boolean; onOpenChange: (v: boolean) => void;
  value: any; onChange: (v: any) => void; onSave: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const handleCover = async (file: File) => {
    setUploading(true);
    const url = await uploadToBucket(file, "covers");
    setUploading(false);
    if (url) onChange({ ...value, cover_image_url: url });
  };
  const toggle = (key: string) => onChange({ ...value, [key]: !value[key] });
  const togglePay = (p: string) => {
    const arr: string[] = value.payment_options ?? [];
    onChange({ ...value, payment_options: arr.includes(p) ? arr.filter((x) => x !== p) : [...arr, p] });
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader><DialogTitle>{value.id ? "Edit Property" : "New Property"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Name</Label><Input value={value.name ?? ""} onChange={(e) => onChange({ ...value, name: e.target.value })} /></div>
          <div><Label>Location</Label><Input value={value.location ?? ""} onChange={(e) => onChange({ ...value, location: e.target.value })} /></div>
          <div><Label>Description</Label><Textarea value={value.description ?? ""} onChange={(e) => onChange({ ...value, description: e.target.value })} /></div>
          <div>
            <Label>Cover Image</Label>
            <div className="flex items-center gap-3">
              <Input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleCover(e.target.files[0])} />
              {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>
            {value.cover_image_url && <img src={value.cover_image_url} alt="cover" className="mt-2 h-24 w-full rounded object-cover" />}
          </div>
          <div>
            <Label>Features (comma separated)</Label>
            <Input value={(value.features ?? []).join(", ")} onChange={(e) => onChange({ ...value, features: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <label className="flex items-center gap-2"><Checkbox checked={!!value.near_cut} onCheckedChange={() => toggle("near_cut")} /> Near CUT</label>
            <label className="flex items-center gap-2"><Checkbox checked={!!value.near_ufs} onCheckedChange={() => toggle("near_ufs")} /> Near UFS</label>
            <label className="flex items-center gap-2"><Checkbox checked={!!value.water_electricity} onCheckedChange={() => toggle("water_electricity")} /> Water &amp; Electricity</label>
            <label className="flex items-center gap-2"><Checkbox checked={!!value.wifi} onCheckedChange={() => toggle("wifi")} /> WiFi</label>
            <label className="flex items-center gap-2"><Checkbox checked={!!value.security_cameras} onCheckedChange={() => toggle("security_cameras")} /> Security Cameras</label>
          </div>
          <div>
            <Label>Gender</Label>
            <Select value={value.gender ?? "any"} onValueChange={(v) => onChange({ ...value, gender: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-2 block">Payment Options</Label>
            <div className="flex flex-wrap gap-3">
              {PAYMENTS.map((p) => (
                <label key={p} className="flex items-center gap-2"><Checkbox checked={(value.payment_options ?? []).includes(p)} onCheckedChange={() => togglePay(p)} /> {p}</label>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter><Button onClick={onSave}>Save</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============ Room Dialog ============
function RoomDialog({
  open, onOpenChange, value, onChange, onSave,
}: {
  open: boolean; onOpenChange: (v: boolean) => void;
  value: any; onChange: (v: any) => void; onSave: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const handleImages = async (files: FileList) => {
    setUploading(true);
    const urls: string[] = [];
    for (const f of Array.from(files)) {
      const u = await uploadToBucket(f, "rooms");
      if (u) urls.push(u);
    }
    setUploading(false);
    onChange({ ...value, image_urls: [...(value.image_urls ?? []), ...urls] });
  };
  const handleVideo = async (file: File) => {
    setUploading(true);
    const url = await uploadToBucket(file, "videos");
    setUploading(false);
    if (url) onChange({ ...value, walkthrough_video_url: url });
  };
  const removeImage = (url: string) =>
    onChange({ ...value, image_urls: (value.image_urls ?? []).filter((u: string) => u !== url) });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader><DialogTitle>{value.id ? "Edit Room" : "New Room"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Name</Label><Input value={value.name ?? ""} onChange={(e) => onChange({ ...value, name: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type</Label>
              <Select value={value.room_type ?? "single"} onValueChange={(v) => onChange({ ...value, room_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="sharing">Sharing</SelectItem>
                  <SelectItem value="flat">Flat</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Monthly Price (R)</Label><Input type="number" value={value.monthly_price ?? ""} onChange={(e) => onChange({ ...value, monthly_price: e.target.value ? Number(e.target.value) : null })} /></div>
          </div>
          <label className="flex items-center gap-2"><Checkbox checked={!!value.is_occupied} onCheckedChange={(v) => onChange({ ...value, is_occupied: !!v })} /> Occupied</label>
          <div>
            <Label>Features (comma separated)</Label>
            <Input value={(value.features ?? []).join(", ")} onChange={(e) => onChange({ ...value, features: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
          </div>
          <div>
            <Label>Photos (bedroom, kitchen, bathroom, etc.)</Label>
            <div className="flex items-center gap-3">
              <Input type="file" accept="image/*" multiple onChange={(e) => e.target.files && handleImages(e.target.files)} />
              {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {(value.image_urls ?? []).map((u: string) => (
                <div key={u} className="relative">
                  <img src={u} alt="" className="h-20 w-full rounded object-cover" />
                  <button type="button" onClick={() => removeImage(u)} className="absolute -right-1 -top-1 rounded-full bg-destructive p-1 text-destructive-foreground">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div>
            <Label>Walk-through Video</Label>
            <div className="flex items-center gap-3">
              <Input type="file" accept="video/*" onChange={(e) => e.target.files?.[0] && handleVideo(e.target.files[0])} />
              {value.walkthrough_video_url && <a href={value.walkthrough_video_url} target="_blank" rel="noreferrer" className="text-xs text-primary underline">view</a>}
            </div>
          </div>
        </div>
        <DialogFooter><Button onClick={onSave}>Save</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AdminDashboard;
