import { useEffect } from "react";
import { useLocation } from "wouter";

export default function SavedPage() {
  const [, navigate] = useLocation();
  useEffect(() => { navigate("/app/mine?tab=watching", { replace: true }); }, []);
  return null;
}
