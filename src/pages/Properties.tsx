import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Search, Building2, SlidersHorizontal, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Room = {
  id: string;
  monthly_price: number | null;
  room_type: string;
};

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
  rooms: Room[];
};

const ROOM_TYPES = ["single", "sharing", "flat"] as const;
const PAYMENTS = ["NSFAS", "Cash", "Other"] as const;

const Properties = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [search, setSearch] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [roomType, setRoomType] = useState<string>("any");
  const [nearCut, setNearCut] = useState(false);
  const [nearUfs, setNearUfs] = useState(false);
  const [gender, setGender] = useState<string>("any");
  const [payments, setPayments] = useState<string[]>([]);
  const [waterElec, setWaterElec] = useState(false);
  const [wifi, setWifi] = useState(false);
  const [cameras, setCameras] = useState(false);

  useEffect(() => {
    supabase
      .from("properties")
      .select("*, rooms:units(rooms(id, monthly_price, room_type))")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        const mapped = (data ?? []).map((p: any) => ({
          ...p,
          rooms: (p.rooms ?? []).flatMap((u: any) => u.rooms ?? []),
        })) as Property[];
        setProperties(mapped);
        setLoading(false);
      });
  }, []);

  const togglePayment = (p: string) =>
    setPayments((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));

  const clearFilters = () => {
    setSearch(""); setMinPrice(""); setMaxPrice(""); setRoomType("any");
    setNearCut(false); setNearUfs(false); setGender("any"); setPayments([]);
    setWaterElec(false); setWifi(false); setCameras(false);
  };

  const filtered = useMemo(() => {
    const min = minPrice ? Number(minPrice) : null;
    const max = maxPrice ? Number(maxPrice) : null;
    return properties.filter((p) => {
      if (search) {
        const s = search.toLowerCase();
        if (!p.name.toLowerCase().includes(s) && !p.location.toLowerCase().includes(s)) return false;
      }
      if (nearCut && !p.near_cut) return false;
      if (nearUfs && !p.near_ufs) return false;
      if (waterElec && !p.water_electricity) return false;
      if (wifi && !p.wifi) return false;
      if (cameras && !p.security_cameras) return false;
      if (gender !== "any" && p.gender !== "any" && p.gender !== gender) return false;
      if (payments.length && !payments.every((opt) => p.payment_options.includes(opt))) return false;
      if (roomType !== "any" && !p.rooms.some((r) => r.room_type === roomType)) return false;
      if (min !== null || max !== null) {
        const ok = p.rooms.some((r) => {
          if (r.monthly_price == null) return false;
          if (min !== null && r.monthly_price < min) return false;
          if (max !== null && r.monthly_price > max) return false;
          return true;
        });
        if (!ok) return false;
      }
      return true;
    });
  }, [properties, search, minPrice, maxPrice, roomType, nearCut, nearUfs, gender, payments, waterElec, wifi, cameras]);

  return (
    <Layout>
      <section className="hero-gradient py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="mb-4 text-4xl font-extrabold text-primary-foreground md:text-5xl">Browse Properties</h1>
          <p className="mx-auto mb-8 max-w-xl text-primary-foreground/80">
            Find your perfect student home from our verified listings.
          </p>
          <div className="mx-auto flex max-w-lg items-center gap-2 rounded-lg bg-primary-foreground p-2">
            <Search className="ml-2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent px-2 py-1 text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="container mx-auto grid gap-8 px-4 lg:grid-cols-[280px_1fr]">
          {/* Filters sidebar */}
          <aside className={`${showFilters ? "block" : "hidden"} lg:block`}>
            <div className="sticky top-24 rounded-xl border bg-card p-5 card-shadow">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Filters</h3>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="mr-1 h-3 w-3" /> Clear
                </Button>
              </div>

              <div className="space-y-5 text-sm">
                <div>
                  <Label className="mb-2 block font-medium">Price (R / month)</Label>
                  <div className="flex gap-2">
                    <Input type="number" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
                    <Input type="number" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block font-medium">Room Type</Label>
                  <Select value={roomType} onValueChange={setRoomType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      {ROOM_TYPES.map((t) => (
                        <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="mb-2 block font-medium">Location</Label>
                  <label className="flex items-center gap-2 py-1">
                    <Checkbox checked={nearCut} onCheckedChange={(v) => setNearCut(!!v)} /> Near CUT
                  </label>
                  <label className="flex items-center gap-2 py-1">
                    <Checkbox checked={nearUfs} onCheckedChange={(v) => setNearUfs(!!v)} /> Near UFS
                  </label>
                </div>

                <div>
                  <Label className="mb-2 block font-medium">Gender</Label>
                  <Select value={gender} onValueChange={setGender}>
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
                  <Label className="mb-2 block font-medium">Payment Options</Label>
                  {PAYMENTS.map((p) => (
                    <label key={p} className="flex items-center gap-2 py-1">
                      <Checkbox checked={payments.includes(p)} onCheckedChange={() => togglePayment(p)} /> {p}
                    </label>
                  ))}
                </div>

                <div>
                  <Label className="mb-2 block font-medium">Amenities</Label>
                  <label className="flex items-center gap-2 py-1">
                    <Checkbox checked={waterElec} onCheckedChange={(v) => setWaterElec(!!v)} /> Water &amp; Electricity
                  </label>
                  <label className="flex items-center gap-2 py-1">
                    <Checkbox checked={wifi} onCheckedChange={(v) => setWifi(!!v)} /> WiFi
                  </label>
                  <label className="flex items-center gap-2 py-1">
                    <Checkbox checked={cameras} onCheckedChange={(v) => setCameras(!!v)} /> Security Cameras
                  </label>
                </div>
              </div>
            </div>
          </aside>

          <div>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{loading ? "Loading…" : `${filtered.length} properties`}</p>
              <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setShowFilters(!showFilters)}>
                <SlidersHorizontal className="mr-1 h-4 w-4" /> Filters
              </Button>
            </div>

            {loading ? (
              <div className="py-16 text-center text-muted-foreground">Loading properties…</div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground">
                {properties.length === 0 ? "No properties listed yet. Check back soon." : "No properties match your filters."}
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2">
                {filtered.map((p) => {
                  const prices = p.rooms.map((r) => r.monthly_price).filter((x): x is number => x != null);
                  const fromPrice = prices.length ? Math.min(...prices) : null;
                  return (
                    <Link
                      key={p.id}
                      to={`/properties/${p.id}`}
                      className="group overflow-hidden rounded-xl bg-card card-shadow transition-all hover:card-shadow-hover"
                    >
                      <div className="relative h-52 overflow-hidden bg-muted">
                        {p.cover_image_url ? (
                          <img src={p.cover_image_url} alt={p.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-muted-foreground">
                            <Building2 className="h-12 w-12" />
                          </div>
                        )}
                        {fromPrice !== null && (
                          <div className="absolute bottom-2 right-2 rounded-md bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground">
                            From R{fromPrice}/mo
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        <h3 className="mb-1 text-lg font-semibold text-foreground">{p.name}</h3>
                        <p className="mb-3 flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" /> {p.location}
                        </p>
                        {p.description && <p className="line-clamp-2 text-sm text-muted-foreground">{p.description}</p>}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Properties;
