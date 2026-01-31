import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { InvoiceDialog } from "@/components/InvoiceDialog";
import type { MaintenanceRequest } from "@shared/schema";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { getLoginPath } from "@/lib/auth-utils";
import {
  ClipboardList,
  PenBox,
  Truck,
  User,
  Phone,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Wrench
} from "lucide-react";

function getStatusIcon(status: string) {
  switch (status) {
    case "pending":
      return <Clock className="w-3 h-3" />;
    case "in_progress":
      return <Wrench className="w-3 h-3" />;
    case "completed":
      return <CheckCircle2 className="w-3 h-3" />;
    default:
      return <Clock className="w-3 h-3" />;
  }
}

type UpdatePayload = { id: number; status: string; workDone?: string; partsUsed?: string };

function RequestCard({
  request,
  onUpdate,
  isUpdating,
}: {
  request: MaintenanceRequest;
  onUpdate: (payload: UpdatePayload) => void;
  isUpdating: boolean;
}) {
  const form = useForm({
    defaultValues: {
      status: request.status,
      workDone: request.workDone ?? "",
      partsUsed: request.partsUsed ?? "",
    },
  });

  useEffect(() => {
    form.reset({
      status: request.status,
      workDone: request.workDone ?? "",
      partsUsed: request.partsUsed ?? "",
    });
  }, [form, request.partsUsed, request.status, request.workDone]);

  return (
    <Card
      key={request.id}
      className="bg-card/80 backdrop-blur border-white/5 overflow-visible"
    >
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-4">
        <div className="space-y-1">
          <div className="flex items-center flex-wrap gap-2">
            <span className="text-xs font-mono text-muted-foreground">
              WO #{request.id.toString().padStart(4, "0")}
            </span>
            <CardTitle className="text-xl uppercase font-display">
              {request.customerName}
            </CardTitle>
            {request.isUrgent && (
              <Badge variant="destructive" className="animate-pulse">
                Urgent
              </Badge>
            )}
            <Badge variant="outline" className="flex gap-1 items-center border-white/10">
              {getStatusIcon(request.status)}
              <span className="uppercase text-[10px] font-bold tracking-tighter">
                {request.status.replace("_", " ")}
              </span>
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Truck className="w-4 h-4 opacity-70" />
            {request.vehicleInfo}
          </p>

          <p className="text-xs text-muted-foreground flex items-center gap-2">
            <User className="w-3 h-3 opacity-70" />
            {request.customerName}
            <span className="opacity-40">•</span>
            <Phone className="w-3 h-3 opacity-70" />
            {request.contactInfo}
            <span className="opacity-40">•</span>
            <Calendar className="w-3 h-3 opacity-70" />
            {request.createdAt ? new Date(request.createdAt).toLocaleString() : "N/A"}
          </p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="border-white/10 hover:bg-primary/10 w-full sm:w-auto">
              <PenBox className="w-4 h-4 mr-2" />
              Manage
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
            <DialogHeader>
              <DialogTitle className="uppercase font-display text-base sm:text-lg">
                Update Work Order #{request.id}
              </DialogTitle>
            </DialogHeader>

            {/* FIX: Show complaint/description inside the Manage dialog */}
            <div className="rounded-lg border border-white/10 bg-secondary/20 p-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
                <ClipboardList className="w-3 h-3" />
                Complaint / Reported Issue
              </div>
              <div className="mt-2 text-sm text-foreground/90 leading-relaxed">
                {request.description ? (
                  <span className="italic">“{request.description}”</span>
                ) : (
                  <span className="text-muted-foreground">No description provided.</span>
                )}
              </div>
            </div>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((v) =>
                  onUpdate({
                    id: request.id,
                    status: v.status,
                    workDone: v.workDone,
                    partsUsed: v.partsUsed,
                  })
                )}
                className="space-y-5 pt-2"
              >
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs uppercase font-bold tracking-wider">
                        Current Status
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-secondary/30">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="workDone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs uppercase font-bold tracking-wider">
                        Work Performed
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Describe the service steps taken..."
                          className="bg-secondary/30 min-h-[110px]"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="partsUsed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs uppercase font-bold tracking-wider">
                        Parts Used
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="List parts used (optional)..."
                          className="bg-secondary/30 min-h-[90px]"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-2">
                  <InvoiceDialog request={request} />
                  <Button
                    type="submit"
                    disabled={isUpdating}
                    className="font-bold uppercase tracking-wide w-full sm:w-auto"
                  >
                    Save Update
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-secondary/20 p-4 rounded-lg border border-white/5">
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-primary">
              <ClipboardList className="w-3 h-3" />
              Problem Description
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed italic">
              “{request.description}”
            </p>
          </div>

          {(request.workDone || request.partsUsed) && (
            <div className="space-y-4 md:border-l border-white/10 md:pl-6">
              {request.workDone && (
                <div className="space-y-1">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-green-500/80">
                    Service Summary
                  </h4>
                  <p className="text-sm text-foreground/90">{request.workDone}</p>
                </div>
              )}

              {request.partsUsed && (
                <div className="space-y-1">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-orange-500/80">
                    Parts Used
                  </h4>
                  <p className="text-sm text-foreground/90">{request.partsUsed}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("pending");

  const { data: requests, isLoading: requestsLoading } = useQuery<MaintenanceRequest[]>({
    queryKey: [api.requests.list.path],
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: { id: number; status: string; workDone?: string; partsUsed?: string }) => {
      const path = api.requests.update.path.replace(":id", payload.id.toString());
      const res = await fetch(path, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          status: payload.status,
          workDone: payload.workDone ?? "",
          partsUsed: payload.partsUsed ?? "",
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Update failed (${res.status})`);
      }
      return res.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [api.requests.list.path] });
      toast({ title: "Updated", description: "Work order updated successfully." });
    },
    onError: (err: any) => {
      toast({
        title: "Update failed",
        description: err?.message || "Could not update work order.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-full max-w-3xl p-6 space-y-4">
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 px-4">
          <h2 className="text-2xl font-bold uppercase font-display">Admin Access Required</h2>
          <Button size="lg" onClick={() => (window.location.href = getLoginPath())}>
            Login
          </Button>
        </div>
      </div>
    );
  }

  const filteredRequests =
    requests?.filter((r) => {
      const matchesSearch =
        r.customerName.toLowerCase().includes(search.toLowerCase()) ||
        r.vehicleInfo.toLowerCase().includes(search.toLowerCase()) ||
        (r.description || "").toLowerCase().includes(search.toLowerCase());

      const matchesFilter =
        filter === "all" ? true : r.status === filter;

      return matchesSearch && matchesFilter;
    }) ?? [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold uppercase font-display tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Manage incoming work orders.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search (name, vehicle, complaint)…"
              className="sm:w-[280px]"
            />

            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="sm:w-[200px]">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {requestsLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
        ) : filteredRequests.length === 0 ? (
          <Card className="bg-card/80 backdrop-blur border-white/5">
            <CardContent className="p-8 text-center text-muted-foreground">
              No work orders match your search/filter.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredRequests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                onUpdate={(payload) => updateMutation.mutate(payload)}
                isUpdating={updateMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
