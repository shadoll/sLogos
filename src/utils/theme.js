import { writable } from 'svelte/store';

export function applyTheme(theme) {
  let effectiveTheme = theme;
  if (theme === "system") {
    effectiveTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  document.documentElement.setAttribute("data-theme", effectiveTheme);
  document.documentElement.className = effectiveTheme;
  console.log("[Theme] Applied theme:", effectiveTheme);
}

export function setTheme(newTheme) {
    if (newTheme === "light" || newTheme === "dark" || newTheme === "system") {
      // Persist choice and apply immediately
      localStorage.setItem("theme", newTheme);
      // Update reactive store so $themeStore updates everywhere immediately
      try {
        themeStore.set(newTheme);
      } catch (e) {
        // If themeStore isn't initialized yet, ignore — it will be set on module init
      }
      console.log("[Theme] setTheme:", newTheme);
      setTimeout(() => applyTheme(newTheme), 0);
      return newTheme;
    }
  }

export function getStoredTheme(defaultTheme = "system") {
  return (typeof localStorage !== "undefined" && localStorage.getItem("theme")) || defaultTheme;
}

// Svelte store for reactive theme across components
export const themeStore = writable(getStoredTheme());
