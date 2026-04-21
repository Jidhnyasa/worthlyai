import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import HashCompatRedirect from "@/components/HashCompatRedirect";

// App pages
import LandingPage    from "@/pages/landing";
import AppPage        from "@/pages/app";
import OnboardingPage from "@/pages/onboarding";
import ComparePage    from "@/pages/compare";
import SavedPage      from "@/pages/saved";
import HistoryPage    from "@/pages/history";
import SettingsPage   from "@/pages/settings";
import NotFound       from "@/pages/not-found";

// Public discovery pages
import VerdictSlugPage  from "@/pages/verdict-slug";
import CompareSlugPage  from "@/pages/compare-slug";
import CategoryHubPage  from "@/pages/category-hub";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HashCompatRedirect />
      <Switch>
        {/* ── Core app ── */}
        <Route path="/"           component={LandingPage} />
        <Route path="/app"        component={AppPage} />
        <Route path="/onboarding" component={OnboardingPage} />
        <Route path="/compare"    component={ComparePage} />
        <Route path="/saved"      component={SavedPage} />
        <Route path="/history"    component={HistoryPage} />
        <Route path="/settings"   component={SettingsPage} />

        {/* ── Public discovery ── */}
        <Route path="/verdict/:slug"  component={VerdictSlugPage} />
        <Route path="/compare/:slug"  component={CompareSlugPage} />

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
