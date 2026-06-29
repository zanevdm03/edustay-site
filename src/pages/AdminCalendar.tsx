import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar as CalIcon, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type ViewingRequest = {
  id: string;
  user_id: string;
  room_id: string;
  preferred_date: string;
  status: "pending" | "confirmed" | "cancelled";
  notes: string | null;
  created_at: string;
};
type Enriched = ViewingRequest & {
  student_name: string | null;
  student_email: string | null;
  room_name: string | null;
  property_name: string | null;
};

const statusColors: Record<string, string> = {
  pending: "bg-secondary text-secondary-foreground",
  confirmed: "bg-primary text-primary-foreground",
  cancelled: "bg-muted text-muted-foreground",
};

const AdminCalendar = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [requests, setRequests] = useState<Enriched[]>([]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/auth?redirect=/admin/calendar");
      return;
    }
    if (!isAdmin) return;
    loadRequests();
  }, [user, isAdmin, loading, navigate]);

  const loadRequests = async () => {
    const { data: reqs } = await supabase
      .from("viewing_requests")
      .select("*")
      .order("preferred_date", { ascending: true });
    const list = (reqs as ViewingRequest[]) ?? [];
    if (list.length === 0) {
      setRequests([]);
      return;
    }
    const userIds = [...new Set(list.map((r) => r.user_id))];
    const roomIds = [...new Set(list.map((r) => r.room_id))];
    const [{ data: profs }, { data: rooms }] = await Promise.all([
      supabase.from("profiles").select("id,full_name,email").in("id", userIds),
      supabase.from("rooms").select("id,name,unit_id").in("id", roomIds),
    ]);
    const unitIds = [...new Set((rooms ?? []).map((r: any) => r.unit_id))];
    const { data: units } = await supabase
      .from("units")
      .select("id,property_id")
      .in("id", unitIds);
    const propIds = [...new Set((units ?? []).map((u: any) => u.property_id))];
    const { data: props } = await supabase
      .from("properties")
      .select("id,name")
      .in("id", propIds);

    const profMap = new Map((profs ?? []).map((p: any) => [p.id, p]));
    const roomMap = new Map((rooms ?? []).map((r: any) => [r.id, r]));
    const unitMap = new Map((units ?? []).map((u: any) => [u.id, u]));
    const propMap = new Map((props ?? []).map((p: any) => [p.id, p]));

    setRequests(
      list.map((r) => {
        const room: any = roomMap.get(r.room_id);
        const unit: any = room ? unitMap.get(room.unit_id) : null;
        const prop: any = unit ? propMap.get(unit.property_id) : null;
        const prof: any = profMap.get(r.user_id);
        return {
          ...r,
          student_name: prof?.full_name ?? null,
          student_email: prof?.email ?? null,
          room_name: room?.name ?? null,
          property_name: prop?.name ?? null,
        };
      })
    );
  };

  const updateStatus = async (id: string, status: "confirmed" | "cancelled") => {
    const { error } = await supabase
      .from("viewing_requests")
      .update({ status })
      .eq("id", id);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: `Viewing ${status}` });
    loadRequests();
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">
          Loading…
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="mb-2 text-2xl font-bold">Admin access required</h1>
          <p className="text-muted-foreground">
            Your account does not have administrator permissions.
          </p>
        </div>
      </Layout>
    );
  }

  // Group by date
  const groups = new Map<string, Enriched[]>();
  for (const r of requests) {
    const day = new Date(r.preferred_date).toDateString();
    if (!groups.has(day)) groups.set(day, []);
    groups.get(day)!.push(r);
  }

  return (
    <Layout>
      <section className="container mx-auto px-4 py-10">
        <div className="mb-8 flex items-center gap-3">
          <CalIcon className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-extrabold">Viewing requests</h1>
        </div>

        {requests.length === 0 ? (
          <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
            No viewing requests yet.
          </div>
        ) : (
          <div className="space-y-8">
            {[...groups.entries()].map(([day, items]) => (
              <div key={day}>
                <h2 className="mb-3 text-lg font-semibold text-foreground">{day}</h2>
                <div className="space-y-3">
                  {items.map((r) => (
                    <div
                      key={r.id}
                      className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-card p-5 card-shadow"
                    >
                      <div className="flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <span className="font-semibold">
                            {new Date(r.preferred_date).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <Badge className={statusColors[r.status]}>{r.status}</Badge>
                        </div>
                        <p className="text-sm text-foreground">
                          {r.property_name ?? "Property"} · {r.room_name ?? "Room"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {r.student_name ?? "Student"} · {r.student_email ?? "—"}
                        </p>
                        {r.notes && (
                          <p className="mt-1 text-sm italic text-muted-foreground">"{r.notes}"</p>
                        )}
                      </div>
                      {r.status === "pending" && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => updateStatus(r.id, "confirmed")}
                            className="hero-gradient text-primary-foreground"
                          >
                            <Check className="mr-1 h-4 w-4" /> Confirm
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStatus(r.id, "cancelled")}
                          >
                            <X className="mr-1 h-4 w-4" /> Cancel
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
};

export default AdminCalendar;
