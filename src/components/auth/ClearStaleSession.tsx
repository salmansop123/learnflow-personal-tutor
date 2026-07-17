"use client";

import { signOut } from "next-auth/react";
import { useEffect, useRef } from "react";

/** Clears a JWT that points at a user removed from the database (e.g. after DB reset). */
export function ClearStaleSession({ active }: { active: boolean }) {
  const cleared = useRef(false);

  useEffect(() => {
    if (!active || cleared.current) return;
    cleared.current = true;
    void signOut({ redirect: false });
  }, [active]);

  return null;
}
