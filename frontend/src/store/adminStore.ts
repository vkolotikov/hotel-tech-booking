import { create } from "zustand";
import type { AdminTheme, AdminUser } from "../types/admin";

const ADMIN_THEME_STORAGE_KEY = "forrest_admin_theme";

function resolveInitialTheme(): AdminTheme {
  if (typeof window === "undefined") {
    return "light";
  }

  const storedTheme = window.localStorage.getItem(ADMIN_THEME_STORAGE_KEY);
  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function persistTheme(theme: AdminTheme): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(ADMIN_THEME_STORAGE_KEY, theme);
}

interface AdminStore {
  admin: AdminUser | null;
  theme: AdminTheme;
  setAdmin: (admin: AdminUser | null) => void;
  clearAdmin: () => void;
  setTheme: (theme: AdminTheme) => void;
  toggleTheme: () => void;
}

export const useAdminStore = create<AdminStore>((set) => ({
  admin: null,
  theme: resolveInitialTheme(),
  setAdmin: (admin) => set({ admin }),
  clearAdmin: () => set({ admin: null }),
  setTheme: (theme) => {
    persistTheme(theme);
    set({ theme });
  },
  toggleTheme: () =>
    set((state) => {
      const theme = state.theme === "dark" ? "light" : "dark";
      persistTheme(theme);
      return { theme };
    }),
}));
