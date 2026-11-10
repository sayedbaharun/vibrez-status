"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Horizontally scrolling tab row that keeps the current tab in view on phones. */
export function SectionNav({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const current = ref.current?.querySelector<HTMLElement>('[aria-current="page"]');
    current?.scrollIntoView({ block: "nearest", inline: "center" });
  });

  return (
    <nav
      ref={ref}
      aria-label="Sections"
      className="scroll-fade-x flex snap-x gap-2 overflow-x-auto overscroll-x-contain py-2 [&>a]:snap-start"
    >
      {children}
    </nav>
  );
}
