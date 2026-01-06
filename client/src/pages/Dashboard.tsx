import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
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
import type { MaintenanceRequest } from "@shared/schema";
import { LogOut, ClipboardList, PenBox, CheckCircle2, Clock, AlertTriangle, Search, Filter } from "lucide-react";
import { useState } from "react";
import { Navbar } from "@/components/Navbar";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const { data: requests, isLoading } = useQuery<MaintenanceRequest[]>({
    queryKey: [api.requests.list.path],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto p-6 space-y-6">
          <Skeleton className="h-12 w-48" />
          <div className="grid gap-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <h2 className="text-2xl font-bold uppercase font-display">Admin Access Required</h2>
          <Button size="lg" onClick={() => window.location.href = "/api/login"}>Login with Replit</Button>
        </div>
      </div>
    );
  }

  const filteredRequests = requests?.filter(r => {
    const matchesSearch = 
      r.customerName.toLowerCase().includes(search.toLowerCase()) ||
      r.vehicleInfo.toLowerCase().includes(search.toLowerCase()) ||
      r.id.toString().includes(search);
    
    const matchesFilter = filter === "all" ? true : r.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-background text-foreground bg-grid-pattern">
      <Navbar />
      <div className="container mx-auto p-6 space-y-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight font-display uppercase">Maintenance Dashboard</h1>
            <p className="text-muted-foreground">Manage and track service requests for the fleet</p>
          </div>
          <div className="flex items-center gap-4 bg-card/50 p-2 rounded-lg border border-white/5 backdrop-blur-sm">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{user.firstName || user.email}</p>
              <p className="text-xs text-muted-foreground">Administrator</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => logout()} className="border-white/10">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search requests..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-secondary/30 border-white/10 h-10"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
            {["all", "pending", "in_progress", "completed"].map((f) => (
              <Button
                key={f}
                variant={filter === f ? "default" : "outline"}
                onClick={() => setFilter(f)}
                className="uppercase text-xs font-bold tracking-wider h-10 border-white/10"
              >
                {f.replace("_", " ")}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid gap-6">
          {filteredRequests?.map((request) => (
            <RequestCard key={request.id} request={request} />
          ))}
          {filteredRequests?.length === 0 && (
            <div className="text-center py-20 bg-card/20 border border-dashed border-white/10 rounded-sm">
              <Filter className="w-10 h-10 mx-auto text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-xl font-bold uppercase text-muted-foreground">No requests found</h3>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RequestCard({ request }: { request: MaintenanceRequest }) {
  const { toast } = useToast();
  const updateMutation = useMutation({
    mutationFn: async (values: any) => {
      const res = await fetch(buildUrl(api.requests.update.path, { id: request.id }), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.requests.list.path] });
      toast({ title: "Updated", description: "Request updated successfully" });
    },
  });

  const form = useForm({
    defaultValues: {
      status: request.status,
      workDone: request.workDone || "",
      partsUsed: request.partsUsed || "",
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "in_progress": return <Clock className="w-4 h-4 text-blue-500" />;
      default: return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    }
  };

  return (
    <Card className="hover-elevate bg-card/80 backdrop-blur border-white/5 overflow-visible">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-4">
        <div className="space-y-1">
          <div className="flex items-center flex-wrap gap-2">
            <span className="text-xs font-mono text-muted-foreground">WO #{request.id.toString().padStart(4, '0')}</span>
            <CardTitle className="text-xl uppercase font-display">{request.customerName}</CardTitle>
            {request.isUrgent && <Badge variant="destructive" className="animate-pulse">Urgent</Badge>}
            <Badge variant="outline" className="flex gap-1 items-center border-white/10">
              {getStatusIcon(request.status)}
              <span className="uppercase text-[10px] font-bold tracking-tighter">{request.status.replace("_", " ")}</span>
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary/40" />
            {request.vehicleInfo}
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="border-white/10 hover:bg-primary/10">
              <PenBox className="w-4 h-4 mr-2" />
              Manage
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="uppercase font-display">Update Work Order #{request.id}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((v) => updateMutation.mutate(v))} className="space-y-6 pt-4">
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
                        <Textarea {...field} placeholder="Describe the service steps taken..." className="bg-secondary/30 min-h-[100px]" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="partsUsed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs uppercase font-bold tracking-wider">Parts & Materials</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Oil filter, 5L 10W40, etc..." className="bg-secondary/30" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full h-12 uppercase font-bold tracking-widest" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Saving Records..." : "Update Maintenance Log"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-secondary/20 p-4 rounded-lg border border-white/5">
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-primary">
              <ClipboardList className="w-3 h-3" /> Reported Issue
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed italic">"{request.description}"</p>
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
                  <h4 className="text-xs font-bold uppercase tracking-widest text-blue-500/80">Inventory Used</h4>
                  <p className="text-sm text-foreground/90 font-mono bg-black/20 p-1 px-2 rounded">{request.partsUsed}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center border-l border-white/10 pl-6 text-muted-foreground/40 italic text-sm">
              No work logs recorded yet
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
