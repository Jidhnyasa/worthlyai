import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import HashCompatRedirect from "@/components/HashCompatRedirect";

// Public / marketing
import LandingPage    from "@/pages/landing";
import NotFound       from "@/pages/not-found";

// App core (purchase protection)
import DashboardPage      from "@/pages/dashboard";
import ReturnsPage        from "@/pages/returns";
import SubscriptionsPage  from "@/pages/subscriptions";
import ActionsPage        from "@/pages/actions";

// App utilities
import MinePage       from "@/pages/mine";
import OnboardingPage from "@/pages/onboarding";
import ComparePage    from "@/pages/compare";
import SavedPage      from "@/pages/saved";
import HistoryPage    from "@/pages/history";
import SettingsPage   from "@/pages/settings";

// Verdicts (buy/wait/skip) — renamed from app
import VerdictsPage from "@/pages/app";

// Public discovery pages
import VerdictSlugPage  from "@/pages/verdict-slug";
import CompareSlugPage  from "@/pages/compare-slug";
import CategoryHubPage  from "@/pages/category-hub";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HashCompatRedirect />
      <Switch>
        {/* ── Marketing ── */}
        <Route path="/" component={LandingPage} />

        {/* ── App: purchase protection ── */}
        <Route path="/app"               component={DashboardPage} />
        <Route path="/app/returns"       component={ReturnsPage} />
        <Route path="/app/subscriptions" component={SubscriptionsPage} />
        <Route path="/app/actions"       component={ActionsPage} />
        <Route path="/app/verdicts"      component={VerdictsPage} />
        <Route path="/app/mine"          component={MinePage} />

        {/* ── App utilities ── */}
        <Route path="/onboarding" component={OnboardingPage} />
        <Route path="/compare"    component={ComparePage} />
        <Route path="/saved"      component={SavedPage} />
        <Route path="/history"    component={HistoryPage} />
        <Route path="/settings"   component={SettingsPage} />

        {/* ── Public discovery ── */}
        <Route path="/verdict/:slug" component={VerdictSlugPage} />
        <Route path="/compare/:slug" component={CompareSlugPage} />

        {/* ── Category hubs ── */}
        <Route path="/gifts">
          {() => <CategoryHubPage params={{ category: "gifts" }} />}
        </Route>
        <Route path="/baby-gear">
          {() => <CategoryHubPage params={{ category: "baby-gear" }} />}
        </Route>
        <Route path="/headphones">
          {() => <CategoryHubPage params={{ category: "headphones" }} />}
        </Route>

        <Route component={NotFound} />
      </Switch>
      <Toaster />
    </QueryClientProvider>
  );
}
