import { useEffect } from "react";
import { useLocation } from "wouter";

export default function SubscriptionsPage() {
  const [, navigate] = useLocation();
  useEffect(() => { navigate("/app/mine?tab=renewals", { replace: true }); }, []);
  return null;
}
