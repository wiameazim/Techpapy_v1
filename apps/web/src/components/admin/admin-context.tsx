"use client";

import { createContext, useContext } from "react";
import type { Me } from "@/lib/api";

export const AdminUserContext = createContext<Me | null>(null);

export function useAdminUser() {
  const ctx = useContext(AdminUserContext);
  if (!ctx) throw new Error("useAdminUser must be used within the admin layout");
  return ctx;
}
