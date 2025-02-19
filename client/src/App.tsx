import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/use-auth";
import { NotificationsProvider } from "@/hooks/use-notifications";
import { Toaster } from "@/components/ui/toaster";
import { Switch, Route } from "wouter";
import { ProtectedRoute } from "@/lib/protected-route";
import { queryClient } from "@/lib/queryClient";
import AuthPage from "@/pages/auth-page";
import AdminDashboard from "@/pages/admin-dashboard";
import EmployeeDashboard from "@/pages/employee-dashboard";
import VendorDashboard from "@/pages/vendor-dashboard";
import Payment from "@/pages/Payment";
import NotFound from "@/pages/not-found";


function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" roles={["admin"]} component={AdminDashboard} />
      <ProtectedRoute path="/employee" roles={["employee"]} component={EmployeeDashboard} />
      <ProtectedRoute path="/vendor" roles={["vendor"]} component={VendorDashboard} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/payment" component={Payment} />
      
      <Route path="/:rest*" component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationsProvider>
          <Router />
          <Toaster />
        </NotificationsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
