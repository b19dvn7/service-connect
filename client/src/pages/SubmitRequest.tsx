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
import { Loader2, AlertTriangle, Send } from "lucide-react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";

// Extend schema for client-side form if needed, or use directly
const formSchema = insertMaintenanceRequestSchema;

export default function SubmitRequest() {
  const [, setLocation] = useLocation();
  const { mutate, isPending } = useCreateRequest();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerName: "",
      contactInfo: "",
      vehicleInfo: "",
      description: "",
      isUrgent: false,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    mutate(values, {
      onSuccess: () => {
        form.reset();
        setTimeout(() => setLocation("/dashboard"), 1500);
      }
    });
  }

  return (
    <div className="min-h-screen bg-background text-foreground bg-grid-pattern">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="font-display text-4xl md:text-5xl font-bold uppercase mb-2">New Work Order</h1>
            <p className="text-muted-foreground text-lg">Please provide detailed information about the vehicle and the issue.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-card/50 backdrop-blur-sm border border-white/10 p-8 rounded-sm shadow-xl"
          >
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="customerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="uppercase text-xs font-bold tracking-wider text-muted-foreground">Customer / Company Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter name..." {...field} className="bg-background/50 border-white/10 h-12" />
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
                        <FormLabel className="uppercase text-xs font-bold tracking-wider text-muted-foreground">Contact Phone / Email</FormLabel>
                        <FormControl>
                          <Input placeholder="(555) 000-0000" {...field} className="bg-background/50 border-white/10 h-12" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="vehicleInfo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="uppercase text-xs font-bold tracking-wider text-muted-foreground">Vehicle Information</FormLabel>
                      <FormControl>
                        <Input placeholder="Year, Make, Model, VIN #" {...field} className="bg-background/50 border-white/10 h-12" />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Example: 2018 Peterbilt 579 - VIN ending in 4921
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="uppercase text-xs font-bold tracking-wider text-muted-foreground">Issue Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe the problem, strange noises, error codes, etc." 
                          className="min-h-[150px] bg-background/50 border-white/10 resize-none"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isUrgent"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-sm border border-white/10 bg-secondary/20 p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base font-bold uppercase text-red-500 flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5" /> Urgent Request
                        </FormLabel>
                        <FormDescription>
                          Vehicle is currently broken down or roadside.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-red-600"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  disabled={isPending}
                  className="w-full h-14 text-lg font-bold uppercase tracking-wider bg-primary hover:bg-primary/90 mt-4 rounded-sm"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...
                    </>
                  ) : (
                    <>
                      Submit Work Order <Send className="ml-2 h-5 w-5" />
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
