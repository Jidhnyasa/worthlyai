import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-5 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-secondary">
        <span className="text-2xl font-bold text-muted-foreground">404</span>
      </div>
      <div className="space-y-1">
        <h1 className="font-bold text-lg">Page not found</h1>
        <p className="text-sm text-muted-foreground">This page doesn't exist.</p>
      </div>
      <div className="flex gap-3">
        <Link href="/">
          <Button variant="outline" size="sm" className="gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </Button>
        </Link>
        <Link href="/app">
          <Button size="sm" className="gap-1.5" style={{ background: "hsl(32 95% 54%)", color: "white" }}>
            <Home className="w-3.5 h-3.5" /> Decision Panel
          </Button>
        </Link>
      </div>
    </div>
  );
}
