import { useEffect } from "react";
import { useLocation } from "wouter";

export default function ReturnsPage() {
  const [, navigate] = useLocation();
  useEffect(() => { navigate("/app/mine?tab=returns", { replace: true }); }, []);
  return null;
}
