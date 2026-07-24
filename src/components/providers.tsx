"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { EventProvider } from "@/contexts/event-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark">
      <EventProvider>
        {children}
        <Toaster richColors closeButton position="top-center" />
      </EventProvider>
    </ThemeProvider>
  );
}
