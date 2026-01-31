import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { InvoiceDialog } from "@/components/InvoiceDialog";
import type { MaintenanceRequest } from "@shared/schema";
import { useEffect, useRef, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { getLoginPath } from "@/lib/auth-utils";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  ClipboardList,
  Truck,
  Calendar,
  Clock,
  CheckCircle2,
  Wrench,
  Phone,
  Mail,
  Building2,
  X
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

const SERVICE_PREFIX = "SERVICE_JSON:";
const SERVICE_GROUP_ORDER = ["Filters", "Fluids", "Gaskets / Seals", "Major Components"] as const;
const NEW_REQUEST_WINDOW_HOURS = 24;
const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  in_progress: "Open",
  completed: "Complete",
  all: "All",
  active: "Active",
};

type ServiceGroup = {
  items?: string[];
  notes?: string;
  completed?: boolean;
  engineOil?: { weights?: string[]; types?: string[] };
};

type ServicePayload = {
  groups?: Record<string, ServiceGroup>;
  additionalNotes?: string;
  internalNotes?: string;
  issueText?: string;
  attachments?: { name: string; url: string }[];
};

type UpdatePayload = {
  id: number;
  status?: string;
  workDone?: string;
  partsUsed?: string;
  description?: string;
};

function parseServicePayload(description?: string | null): ServicePayload | null {
  if (!description || !description.startsWith(SERVICE_PREFIX)) return null;
  try {
    return JSON.parse(description.slice(SERVICE_PREFIX.length));
  } catch {
    return null;
  }
}

function serializeServicePayload(payload: ServicePayload): string {
  return `${SERVICE_PREFIX}${JSON.stringify(payload)}`;
}

function formatVehicleLine(request: MaintenanceRequest): string {
  const base = request.vehicleInfo?.trim() || "";
  const color = request.vehicleColor?.trim();
  if (color) return `${base} • ${color}`;
  return base;
}

function getContactMeta(contactInfo?: string | null) {
  const value = contactInfo?.trim();
  if (!value) return null;
  if (value.includes("@")) return { label: value, Icon: Mail };
  if (/\d/.test(value)) return { label: value, Icon: Phone };
  return { label: value, Icon: Building2 };
}

function formatRequestDate(dateValue?: Date | string | null) {
  if (!dateValue) return "N/A";
  const date = typeof dateValue === "string" ? new Date(dateValue) : dateValue;
  if (Number.isNaN(date.getTime())) return "N/A";
  try {
    return format(date, "MM/dd/yyyy HHmm");
  } catch {
    return date.toLocaleString();
  }
}

function getCustomerNote(payload: ServicePayload | null, fallback?: string | null): string {
  if (!payload) return fallback ?? "";
  return payload.issueText ?? payload.additionalNotes ?? fallback ?? "";
}

function isNewRequest(request: MaintenanceRequest): boolean {
  if (!request.createdAt) return false;
  const created = new Date(request.createdAt).getTime();
  const windowMs = NEW_REQUEST_WINDOW_HOURS * 60 * 60 * 1000;
  return Date.now() - created < windowMs && request.status === "pending";
}

function ExpandableText({
  text,
  placeholder,
}: {
  text?: string | null;
  placeholder: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const display = text?.trim();

  if (!display) {
    return <p className="text-xs text-muted-foreground/70">{placeholder}</p>;
  }

  return (
    <button
      type="button"
      onClick={() => setExpanded((prev) => !prev)}
      className={`text-left text-sm text-foreground/80 ${
        expanded ? "" : "line-clamp-1"
      }`}
    >
      {display}
    </button>
  );
}

function EditableNote({
  value,
  placeholder,
  onSave,
  className,
  textareaClassName,
  valueClassName,
  placeholderClassName,
}: {
  value?: string | null;
  placeholder: string;
  onSave: (next: string) => void;
  className?: string;
  textareaClassName?: string;
  valueClassName?: string;
  placeholderClassName?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!isEditing) {
      setDraft(value ?? "");
    }
  }, [isEditing, value]);

  useEffect(() => {
    if (!isEditing || !textareaRef.current) return;
    const el = textareaRef.current;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [draft, isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    const next = draft.trim();
    if (next !== (value ?? "")) {
      onSave(next);
    }
  };

  if (isEditing) {
    return (
      <Textarea
        ref={textareaRef}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={handleBlur}
        autoFocus
        className={cn(
          "bg-background/40 border-white/10 text-xs min-h-[90px]",
          textareaClassName
        )}
        placeholder={placeholder}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setIsEditing(true)}
      className={cn(
        "text-left text-xs transition-colors line-clamp-1",
        value?.trim()
          ? cn("text-foreground/70 hover:text-foreground", valueClassName)
          : cn("text-muted-foreground/70 hover:text-foreground", placeholderClassName),
        className
      )}
    >
      {value?.trim() ? value : placeholder}
    </button>
  );
}

function ServiceDetails({
  request,
  payload,
  onSaveGroupNotes,
  onToggleGroupDone,
  onSaveInternalNotes,
}: {
  request: MaintenanceRequest;
  payload: ServicePayload | null;
  onSaveGroupNotes: (groupKey: string, note: string) => void;
  onToggleGroupDone: (groupKey: string, next: boolean) => void;
  onSaveInternalNotes: (note: string) => void;
}) {
  const groups = payload?.groups ?? {};
  const customerNote = getCustomerNote(payload, request.description);

  if (!payload) {
    return (
      <div className="space-y-4">
        <ExpandableText
          text={customerNote}
          placeholder="No customer note provided."
        />
      <EditableNote
        value={undefined}
        placeholder="Add notes"
        onSave={onSaveInternalNotes}
        className="text-[11px]"
      />
    </div>
  );
}

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="text-[11px] uppercase font-bold tracking-widest text-muted-foreground">
          Customer Note
        </div>
        <ExpandableText
          text={customerNote}
          placeholder="No customer note provided."
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {SERVICE_GROUP_ORDER.map((label) => {
          const group = groups[label] ?? {};
          const items = group.items ?? [];
          const isDone = Boolean(group.completed);
          const engineOil = label === "Fluids" ? group.engineOil : undefined;

          return (
            <div key={label} className="space-y-2">
              <button
                type="button"
                onClick={() => onToggleGroupDone(label, !isDone)}
                className={`text-left text-[11px] uppercase font-bold tracking-widest transition-colors ${
                  isDone ? "text-foreground/70 line-through" : "text-primary"
                }`}
              >
                {label}
              </button>
              <div className="space-y-1 text-sm text-muted-foreground">
                {items.length > 0 ? (
                  <ul className="space-y-1">
                    {items.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-[13px]">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary/70" />
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {engineOil?.weights?.length ? (
                  <div className="text-[11px] text-muted-foreground/80">
                    Engine oil: {engineOil.weights.join(", ")}
                    {engineOil.types?.length ? ` • ${engineOil.types.join(", ")}` : ""}
                  </div>
                ) : null}
              </div>
              <EditableNote
                value={group.notes}
                placeholder="Add notes done"
                onSave={(note) => onSaveGroupNotes(label, note)}
                className="text-[10px]"
                placeholderClassName="text-muted-foreground/60"
                valueClassName="text-foreground/70"
                textareaClassName="min-h-[80px]"
              />
            </div>
          );
        })}
      </div>

      <div className="border-t border-white/10 pt-3 space-y-2">
        <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/70">
          Additional Notes
        </div>
        <EditableNote
          value={payload.internalNotes}
          placeholder="Add notes"
          onSave={onSaveInternalNotes}
          className="text-[11px]"
        />
      </div>
    </div>
  );
}

function RequestCard({
  request,
  onUpdate,
  isUpdating,
  isDialogOpen,
  onDialogOpenChange,
  onDelete,
  isDeleting,
}: {
  request: MaintenanceRequest;
  onUpdate: (payload: UpdatePayload) => void;
  isUpdating: boolean;
  isDialogOpen: boolean;
  onDialogOpenChange: (nextId: number | null) => void;
  onDelete: (id: number) => void;
  isDeleting: boolean;
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

  const servicePayload = parseServicePayload(request.description);
  const vehicleLine = formatVehicleLine(request);
  const contactMeta = getContactMeta(request.contactInfo);
  const showNew = isNewRequest(request);
  const hasUpdates = Boolean(request.workDone || request.partsUsed);
  const handleDialogOpenChange = (next: boolean) => {
    onDialogOpenChange(next ? request.id : null);
  };

  const handleNameClick = () => {
    onDialogOpenChange(isDialogOpen ? null : request.id);
  };

  const handleSaveGroupNotes = (groupKey: string, note: string) => {
    if (!servicePayload) return;
    const groups = servicePayload.groups ?? {};
    const currentGroup = groups[groupKey] ?? {};
    const nextPayload: ServicePayload = {
      ...servicePayload,
      groups: {
        ...groups,
        [groupKey]: {
          ...currentGroup,
          notes: note,
        },
      },
    };
    onUpdate({ id: request.id, description: serializeServicePayload(nextPayload) });
  };

  const handleSaveInternalNotes = (note: string) => {
    if (!servicePayload) {
      const nextPayload: ServicePayload = {
        issueText: request.description ?? "",
        internalNotes: note,
        groups: {},
      };
      onUpdate({ id: request.id, description: serializeServicePayload(nextPayload) });
      return;
    }

    const nextPayload: ServicePayload = {
      ...servicePayload,
      internalNotes: note,
    };
    onUpdate({ id: request.id, description: serializeServicePayload(nextPayload) });
  };

  const handleToggleGroupDone = (groupKey: string, next: boolean) => {
    if (!servicePayload) return;
    const groups = servicePayload.groups ?? {};
    const currentGroup = groups[groupKey] ?? {};
    const nextPayload: ServicePayload = {
      ...servicePayload,
      groups: {
        ...groups,
        [groupKey]: {
          ...currentGroup,
          completed: next,
        },
      },
    };
    onUpdate({ id: request.id, description: serializeServicePayload(nextPayload) });
  };

  return (
    <div className="w-full">
      <Card
        key={request.id}
        className="bg-card/80 backdrop-blur border-white/5 overflow-visible"
      >
        <CardHeader className="flex flex-col sm:flex-row sm:items-start gap-4 space-y-0 pb-4">
          <div className="space-y-2">
            <div className="flex items-center flex-wrap gap-3">
              {showNew && (
                <span className="text-xs font-bold uppercase tracking-widest text-yellow-400">
                  NEW
                </span>
              )}
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                WO #{request.id.toString().padStart(4, "0")}
              </span>
              {contactMeta ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" onClick={handleNameClick} className="text-left">
                        <CardTitle className="text-xl uppercase font-display cursor-pointer">
                          {request.customerName}
                        </CardTitle>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="text-xs">
                      {contactMeta.label}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <button type="button" onClick={handleNameClick} className="text-left">
                  <CardTitle className="text-xl uppercase font-display cursor-pointer">
                    {request.customerName}
                  </CardTitle>
                </button>
              )}
              {request.isUrgent && (
                <Badge variant="destructive" className="animate-pulse">
                  Urgent
                </Badge>
              )}
              <Select
                value={request.status}
                onValueChange={(value) => onUpdate({ id: request.id, status: value })}
              >
                <SelectTrigger
                  hideChevron
                  className="h-auto w-auto px-0 py-0 text-[10px] uppercase tracking-widest border-transparent bg-transparent shadow-none focus:ring-0 focus:ring-offset-0"
                >
                  <SelectValue placeholder="Status">
                    <span className="flex items-center gap-1">
                      {getStatusIcon(request.status)}
                      {STATUS_LABELS[request.status] ?? request.status}
                    </span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(["pending", "in_progress", "completed"] as const)
                    .filter((status) => status !== request.status)
                    .map((status) => (
                      <SelectItem key={status} value={status}>
                        {STATUS_LABELS[status] ?? status}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onDelete(request.id)}
                disabled={isDeleting}
                className="h-6 w-6 text-destructive/50 hover:text-destructive"
                aria-label="Delete request"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>

            {vehicleLine ? (
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground/70 flex items-center gap-2">
                <Truck className="w-4 h-4 opacity-70" />
                {vehicleLine.toUpperCase()}
              </p>
            ) : null}

            {contactMeta ? (
              <div className="text-[11px] text-muted-foreground/70 flex items-center gap-2">
                <contactMeta.Icon className="w-3 h-3 opacity-70" />
                {contactMeta.label}
              </div>
            ) : null}

            <div className="text-[11px] text-muted-foreground/70 flex items-center gap-2">
              <Calendar className="w-3 h-3 opacity-70" />
              {formatRequestDate(request.createdAt)}
            </div>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
            <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full bg-background border-white/10">
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
          <div
            className={`grid gap-6 bg-secondary/20 p-4 rounded-lg border border-white/5 ${
              hasUpdates ? "grid-cols-1 md:grid-cols-[1.35fr_0.65fr]" : "grid-cols-1"
            }`}
          >
            <div className="space-y-3">
              <ServiceDetails
                request={request}
                payload={servicePayload}
                onSaveGroupNotes={handleSaveGroupNotes}
                onToggleGroupDone={handleToggleGroupDone}
                onSaveInternalNotes={handleSaveInternalNotes}
              />
            </div>

            {hasUpdates && (
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
    </div>
  );
}

export default function Dashboard() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("active");
  const [openRequestId, setOpenRequestId] = useState<number | null>(null);

  const { data: requests, isLoading: requestsLoading } = useQuery<MaintenanceRequest[]>({
    queryKey: [api.requests.list.path],
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: UpdatePayload) => {
      const path = api.requests.update.path.replace(":id", payload.id.toString());
      const body: Record<string, unknown> = {};
      if (payload.status !== undefined) body.status = payload.status;
      if (payload.workDone !== undefined) body.workDone = payload.workDone;
      if (payload.partsUsed !== undefined) body.partsUsed = payload.partsUsed;
      if (payload.description !== undefined) body.description = payload.description;

      const res = await fetch(path, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
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

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const path = api.requests.delete.path.replace(":id", id.toString());
      const res = await fetch(path, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Delete failed (${res.status})`);
      }
      return res.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [api.requests.list.path] });
      toast({ title: "Deleted", description: "Work order removed." });
    },
    onError: (err: any) => {
      toast({
        title: "Delete failed",
        description: err?.message || "Could not delete work order.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteRequest = (id: number) => {
    if (!window.confirm("Delete this work order? This cannot be undone.")) return;
    deleteMutation.mutate(id);
  };

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
        filter === "all"
          ? true
          : filter === "active"
            ? r.status !== "completed"
            : r.status === filter;

      return matchesSearch && matchesFilter;
    }) ?? [];

  const activeRequests = filteredRequests.filter((r) => r.status !== "completed");
  const completedRequests = filteredRequests.filter((r) => r.status === "completed");
  const showActiveSection = filter !== "completed";
  const showCompletedSection = filter === "all" || filter === "completed";

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
                <SelectValue placeholder="Filter status">
                  {STATUS_LABELS[filter] ?? filter}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {(["active", "pending", "in_progress", "completed", "all"] as const)
                  .filter((value) => value !== filter)
                  .map((value) => (
                    <SelectItem key={value} value={value}>
                      {STATUS_LABELS[value] ?? value}
                    </SelectItem>
                  ))}
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
          <div className="space-y-8">
            {showActiveSection && (
              <div className="space-y-3 max-w-3xl mx-auto">
                <div className="text-xs uppercase tracking-[0.3em] text-primary">
                  Incoming Requests ({activeRequests.length})
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {activeRequests.map((request) => (
                    <RequestCard
                      key={request.id}
                      request={request}
                      onUpdate={(payload) => updateMutation.mutate(payload)}
                      isUpdating={updateMutation.isPending}
                      isDialogOpen={openRequestId === request.id}
                      onDialogOpenChange={setOpenRequestId}
                      onDelete={handleDeleteRequest}
                      isDeleting={deleteMutation.isPending}
                    />
                  ))}
                </div>
              </div>
            )}

            {showCompletedSection && completedRequests.length > 0 && (
              <div className="space-y-3 max-w-3xl mx-auto">
                <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  Completed ({completedRequests.length})
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {completedRequests.map((request) => (
                    <RequestCard
                      key={request.id}
                      request={request}
                      onUpdate={(payload) => updateMutation.mutate(payload)}
                      isUpdating={updateMutation.isPending}
                      isDialogOpen={openRequestId === request.id}
                      onDialogOpenChange={setOpenRequestId}
                      onDelete={handleDeleteRequest}
                      isDeleting={deleteMutation.isPending}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
