import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { MapPin, Check, BedDouble } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";

type Property = {
  id: string;
  name: string;
  location: string;
  description: string | null;
  cover_image_url: string | null;
  features: string[];
};
type Unit = { id: string; name: string; description: string | null };
type Room = {
  id: string;
  unit_id: string;
  name: string;
  is_occupied: boolean;
  monthly_price: number | null;
};

const PropertyDetail = () => {
  const { id } = useParams();
  const [property, setProperty] = useState<Property | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data: p } = await supabase.from("properties").select("*").eq("id", id).maybeSingle();
      setProperty(p as Property | null);
      const { data: u } = await supabase
        .from("units")
        .select("*")
        .eq("property_id", id)
        .order("name");
      const unitList = (u as Unit[]) ?? [];
      setUnits(unitList);
      if (unitList.length) setSelectedUnit(unitList[0].id);
      if (unitList.length) {
        const { data: r } = await supabase
          .from("rooms")
          .select("*")
          .in(
            "unit_id",
            unitList.map((x) => x.id)
          )
          .order("name");
        setRooms((r as Room[]) ?? []);
      }
    })();
  }, [id]);

  if (!property) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">
          Loading property…
        </div>
      </Layout>
    );
  }

  const unitRooms = rooms.filter((r) => r.unit_id === selectedUnit);

  return (
    <Layout>
      <section className="relative h-72 overflow-hidden bg-muted">
        {property.cover_image_url && (
          <img
            src={property.cover_image_url}
            alt={property.name}
            className="h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
      </section>

      <section className="container mx-auto px-4 py-10">
        <h1 className="mb-2 text-4xl font-extrabold text-foreground">{property.name}</h1>
        <p className="mb-4 flex items-center gap-2 text-muted-foreground">
          <MapPin className="h-4 w-4" /> {property.location}
        </p>
        {property.description && (
          <p className="mb-6 max-w-3xl text-foreground/80">{property.description}</p>
        )}
        {property.features?.length > 0 && (
          <div className="mb-10 flex flex-wrap gap-2">
            {property.features.map((f) => (
              <span
                key={f}
                className="flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-sm text-accent-foreground"
              >
                <Check className="h-3.5 w-3.5" /> {f}
              </span>
            ))}
          </div>
        )}

        <h2 className="mb-4 text-2xl font-bold text-foreground">Units</h2>
        {units.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
            No units listed yet.
          </div>
        ) : (
          <>
            <div className="mb-8 flex flex-wrap gap-2">
              {units.map((u) => (
                <button
                  key={u.id}
                  onClick={() => setSelectedUnit(u.id)}
                  className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                    selectedUnit === u.id
                      ? "hero-gradient text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {u.name}
                </button>
              ))}
            </div>

            {selectedUnit && (
              <>
                {units.find((u) => u.id === selectedUnit)?.description && (
                  <p className="mb-6 text-muted-foreground">
                    {units.find((u) => u.id === selectedUnit)?.description}
                  </p>
                )}
                <h3 className="mb-4 text-xl font-semibold">Rooms</h3>
                <div className="mb-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-primary" /> Available
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-muted-foreground/40" /> Occupied
                  </span>
                </div>
                {unitRooms.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                    No rooms in this unit yet.
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {unitRooms.map((r) =>
                      r.is_occupied ? (
                        <div
                          key={r.id}
                          className="cursor-not-allowed rounded-xl border bg-muted p-5 opacity-60"
                          aria-disabled
                        >
                          <BedDouble className="mb-3 h-6 w-6 text-muted-foreground" />
                          <p className="font-semibold text-muted-foreground">{r.name}</p>
                          <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
                            Occupied
                          </p>
                        </div>
                      ) : (
                        <Link
                          key={r.id}
                          to={`/properties/${property.id}/rooms/${r.id}`}
                          className="group rounded-xl border-2 border-primary/30 bg-card p-5 transition-all hover:border-primary hover:card-shadow-hover"
                        >
                          <BedDouble className="mb-3 h-6 w-6 text-primary" />
                          <p className="font-semibold text-foreground">{r.name}</p>
                          {r.monthly_price && (
                            <p className="mt-1 text-sm font-bold text-primary">
                              R{Number(r.monthly_price).toLocaleString()}
                              <span className="text-xs font-normal text-muted-foreground">/mo</span>
                            </p>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-3 w-full group-hover:bg-primary group-hover:text-primary-foreground"
                          >
                            View Room
                          </Button>
                        </Link>
                      )
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </section>
    </Layout>
  );
};

export default PropertyDetail;
