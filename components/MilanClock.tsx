"use client";

import { useEffect, useState } from "react";
import { ClockIcon } from "@/components/ui/clock";
import { GlobeIcon } from "@/components/ui/globe";

export default function MilanClock({ className = "" }: { className?: string }) {
  const [t, setT] = useState<{ fmt: string; iso: string } | null>(null);

  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "Europe/Rome",
      timeZoneName: "short",
    });
    const tick = () => {
      const d = new Date();
      setT({ fmt: fmt.format(d), iso: d.toISOString() });
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <span className={`flex items-center gap-1.5 ${className}`}>
      <GlobeIcon size={14} className="inline-flex shrink-0" />
      Milan, Italy
      <ClockIcon size={14} className="inline-flex shrink-0" />
      <time dateTime={t?.iso ?? ""}>{t?.fmt ?? "–:–:–"}</time>
    </span>
  );
}