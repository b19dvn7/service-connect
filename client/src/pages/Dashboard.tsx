import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { MaintenanceRequest } from "@shared/schema";
import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
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
  Wrench,
  Trash2
} from "lucide-react";

type ServiceSummary = {
  groups: Record<
    string,
    { items: string[]; notes?: string; engineOil?: { weights?: string[]; types?: string[] } }
  >;
  additionalNotes?: string;
  attachments?: { name: string; url: string }[];
};

function parseServiceSummary(description?: string | null): ServiceSummary | null {
  if (!description) return null;
  if (!description.startsWith("SERVICE_JSON:")) return null;
  try {
    const raw = description.replace("SERVICE_JSON:", "");
    return JSON.parse(raw) as ServiceSummary;
  } catch {
    return null;
  }
}

function ServiceSummaryView({ summary }: { summary: ServiceSummary }) {
  return (
    <div className="space-y-4">
      {Object.entries(summary.groups ?? {}).map(([label, data]) => (
        <div key={label} className="border-l border-white/10 pl-3 space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-widest text-primary/90">
            {label}
          </div>
          {data.items?.length ? (
            <ul className="text-sm text-foreground/90 space-y-1">
              {data.items.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary/80" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-xs text-muted-foreground">No selections</div>
          )}
          {data.engineOil && (data.engineOil.weights?.length || data.engineOil.types?.length) && (
            <div className="text-xs text-muted-foreground">
              Engine oil:{" "}
              {[...(data.engineOil.weights ?? []), ...(data.engineOil.types ?? [])].join(", ")}
            </div>
          )}
          {data.notes && (
            <div className="text-xs text-muted-foreground">
              Notes: <span className="text-foreground/90">{data.notes}</span>
            </div>
          )}
        </div>
      ))}

      {summary.additionalNotes && (
        <div className="space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            Additional Notes
          </div>
          <div className="text-sm text-foreground/90">{summary.additionalNotes}</div>
        </div>
      )}

      {summary.attachments?.length ? (
        <div className="space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            Attachments
          </div>
          <ul className="text-xs text-primary/90 space-y-1">
            {summary.attachments.map((file) => (
              <li key={`${file.url}-${file.name}`}>
                <a href={file.url} target="_blank" rel="noreferrer" className="hover:underline">
                  {file.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function getStatusIcon(status: string) {
  switch (status) {
    case "new":
      return <AlertTriangle className="w-3 h-3" />;
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

function MaintenanceRequestCard({ 
  request, 
  onUpdate,
  onDelete
}: { 
  request: MaintenanceRequest; 
  onUpdate: (payload: { id: number; status: string; workDone?: string; partsUsed?: string; checklist?: any[] }) => Promise<any>;
  onDelete: (id: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [checklist, setChecklist] = useState<any[]>(request.checklist || []);
  const form = useForm({
    defaultValues: {
      status: request.status,
      workDone: request.workDone ?? "",
      partsUsed: request.partsUsed ?? "",
    },
  });
  const serviceSummary = parseServiceSummary(request.description);

  const handleSubmit = async (v: any, shouldClose = true) => {
    try {
      await onUpdate({
        id: request.id,
        status: v.status,
        workDone: v.workDone,
        partsUsed: v.partsUsed,
        checklist,
      });
      if (shouldClose) setOpen(false);
    } catch (err) {
      // Error handled by mutation onError
    }
  };

  const toggleChecklistItem = (index: number) => {
    const next = [...checklist];
    next[index].completed = !next[index].completed;
    setChecklist(next);
  };

  const updateChecklistComment = (index: number, comment: string) => {
    const next = [...checklist];
    next[index].comment = comment;
    setChecklist(next);
  };

  useEffect(() => {
    if (!request.checklist?.length && serviceSummary) {
      const initial: any[] = [];
      Object.entries(serviceSummary.groups).forEach(([group, data]: any) => {
        data.items.forEach((item: string) => {
          initial.push({ group, item, completed: false, comment: "" });
        });
      });
      if (initial.length) setChecklist(initial);
    }
  }, [request.checklist, serviceSummary]);

  return (
    <Card className="bg-card/80 backdrop-blur border-white/5 overflow-visible">
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

          <div className="text-sm text-muted-foreground space-y-1">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 opacity-70" />
              {request.vehicleInfo}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="border-white/10 hover:bg-primary/10">
                <PenBox className="w-4 h-4 mr-2" />
                Manage
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="uppercase font-display">Update Work Order #{request.id}</DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {checklist.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
                      <ClipboardList className="w-3 h-3" />
                      Service Checklist
                    </div>
                    <div className="grid gap-3">
                      {checklist.map((item, idx) => (
                        <div key={idx} className="flex flex-col gap-2 p-3 rounded-lg border border-white/5 bg-secondary/10">
                          <div className="flex items-center gap-3">
                            <Checkbox 
                              checked={item.completed} 
                              onCheckedChange={() => toggleChecklistItem(idx)}
                              id={`item-${idx}`}
                            />
                            <div className="flex-1">
                              <label 
                                htmlFor={`item-${idx}`}
                                className={cn(
                                  "text-sm font-medium leading-none cursor-pointer",
                                  item.completed && "text-muted-foreground line-through"
                                )}
                              >
                                <span className="text-[10px] opacity-50 mr-2 uppercase">{item.group}:</span>
                                {item.item}
                              </label>
                            </div>
                          </div>
                          <Input 
                            placeholder="Add comment or note..."
                            value={item.comment}
                            onChange={(e) => updateChecklistComment(idx, e.target.value)}
                            className="h-8 text-xs bg-transparent border-white/5 focus:border-primary/30"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Form {...form}>
                  <form className="space-y-5">
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs uppercase font-bold tracking-wider">Current Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-secondary/30">
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="new">New</SelectItem>
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
                          <FormLabel className="text-xs uppercase font-bold tracking-wider">Work Performed</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Describe the service steps taken..." className="bg-secondary/30 min-h-[110px]" />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="partsUsed"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs uppercase font-bold tracking-wider">Parts Used</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="List parts used (optional)..." className="bg-secondary/30 min-h-[90px]" />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                      <div className="flex items-center gap-2 mr-auto">
                        <Checkbox id="auto-close" defaultChecked={false} className="h-4 w-4" />
                        <label htmlFor="auto-close" className="text-xs text-muted-foreground cursor-pointer">Close after saving</label>
                      </div>
                      <Button 
                        type="button" 
                        variant="secondary"
                        onClick={() => {
                          const autoClose = (document.getElementById('auto-close') as HTMLInputElement)?.checked;
                          handleSubmit(form.getValues(), autoClose);
                        }}
                        className="font-bold uppercase tracking-wide"
                      >
                        Save Update
                      </Button>
                      <Button 
                        type="button"
                        onClick={() => handleSubmit({ ...form.getValues(), status: 'completed' })}
                        className="font-bold uppercase tracking-wide bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Complete Order
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            </DialogContent>
          </Dialog>

          <Button 
            variant="ghost" 
            size="sm" 
            className="text-destructive hover:bg-destructive/10"
            onClick={() => setDeleteConfirmOpen(true)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>

          <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle className="uppercase font-display text-destructive">Confirm Deletion</DialogTitle>
              </DialogHeader>
              <div className="py-4 text-sm text-muted-foreground">
                Are you sure you want to delete Work Order #{request.id}? This action cannot be undone.
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
                <Button variant="destructive" onClick={() => { onDelete(request.id); setDeleteConfirmOpen(false); }}>Delete Order</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-secondary/20 p-4 rounded-lg border border-white/5">
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-primary">
              <ClipboardList className="w-3 h-3" /> Problem Description
            </h4>
            {serviceSummary ? <ServiceSummaryView summary={serviceSummary} /> : (
              <p className="text-sm text-muted-foreground leading-relaxed italic">“{request.description}”</p>
            )}
          </div>
          {(request.workDone || request.partsUsed) ? (
            <div className="space-y-4 md:border-l border-white/10 md:pl-6">
              {request.workDone && (
                <div className="space-y-1">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-green-500/80">Service Summary</h4>
                  <p className="text-sm text-foreground/90">{request.workDone}</p>
                </div>
              )}
              {request.partsUsed && (
                <div className="space-y-1">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-orange-500/80">Parts Used</h4>
                  <p className="text-sm text-foreground/90">{request.partsUsed}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2 md:border-l border-white/10 md:pl-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                <AlertTriangle className="w-3 h-3" /> No update yet
              </div>
              Use “Manage” to add work performed and parts used.
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
  const [filter, setFilter] = useState("all");

  const { data: requests, isLoading: requestsLoading } = useQuery<MaintenanceRequest[]>({
    queryKey: [api.requests.list.path],
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: { id: number; status: string; workDone?: string; partsUsed?: string; checklist?: any[] }) => {
      const res = await fetch(api.requests.update.path.replace(":id", payload.id.toString()), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Update failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.requests.list.path] });
      toast({ title: "Updated", description: "Work order updated successfully." });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/requests/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.requests.list.path] });
      toast({ title: "Deleted", description: "Work order has been removed." });
    },
  });

  if (isLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><Skeleton className="h-10 w-64" /></div>;
  if (!isAuthenticated) return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 px-4">
        <h2 className="text-2xl font-bold uppercase font-display">Admin Access Required</h2>
        <Button size="lg" onClick={() => (window.location.href = "/api/login")}>Log In as Administrator</Button>
      </div>
    </div>
  );

  const filteredRequests = requests?.filter(r => {
    const term = search.toLowerCase();
    const matchesSearch = r.customerName.toLowerCase().includes(term) || r.vehicleInfo.toLowerCase().includes(term) || (r.description || "").toLowerCase().includes(term);
    return matchesSearch && (filter === "all" ? true : r.status === filter);
  }) ?? [];

  const newRequests = filteredRequests.filter(r => r.status === "new");
  const activeRequests = filteredRequests.filter(r => r.status === "pending" || r.status === "in_progress");
  const completedRequests = filteredRequests.filter(r => r.status === "completed");

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold uppercase font-display tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Manage incoming work orders.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="sm:w-[280px]" />
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="sm:w-[200px]"><SelectValue placeholder="Filter status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {requestsLoading ? <div className="space-y-4"><Skeleton className="h-28 w-full" /><Skeleton className="h-28 w-full" /></div> : (
          <div className="space-y-12">
            {newRequests.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3"><div className="h-px flex-1 bg-white/5" /><h2 className="text-xs font-bold uppercase tracking-widest text-primary whitespace-nowrap">Incoming New Requests ({newRequests.length})</h2><div className="h-px flex-1 bg-white/5" /></div>
                <div className="grid grid-cols-1 gap-4">{newRequests.map(r => <MaintenanceRequestCard key={r.id} request={r} onUpdate={v => updateMutation.mutateAsync(v)} onDelete={id => deleteMutation.mutate(id)} />)}</div>
              </div>
            )}
            {activeRequests.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3"><div className="h-px flex-1 bg-white/5" /><h2 className="text-xs font-bold uppercase tracking-widest text-blue-400 whitespace-nowrap">Active Work Orders ({activeRequests.length})</h2><div className="h-px flex-1 bg-white/5" /></div>
                <div className="grid grid-cols-1 gap-4">{activeRequests.map(r => <MaintenanceRequestCard key={r.id} request={r} onUpdate={v => updateMutation.mutateAsync(v)} onDelete={id => deleteMutation.mutate(id)} />)}</div>
              </div>
            )}
            {completedRequests.length > 0 && (
              <div className="space-y-4 opacity-70 hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-3"><div className="h-px flex-1 bg-white/5" /><h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">Completed Archive ({completedRequests.length})</h2><div className="h-px flex-1 bg-white/5" /></div>
                <div className="grid grid-cols-1 gap-4">{completedRequests.map(r => <MaintenanceRequestCard key={r.id} request={r} onUpdate={v => updateMutation.mutateAsync(v)} onDelete={id => deleteMutation.mutate(id)} />)}</div>
              </div>
            )}
            {filteredRequests.length === 0 && <Card className="p-8 text-center text-muted-foreground">No work orders match your search/filter.</Card>}
          </div>
        )}
      </div>
    </div>
  );
}
