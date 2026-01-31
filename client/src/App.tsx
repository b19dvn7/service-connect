import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import SubmitRequest from "@/pages/SubmitRequest";
import Dashboard from "@/pages/Dashboard";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/submit" component={SubmitRequest} />
      <Route path="/dashboard">
        {isAuthenticated ? <Dashboard /> : (
          <div className="flex flex-col items-center justify-center min-h-screen bg-background space-y-6 p-4">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold uppercase font-display tracking-tight">Admin Portal</h2>
              <p className="text-muted-foreground">Please sign in to access the maintenance dashboard.</p>
            </div>
            <Button 
              size="lg" 
              className="h-14 px-8 text-lg font-bold uppercase tracking-wider"
              onClick={() => window.location.href = "/api/login"}
            >
              Login
            </Button>
            <Button variant="ghost" onClick={() => window.location.href = "/"}>
              Back to Home
            </Button>
          </div>
        )}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
