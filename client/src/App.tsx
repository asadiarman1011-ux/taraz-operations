import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "@/pages/Home";
import Sales from "@/pages/Sales";
import OrderEntry from "@/pages/OrderEntry";
import OrderDetails from "@/pages/OrderDetails";
import Access from "@/pages/Access";
import Settings from "@/pages/Settings";
import "./factory-pages.css";
import DashboardLayout from "./components/DashboardLayout";
import { useEffect } from "react";
import Login from "@/pages/Login";
import { trpc } from "@/lib/trpc";

const SalesPage = () => <DashboardLayout><Sales /></DashboardLayout>;
const OrderEntryPage = () => <DashboardLayout><OrderEntry /></DashboardLayout>;
const OrderDetailsPage = () => <DashboardLayout><OrderDetails /></DashboardLayout>;
const AccessPage = () => <DashboardLayout><Access /></DashboardLayout>;
const SettingsPage = () => <DashboardLayout><Settings /></DashboardLayout>;

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/sales"} component={SalesPage} />
      <Route path={"/orders/new"} component={OrderEntryPage} />
      <Route path={"/orders/:id"} component={OrderDetailsPage} />
      <Route path={"/orders"} component={Home} />
      <Route path={"/delivery"} component={Home} />
      <Route path={"/inventory"} component={Home} />
      <Route path={"/access"} component={AccessPage} />
      <Route path={"/settings"} component={SettingsPage} />
      <Route path={"/login"} component={Login} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  const meQuery=trpc.auth.me.useQuery(undefined,{retry:false,refetchOnWindowFocus:false});
  useEffect(() => {
    const resetKey = "sepid-clean-start-v1";
    if (!localStorage.getItem(resetKey)) {
      ["taraz-orders", "taraz-garments", "taraz-materials", "sepid-customers", "sepid-activities", "sepid-unread-count", "sepid-last-seen-activity"].forEach(key => localStorage.removeItem(key));
      localStorage.setItem(resetKey, "done");
    }
  }, []);
  if(window.location.pathname!=="/login" && meQuery.isLoading) return <div className="auth-loading" dir="rtl"><div className="login-mark"><span>ت</span></div><strong>در حال بررسی نشست کاربری...</strong></div>;
  if(window.location.pathname!=="/login" && !meQuery.data) return <Login />;
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
