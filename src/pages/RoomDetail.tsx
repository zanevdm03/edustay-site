import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Check, Calendar as CalIcon, ArrowLeft, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Room = {
  id: string;
  unit_id: string;
  name: string;
  is_occupied: boolean;
  monthly_price: number | null;
  features: string[];
  image_urls: string[];
  walkthrough_video_url: string | null;
};
type Unit = { id: string; name: string; property_id: string };
type Property = { id: string; name: string; location: string; features: string[] };

const PLACEHOLDER_IMAGES = [
  { label: "Bedroom", url: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200" },
  { label: "Kitchen", url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200" },
  { label: "Bathroom", url: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1200" },
  { label: "Living Room", url: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=1200" },
];

const RoomDetail = () => {
  const { id, roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [room, setRoom] = useState<Room | null>(null);
  const [unit, setUnit] = useState<Unit | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!roomId) return;
    (async () => {
      const { data: r } = await supabase.from("rooms").select("*").eq("id", roomId).maybeSingle();
      setRoom(r as Room | null);
      if (r) {
        const { data: u } = await supabase
          .from("units")
          .select("*")
          .eq("id", (r as Room).unit_id)
          .maybeSingle();
        setUnit(u as Unit | null);
        if (u) {
          const { data: p } = await supabase
            .from("properties")
            .select("id,name,location,features")
            .eq("id", (u as Unit).property_id)
            .maybeSingle();
          setProperty(p as Property | null);
        }
      }
    })();
  }, [roomId]);

  const handleBookViewing = () => {
    if (!user) {
      navigate(`/auth?redirect=/properties/${id}/rooms/${roomId}`);
      return;
    }
    setOpen(true);
  };

  const submitRequest = async () => {
    if (!user || !roomId || !date) return;
    setSubmitting(true);
    const { error } = await supabase.from("viewing_requests").insert({
      user_id: user.id,
      room_id: roomId,
      preferred_date: new Date(date).toISOString(),
      notes: notes || null,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Could not submit", description: error.message, variant: "destructive" });
      return;
    }
    setOpen(false);
    setDate("");
    setNotes("");
    toast({
      title: "Viewing requested",
      description: "We'll be in touch shortly to confirm your viewing.",
    });
  };

  if (!room) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">
          Loading room…
        </div>
      </Layout>
    );
  }

  const galleryImages =
    room.image_urls && room.image_urls.length > 0
      ? room.image_urls.map((url, i) => ({
          label: PLACEHOLDER_IMAGES[i]?.label ?? `Photo ${i + 1}`,
          url,
        }))
      : PLACEHOLDER_IMAGES;

  return (
    <Layout>
      <section className="container mx-auto px-4 py-8">
        {property && (
          <Link
            to={`/properties/${property.id}`}
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back to {property.name}
          </Link>
        )}

        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-foreground md:text-4xl">
              {room.name}
              {unit && (
                <span className="ml-2 text-lg font-normal text-muted-foreground">· {unit.name}</span>
              )}
            </h1>
            {property && <p className="text-muted-foreground">{property.name} · {property.location}</p>}
          </div>
          {room.monthly_price && (
            <div className="text-right">
              <div className="text-3xl font-bold text-primary">
                R{Number(room.monthly_price).toLocaleString()}
                <span className="text-base font-normal text-muted-foreground">/mo</span>
              </div>
            </div>
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Gallery */}
          <div className="lg:col-span-2">
            <div className="grid gap-3 sm:grid-cols-2">
              {galleryImages.map((img) => (
                <figure key={img.label} className="overflow-hidden rounded-xl bg-muted">
                  <img
                    src={img.url}
                    alt={img.label}
                    loading="lazy"
                    className="h-48 w-full object-cover"
                  />
                  <figcaption className="bg-card px-3 py-2 text-sm font-medium">
                    {img.label}
                  </figcaption>
                </figure>
              ))}
            </div>

            {/* Walk-through video */}
            <div className="mt-6 overflow-hidden rounded-xl border bg-card">
              <div className="flex items-center gap-2 border-b px-4 py-3">
                <Play className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">Walk-through video</h3>
              </div>
              {room.walkthrough_video_url ? (
                <video
                  src={room.walkthrough_video_url}
                  controls
                  className="w-full"
                  poster={galleryImages[0]?.url}
                />
              ) : (
                <div className="flex aspect-video items-center justify-center bg-muted text-sm text-muted-foreground">
                  Walk-through video coming soon
                </div>
              )}
            </div>
          </div>

          {/* Features + book */}
          <aside className="space-y-6">
            <div className="rounded-xl bg-card p-6 card-shadow">
              <h3 className="mb-3 text-lg font-semibold">Room features</h3>
              {room.features?.length ? (
                <ul className="space-y-2 text-sm">
                  {room.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-foreground/80">
                      <Check className="h-4 w-4 text-primary" /> {f}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No features listed.</p>
              )}
            </div>

            {property?.features?.length ? (
              <div className="rounded-xl bg-card p-6 card-shadow">
                <h3 className="mb-3 text-lg font-semibold">Property features</h3>
                <ul className="space-y-2 text-sm">
                  {property.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-foreground/80">
                      <Check className="h-4 w-4 text-primary" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <Button
              size="lg"
              onClick={handleBookViewing}
              disabled={room.is_occupied}
              className="w-full hero-gradient text-primary-foreground hover:opacity-90"
            >
              <CalIcon className="mr-2 h-5 w-5" />
              {room.is_occupied ? "Room occupied" : "Book viewing"}
            </Button>
            {!user && !room.is_occupied && (
              <p className="text-center text-xs text-muted-foreground">
                You'll be asked to sign in or create an account.
              </p>
            )}
          </aside>
        </div>
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request a viewing</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="date">Preferred date & time</Label>
              <input
                id="date"
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anything we should know?"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitRequest} disabled={!date || submitting}>
              {submitting ? "Submitting…" : "Submit request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default RoomDetail;
