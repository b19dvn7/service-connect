import { Navbar } from "@/components/Navbar";
import { useRequests, useUpdateStatus } from "@/hooks/use-requests";
import { StatusBadge } from "@/components/StatusBadge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  MoreVertical, 
  Search, 
  AlertTriangle, 
  Calendar, 
  Truck,
  Filter,
  Loader2
} from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

export default function Dashboard() {
  const { data: requests, isLoading } = useRequests();
  const { mutate: updateStatus } = useUpdateStatus();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const filteredRequests = requests?.filter(r => {
    const matchesSearch = 
      r.customerName.toLowerCase().includes(search.toLowerCase()) ||
      r.vehicleInfo.toLowerCase().includes(search.toLowerCase()) ||
      r.id.toString().includes(search);
    
    const matchesFilter = filter === "all" ? true : r.status === filter;
    
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: requests?.length || 0,
    pending: requests?.filter(r => r.status === "pending").length || 0,
    inProgress: requests?.filter(r => r.status === "in_progress").length || 0,
    completed: requests?.filter(r => r.status === "completed").length || 0,
  };

  return (
    <div className="min-h-screen bg-background text-foreground bg-grid-pattern">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h1 className="font-display text-4xl font-bold uppercase">Service Dashboard</h1>
            <p className="text-muted-foreground">Manage ongoing repairs and work orders.</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full md:w-auto">
            <StatCard label="Total Orders" value={stats.total} />
            <StatCard label="Pending" value={stats.pending} className="text-yellow-500" />
            <StatCard label="In Progress" value={stats.inProgress} className="text-blue-500" />
            <StatCard label="Completed" value={stats.completed} className="text-green-500" />
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search by customer, vehicle, or ID..." 
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

        {/* Request Grid */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredRequests?.map((request) => (
                <motion.div
                  key={request.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="bg-card/80 backdrop-blur border-white/5 hover:border-primary/40 transition-all p-6 relative overflow-hidden group h-full flex flex-col">
                    {request.isUrgent && (
                      <div className="absolute top-0 right-0 p-2 bg-red-500/10 rounded-bl-lg border-b border-l border-red-500/20">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                      </div>
                    )}
                    
                    <div className="flex justify-between items-start mb-4">
                      <div className="text-xs font-mono text-muted-foreground">WO #{request.id.toString().padStart(4, '0')}</div>
                      <StatusBadge status={request.status} />
                    </div>

                    <h3 className="font-display text-2xl font-bold uppercase truncate mb-1" title={request.customerName}>
                      {request.customerName}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                      <Truck className="w-4 h-4" />
                      <span className="truncate">{request.vehicleInfo}</span>
                    </div>

                    <div className="bg-secondary/30 p-3 rounded-sm text-sm mb-6 flex-grow">
                      <p className="line-clamp-3 text-muted-foreground">{request.description}</p>
                    </div>

                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {request.createdAt && format(new Date(request.createdAt), 'MMM d, yyyy')}
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-background border-white/10">
                          <DropdownMenuItem onClick={() => updateStatus({ id: request.id, status: "pending" })}>
                            Mark Pending
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateStatus({ id: request.id, status: "in_progress" })}>
                            Mark In Progress
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateStatus({ id: request.id, status: "completed" })}>
                            Mark Completed
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
        
        {filteredRequests?.length === 0 && !isLoading && (
          <div className="text-center py-20 bg-card/20 border border-dashed border-white/10 rounded-sm">
            <Filter className="w-10 h-10 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-xl font-bold uppercase text-muted-foreground">No requests found</h3>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, className }: { label: string, value: number, className?: string }) {
  return (
    <div className="bg-card border border-white/5 p-4 rounded-sm text-center">
      <div className={`font-display text-4xl font-bold ${className || 'text-foreground'}`}>
        {value}
      </div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">
        {label}
      </div>
    </div>
  );
}
