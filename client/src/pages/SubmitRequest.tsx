import { Navbar } from "@/components/Navbar";
import { useCreateRequest } from "@/hooks/use-requests";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertMaintenanceRequestSchema } from "@shared/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2, AlertTriangle, Send, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";

// ─── Service catalogue ────────────────────────────────────────────────────────

const CATEGORY_CONFIG = [
  {
    key: "Air",
    label: "Air",
    items: [
      "Air dryer",
      "CAC (charge air cooler)",
      "Air compressor",
      "Air filter",
      "Cabin air filter",
      "Air lines",
      "Air tank",
      "Air bag (suspension)",
    ],
    reminders: {} as Record<string, string>,
  },
  {
    key: "Engine",
    label: "Engine",
    items: [
      "Valve adjustment",
      "Rocker arms",
      "Rocker shaft",
      "Camshaft",
      "Camshaft housing",
    ],
    reminders: {
      "Camshaft housing":
        "Camshaft housing gaskets are single-use and cannot be reused — make sure to source a new gasket before your appointment.",
    } as Record<string, string>,
  },
  {
    key: "Fluids",
    label: "Fluids",
    items: [
      "Engine oil",
      "Transmission fluid",
      "Differential fluid(s)",
      "Coolant",
      "DEF fluid",
    ],
    reminders: {} as Record<string, string>,
  },
  {
    key: "Filters",
    label: "Filters",
    items: ["Oil filter", "Fuel filter(s)", "DEF filter"],
    reminders: {} as Record<string, string>,
  },
  {
    key: "Gaskets / Seals",
    label: "Gaskets / Seals",
    items: [
      "Camshaft housing gasket",
      "Oil pan gasket",
      "Valve cover gasket",
      "Oil pump tube seals",
      "Turbo gasket / o-ring",
      "Exhaust gasket / seal",
      "Front crank seal + cover",
      "Rear crank seal",
      "Oil pump",
    ],
    reminders: {} as Record<string, string>,
  },
  {
    key: "Major Components",
    label: "Major Components",
    items: [
      "Radiator",
      "Turbo",
      "EGR cooler",
      "Fuel pump",
      "Alternator",
      "Water pump",
      "Transmission clutch",
    ],
    reminders: {} as Record<string, string>,
  },
] as const satisfies ReadonlyArray<{
  key: string;
  label: string;
  items: readonly string[];
  reminders: Record<string, string>;
}>;

type CategoryKey = (typeof CATEGORY_CONFIG)[number]["key"];

const ENGINE_OIL_WEIGHTS = ["5W-40", "15W-40"] as const;
const ENGINE_OIL_TYPES = ["Blend", "Synthetic"] as const;

// ─── Form schema ──────────────────────────────────────────────────────────────

const formSchema = insertMaintenanceRequestSchema;

// ─── Component ────────────────────────────────────────────────────────────────

export default function SubmitRequest() {
  const [, setLocation] = useLocation();
  const { mutate, isPending } = useCreateRequest();
  const { toast } = useToast();

  const emptySelected = () =>
    Object.fromEntries(CATEGORY_CONFIG.map((c) => [c.key, [] as string[]])) as Record<CategoryKey, string[]>;
  const emptyNotes = () =>
    Object.fromEntries(CATEGORY_CONFIG.map((c) => [c.key, ""])) as Record<CategoryKey, string>;

  const [openCategories, setOpenCategories] = useState<Set<CategoryKey>>(new Set());
  const [selected, setSelected] = useState<Record<CategoryKey, string[]>>(emptySelected());
  const [groupNotes, setGroupNotes] = useState<Record<CategoryKey, string>>(emptyNotes());
  const [issueText, setIssueText] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [engineOilWeights, setEngineOilWeights] = useState<string[]>([]);
  const [engineOilTypes, setEngineOilTypes] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const complaintRef = useRef<HTMLTextAreaElement | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerName: "",
      contactInfo: "",
      vehicleInfo: "",
      vehicleColor: "",
      truckNumber: "",
      mileage: undefined,
      description: "",
      isUrgent: false,
    },
  });

  function toggleCategory(key: CategoryKey) {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  function toggleService(categoryKey: CategoryKey, item: string) {
    setSelected((prev) => {
      const current = prev[categoryKey];
      const exists = current.includes(item);
      return {
        ...prev,
        [categoryKey]: exists ? current.filter((v) => v !== item) : [...current, item],
      };
    });
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const fluidsSelected = selected["Fluids"] ?? [];
    const usesEngineOil = fluidsSelected.includes("Engine oil");

    const payload = {
      groups: Object.fromEntries(
        CATEGORY_CONFIG.map((cat) => [
          cat.key,
          {
            items: selected[cat.key] ?? [],
            notes: groupNotes[cat.key] ?? "",
            ...(cat.key === "Fluids" && usesEngineOil
              ? { engineOil: { weights: engineOilWeights, types: engineOilTypes } }
              : {}),
          },
        ])
      ),
      issueText,
      additionalNotes: issueText,
      attachments: [] as { name: string; url: string }[],
    };

    if (attachments.length > 0) {
      try {
        setIsUploading(true);
        const formData = new FormData();
        attachments.forEach((file) => formData.append("files", file));
        const res = await fetch("/api/uploads", { method: "POST", body: formData });
        if (!res.ok) throw new Error("Upload failed");
        const data = await res.json();
        payload.attachments = data.files ?? [];
      } catch (error: any) {
        toast({
          title: "Upload failed",
          description: error?.message || "Could not upload attachments.",
          variant: "destructive",
        });
        setIsUploading(false);
        return;
      } finally {
        setIsUploading(false);
      }
    }

    const description = `SERVICE_JSON:${JSON.stringify(payload)}`;

    mutate(
      { ...values, description },
      {
        onSuccess: () => {
          form.reset();
          setSelected(emptySelected());
          setGroupNotes(emptyNotes());
          setOpenCategories(new Set());
          setIssueText("");
          setAttachments([]);
          setEngineOilWeights([]);
          setEngineOilTypes([]);
          setTimeout(() => setLocation("/"), 1200);
        },
      }
    );
  }

  const resizeComplaint = (value: string) => {
    const el = complaintRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
    setIssueText(value);
  };

  useEffect(() => {
    if (complaintRef.current) {
      complaintRef.current.style.height = "auto";
      complaintRef.current.style.height = `${complaintRef.current.scrollHeight}px`;
    }
  }, [issueText]);

  const totalSelected = Object.values(selected).reduce((sum, items) => sum + items.length, 0);

  return (
    <div className="min-h-screen bg-background text-foreground bg-grid-pattern">
      <Navbar />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 text-center"
          >
            <h1 className="font-display text-2xl md:text-3xl font-bold uppercase mb-1">New Service Request</h1>
            <p className="text-muted-foreground text-sm font-light">Select services or describe the issue below.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-card/70 backdrop-blur-md border border-white/15 p-8 rounded-sm shadow-2xl shadow-black/40"
          >
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

                {/* ── Contact / vehicle info ─────────────────────────── */}
                <div className="space-y-3 border-b border-white/5 pb-4">
                  <div className="grid md:grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="customerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="uppercase text-xs font-bold tracking-widest text-foreground/70">
                            Customer Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Name..."
                              {...field}
                              className="bg-background/30 border-white/5 h-9 text-sm"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contactInfo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="uppercase text-xs font-bold tracking-widest text-foreground/70">
                            Phone / Email / Company
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Phone, email, or company name"
                              {...field}
                              className="bg-background/30 border-white/5 h-9 text-sm"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid md:grid-cols-3 gap-3">
                    <FormField
                      control={form.control}
                      name="vehicleInfo"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel className="uppercase text-xs font-bold tracking-widest text-foreground/70">
                            Truck Info
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Year/Make/Model"
                              {...field}
                              className="bg-background/30 border-white/5 h-9 text-sm"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="vehicleColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="uppercase text-xs font-bold tracking-widest text-foreground/70">
                            Color
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. White"
                              {...field}
                              className="bg-background/30 border-white/5 h-9 text-sm"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid md:grid-cols-3 gap-3">
                    <FormField
                      control={form.control}
                      name="truckNumber"
                      render={({ field }) => (
                        <FormItem className="md:col-span-1">
                          <FormLabel className="uppercase text-xs font-bold tracking-widest text-foreground/70">
                            Truck #
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Unit / fleet #"
                              {...field}
                              className="bg-background/30 border-white/5 h-9 text-sm"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="mileage"
                      render={({ field }) => (
                        <FormItem className="md:col-span-1">
                          <FormLabel className="uppercase text-xs font-bold tracking-widest text-foreground/70">
                            Miles
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="e.g. 452000"
                              className="bg-background/30 border-white/5 h-9 text-sm"
                              value={field.value ?? ""}
                              onChange={(e) =>
                                field.onChange(e.target.value === "" ? undefined : Number(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* ── Service selection ──────────────────────────────── */}
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <FormLabel className="uppercase text-xs font-bold tracking-widest text-foreground/70">
                        Select Services
                      </FormLabel>
                      {totalSelected > 0 && (
                        <span className="text-xs text-primary font-bold tracking-widest uppercase">
                          {totalSelected} selected
                        </span>
                      )}
                    </div>

                    {/* Category tiles */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {CATEGORY_CONFIG.map((cat) => {
                        const count = (selected[cat.key] ?? []).length;
                        const isOpen = openCategories.has(cat.key);
                        return (
                          <button
                            key={cat.key}
                            type="button"
                            onClick={() => toggleCategory(cat.key)}
                            className={cn(
                              "relative flex flex-col items-center justify-center gap-1 rounded-sm border px-2 py-4 text-center transition-all",
                              isOpen || count > 0
                                ? "border-primary/60 bg-primary/10 text-primary"
                                : "border-white/10 bg-secondary/20 text-foreground/60 hover:border-white/25 hover:text-foreground/80"
                            )}
                          >
                            <span className="text-sm font-bold uppercase tracking-widest leading-tight">
                              {cat.label}
                            </span>
                            {count > 0 && (
                              <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                                {count}
                              </span>
                            )}
                            <ChevronDown
                              className={cn(
                                "h-3 w-3 mt-0.5 transition-transform opacity-50",
                                isOpen ? "rotate-180" : ""
                              )}
                            />
                          </button>
                        );
                      })}
                    </div>

                    {/* Expanded service panels */}
                    {CATEGORY_CONFIG.map((cat) => {
                      if (!openCategories.has(cat.key)) return null;
                      return (
                        <div
                          key={cat.key}
                          className="rounded-sm border border-white/15 bg-secondary/15 p-4 space-y-3"
                        >
                          <div className="text-sm font-bold uppercase tracking-widest text-primary border-b border-white/10 pb-2">
                            {cat.label}
                          </div>

                          <div className="space-y-2.5">
                            {cat.items.map((item) => {
                              const active = (selected[cat.key] ?? []).includes(item);
                              const reminder = (cat.reminders as Record<string, string>)[item];
                              return (
                                <div key={item}>
                                  <label
                                    className={cn(
                                      "flex items-center gap-3 text-sm cursor-pointer select-none",
                                      active ? "text-foreground" : "text-foreground/70"
                                    )}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={active}
                                      onChange={() => toggleService(cat.key, item)}
                                      className="h-4 w-4 accent-primary flex-shrink-0"
                                    />
                                    <span>{item}</span>
                                  </label>
                                  {active && reminder && (
                                    <div className="ml-7 mt-2 flex items-start gap-2 rounded-sm border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-sm text-amber-300/90">
                                      <span className="flex-shrink-0">⚠</span>
                                      <span>{reminder}</span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Engine oil sub-options */}
                          {cat.key === "Fluids" && (selected["Fluids"] ?? []).includes("Engine oil") && (
                            <div className="space-y-2 border-l-2 border-primary/30 pl-3 pt-1">
                              <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">
                                Engine Oil Details
                              </div>
                              <div className="space-y-1.5">
                                {ENGINE_OIL_WEIGHTS.map((weight) => {
                                  const active = engineOilWeights.includes(weight);
                                  return (
                                    <label
                                      key={weight}
                                      className={cn(
                                        "flex items-center gap-2 text-sm cursor-pointer select-none",
                                        active ? "text-foreground/90" : "text-muted-foreground/80"
                                      )}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={active}
                                        onChange={() =>
                                          setEngineOilWeights((prev) =>
                                            prev.includes(weight)
                                              ? prev.filter((v) => v !== weight)
                                              : [...prev, weight]
                                          )
                                        }
                                        className="h-4 w-4 accent-primary"
                                      />
                                      <span>{weight}</span>
                                    </label>
                                  );
                                })}
                              </div>
                              <div className="space-y-1.5">
                                {ENGINE_OIL_TYPES.map((type) => {
                                  const active = engineOilTypes.includes(type);
                                  return (
                                    <label
                                      key={type}
                                      className={cn(
                                        "flex items-center gap-2 text-sm cursor-pointer select-none",
                                        active ? "text-foreground/90" : "text-muted-foreground/80"
                                      )}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={active}
                                        onChange={() =>
                                          setEngineOilTypes((prev) =>
                                            prev.includes(type)
                                              ? prev.filter((v) => v !== type)
                                              : [...prev, type]
                                          )
                                        }
                                        className="h-4 w-4 accent-primary"
                                      />
                                      <span>{type}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Per-category notes */}
                          <div className="flex items-center gap-2 border-t border-white/10 pt-2">
                            <span className="text-xs uppercase tracking-widest text-muted-foreground/60 flex-shrink-0">
                              Notes
                            </span>
                            <Input
                              placeholder="Add note (optional)"
                              className="h-8 bg-background/30 border-white/10 text-sm focus:border-primary/50"
                              value={groupNotes[cat.key] ?? ""}
                              onChange={(e) =>
                                setGroupNotes((prev) => ({ ...prev, [cat.key]: e.target.value }))
                              }
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* ── Main complaint ─────────────────────────────── */}
                  <div className="space-y-2">
                    <FormLabel className="uppercase text-xs font-bold tracking-widest text-foreground/70">
                      Main Complaint / Additional Instructions
                    </FormLabel>
                    <Textarea
                      ref={complaintRef}
                      placeholder="What's the issue? Anything the tech should know?"
                      className="min-h-[90px] bg-background/40 border-white/10 resize-none text-sm focus:border-primary/50 transition-colors overflow-hidden"
                      value={issueText}
                      onChange={(e) => resizeComplaint(e.target.value)}
                    />
                  </div>

                  {/* ── Attachments ────────────────────────────────── */}
                  <div className="space-y-2">
                    <FormLabel className="uppercase text-xs font-bold tracking-widest text-foreground/70">
                      Attach Photos
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        multiple
                        className="bg-background/30 border-white/5 h-10 text-sm"
                        onChange={(e) => setAttachments(Array.from(e.target.files ?? []))}
                      />
                    </FormControl>
                    {attachments.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {attachments.length} file{attachments.length > 1 ? "s" : ""} selected
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Urgent toggle ──────────────────────────────────── */}
                <FormField
                  control={form.control}
                  name="isUrgent"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-sm border border-white/5 bg-secondary/10 p-3">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm font-bold uppercase text-red-500/80 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" /> Urgent Request
                        </FormLabel>
                        <FormDescription className="text-xs">
                          Vehicle is currently broken down or roadside.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value ?? false}
                          onCheckedChange={(checked) => field.onChange(checked)}
                          className="data-[state=checked]:bg-red-600 scale-75"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex justify-center">
                  <Button
                    type="submit"
                    disabled={isPending || isUploading}
                    className="w-full md:w-auto md:px-10 h-12 text-base font-bold uppercase tracking-wider bg-primary hover:bg-primary/90 mt-3 rounded-sm"
                  >
                    {isPending || isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        {isUploading ? "Uploading..." : "Processing..."}
                      </>
                    ) : (
                      <>
                        Submit Service Request <Send className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
