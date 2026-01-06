import { Switch, Route } from "wouter";
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

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/submit" component={SubmitRequest} />
      <Route path="/dashboard">
        {isAuthenticated ? <Dashboard /> : (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
            <h2 className="text-2xl font-bold uppercase font-display">Admin Access Required</h2>
            <Button size="lg" onClick={() => window.location.href = "/api/login"}>Login with Replit</Button>
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
