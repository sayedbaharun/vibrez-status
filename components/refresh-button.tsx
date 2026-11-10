"use client";

import { RefreshCw } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { cn } from "cn";

export function RefreshButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="outline"
      className="size-11 p-0 sm:w-auto sm:px-3"
      disabled={pending}
      aria-label={pending ? "Refreshing" : "Refresh"}
    >
      <RefreshCw className={cn("size-5", pending && "motion-safe:animate-spin")} aria-hidden="true" />
      <span className="hidden sm:inline">{pending ? "Refreshing…" : "Refresh"}</span>
    </Button>
  );
}
