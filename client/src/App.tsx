import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";

import LandingPage from "@/pages/landing";
import AppPage from "@/pages/app";
import OnboardingPage from "@/pages/onboarding";
import ComparePage from "@/pages/compare";
import SavedPage from "@/pages/saved";
import HistoryPage from "@/pages/history";
import SettingsPage from "@/pages/settings";
import NotFound from "@/pages/not-found";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router hook={useHashLocation}>
        <Switch>
          <Route path="/" component={LandingPage} />
          <Route path="/app" component={AppPage} />
          <Route path="/onboarding" component={OnboardingPage} />
          <Route path="/compare" component={ComparePage} />
          <Route path="/saved" component={SavedPage} />
          <Route path="/history" component={HistoryPage} />
          <Route path="/settings" component={SettingsPage} />
          <Route component={NotFound} />
        </Switch>
      </Router>
      <Toaster />
    </QueryClientProvider>
  );
}
