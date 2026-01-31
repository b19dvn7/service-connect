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
import { Loader2, AlertTriangle, Send } from "lucide-react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const SERVICE_GROUPS = {
  filters: ["Oil filter", "Fuel filter(s)", "Air filter", "DEF filter"],
  fluids: ["Engine oil", "Transmission fluid", "Differential fluid(s)", "Coolant"],
  gaskets: [
    "Oil pan gasket",
    "Valve cover gasket",
    "Oil pump tube seals",
    "Turbo gasket / o-ring",
    "Exhaust gasket / seal",
    "Front crank seal + cover",
    "Rear crank seal",
    "Oil pump",
  ],
  components: [
    "Radiator",
    "CAC (charge air cooler)",
    "Turbo",
    "EGR cooler",
    "Fuel pump",
    "Air compressor",
    "Transmission clutch",
    "Alternator",
    "Water pump",
    "Valve adjustment",
  ],
} as const;

const ENGINE_OIL_WEIGHTS = ["5W-40", "15W-40"] as const;
const ENGINE_OIL_TYPES = ["Blend", "Synthetic"] as const;

// Extend schema for client-side form if needed, or use directly
const formSchema = insertMaintenanceRequestSchema;

export default function SubmitRequest() {
  const [, setLocation] = useLocation();
  const { mutate, isPending } = useCreateRequest();
  const { toast } = useToast();

  const [selected, setSelected] = useState({
    filters: [] as string[],
    fluids: [] as string[],
    gaskets: [] as string[],
    components: [] as string[],
  });
  const [groupNotes, setGroupNotes] = useState({
    filters: "",
    fluids: "",
    gaskets: "",
    components: "",
  });
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [engineOilWeights, setEngineOilWeights] = useState<string[]>([]);
  const [engineOilTypes, setEngineOilTypes] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerName: "",
      contactInfo: "",
      vehicleInfo: "",
      vehicleColor: "",
      mileage: undefined,
      description: "",
      isUrgent: false,
    },
  });

  function toggleService(group: keyof typeof SERVICE_GROUPS, item: string) {
    setSelected((prev) => {
      const current = prev[group];
      const exists = current.includes(item);
      const nextItems = exists ? current.filter((value) => value !== item) : [...current, item];
      return { ...prev, [group]: nextItems };
    });
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const usesEngineOil = selected.fluids.includes("Engine oil");

    const payload = {
      groups: {
        Filters: { items: selected.filters, notes: groupNotes.filters },
        Fluids: {
          items: selected.fluids,
          notes: groupNotes.fluids,
          engineOil: usesEngineOil
            ? { weights: engineOilWeights, types: engineOilTypes }
            : undefined,
        },
        "Gaskets / Seals": { items: selected.gaskets, notes: groupNotes.gaskets },
        "Major Components": { items: selected.components, notes: groupNotes.components },
      },
      additionalNotes,
      attachments: [] as { name: string; url: string }[],
    };

    if (attachments.length > 0) {
      try {
        setIsUploading(true);
        const formData = new FormData();
        attachments.forEach((file) => formData.append("files", file));
        const res = await fetch("/api/uploads", { method: "POST", body: formData });
        if (!res.ok) {
          throw new Error("Upload failed");
        }
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
          setSelected({ filters: [], fluids: [], gaskets: [], components: [] });
          setGroupNotes({ filters: "", fluids: "", gaskets: "", components: "" });
          setAdditionalNotes("");
          setAttachments([]);
          setEngineOilWeights([]);
          setEngineOilTypes([]);
          setTimeout(() => setLocation("/dashboard"), 1500);
        },
      },
    );
  }

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
            <h1 className="font-display text-xl md:text-2xl font-bold uppercase mb-1">New Service Request</h1>
            <p className="text-muted-foreground text-[12px] font-light">Select services or describe the issue below.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-card/70 backdrop-blur-md border border-white/15 p-8 rounded-sm shadow-2xl shadow-black/40"
          >
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                <div className="space-y-6">
                  <div className="space-y-3">
                    <FormLabel className="uppercase text-xs font-bold tracking-widest text-foreground/70">
                      Select Services
                    </FormLabel>
                    <div className="grid md:grid-cols-2 gap-4">
                      {(Object.keys(SERVICE_GROUPS) as Array<keyof typeof SERVICE_GROUPS>).map((groupKey) => {
                        const labelMap = {
                          filters: "Filters",
                          fluids: "Fluids",
                          gaskets: "Gaskets / Seals",
                          components: "Major Components",
                        };
                        return (
                          <div
                            key={groupKey}
                            className="rounded-sm border border-white/15 bg-secondary/20 p-4 space-y-3 shadow-[0_0_20px_rgba(0,0,0,0.25)]"
                          >
                            <div className="text-[11px] font-bold uppercase tracking-widest text-primary/90">
                              {labelMap[groupKey]}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {SERVICE_GROUPS[groupKey].map((service) => {
                                const active = selected[groupKey].includes(service);
                                return (
                                  <button
                                    key={service}
                                    type="button"
                                    className={cn(
                                      "cursor-pointer transition-all py-1 px-2 text-[11px] font-semibold rounded-sm border uppercase tracking-tight",
                                      active
                                        ? "text-primary bg-primary/15 border-primary/40"
                                        : "text-foreground/70 hover:text-foreground bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10"
                                    )}
                                    onClick={() => toggleService(groupKey, service)}
                                  >
                                    {service}
                                  </button>
                                );
                              })}
                            </div>

                            {groupKey === "fluids" && selected.fluids.includes("Engine oil") && (
                              <div className="space-y-2 rounded-sm border border-white/15 bg-background/50 p-3">
                                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                  Engine Oil Details
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {ENGINE_OIL_WEIGHTS.map((weight) => {
                                    const active = engineOilWeights.includes(weight);
                                    return (
                                      <button
                                        key={weight}
                                        type="button"
                                        className={cn(
                                          "py-1 px-2 text-[10px] font-semibold rounded-sm border uppercase tracking-tight",
                                          active
                                            ? "text-primary bg-primary/15 border-primary/40"
                                            : "text-foreground/70 hover:text-foreground bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10"
                                        )}
                                        onClick={() =>
                                          setEngineOilWeights((prev) =>
                                            prev.includes(weight)
                                              ? prev.filter((value) => value !== weight)
                                              : [...prev, weight]
                                          )
                                        }
                                      >
                                        {weight}
                                      </button>
                                    );
                                  })}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {ENGINE_OIL_TYPES.map((type) => {
                                    const active = engineOilTypes.includes(type);
                                    return (
                                      <button
                                        key={type}
                                        type="button"
                                        className={cn(
                                          "py-1 px-2 text-[10px] font-semibold rounded-sm border uppercase tracking-tight",
                                          active
                                            ? "text-primary bg-primary/15 border-primary/40"
                                            : "text-foreground/70 hover:text-foreground bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10"
                                        )}
                                        onClick={() =>
                                          setEngineOilTypes((prev) =>
                                            prev.includes(type)
                                              ? prev.filter((value) => value !== type)
                                              : [...prev, type]
                                          )
                                        }
                                      >
                                        {type}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            <Textarea
                              placeholder={`Notes for ${labelMap[groupKey].toLowerCase()} (optional)...`}
                              className="min-h-[70px] bg-background/40 border-white/10 resize-none text-xs focus:border-primary/50 transition-colors"
                              value={groupNotes[groupKey]}
                              onChange={(e) =>
                                setGroupNotes((prev) => ({ ...prev, [groupKey]: e.target.value }))
                              }
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <FormLabel className="uppercase text-[10px] font-bold tracking-widest text-foreground/70">
                      Additional Instructions / Issues
                    </FormLabel>
                    <Textarea
                      placeholder="Anything else the tech should know..."
                      className="min-h-[90px] bg-background/40 border-white/10 resize-none text-sm focus:border-primary/50 transition-colors"
                      value={additionalNotes}
                      onChange={(e) => setAdditionalNotes(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <FormLabel className="uppercase text-[10px] font-bold tracking-widest text-foreground/70">
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

                <div className="pt-4 border-t border-white/5 space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="customerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="uppercase text-[10px] font-bold tracking-widest text-foreground/70">Customer Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Name..." {...field} className="bg-background/30 border-white/5 h-10 text-sm" />
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
                          <FormLabel className="uppercase text-[10px] font-bold tracking-widest text-foreground/70">
                            Phone / Email / Company
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Phone, email, or company name"
                              {...field}
                              className="bg-background/30 border-white/5 h-10 text-sm"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="vehicleInfo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="uppercase text-[10px] font-bold tracking-widest text-foreground/70">Truck Info</FormLabel>
                            <FormControl>
                              <Input placeholder="Year/Make/Model" {...field} className="bg-background/30 border-white/5 h-10 text-sm" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="mileage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="uppercase text-[10px] font-bold tracking-widest text-foreground/70">Miles</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="e.g. 452000"
                                className="bg-background/30 border-white/5 h-10 text-sm"
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

                    <FormField
                      control={form.control}
                      name="vehicleColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="uppercase text-[10px] font-bold tracking-widest text-foreground/70">Color</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. White" {...field} className="bg-background/30 border-white/5 h-10 text-sm" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="isUrgent"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-sm border border-white/5 bg-secondary/10 p-3">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm font-bold uppercase text-red-500/80 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" /> Urgent Request
                        </FormLabel>
                        <FormDescription className="text-[10px]">
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

                <Button
                  type="submit"
                  disabled={isPending || isUploading}
                  className="w-full h-14 text-lg font-bold uppercase tracking-wider bg-primary hover:bg-primary/90 mt-4 rounded-sm"
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
              </form>
            </Form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
