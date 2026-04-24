import { useEffect } from "react";
import { useLocation } from "wouter";

export default function ActionsPage() {
  const [, navigate] = useLocation();
  useEffect(() => { navigate("/app/mine", { replace: true }); }, []);
  return null;
}
