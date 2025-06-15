import { writable } from "svelte/store";

// Helper to load from localStorage or fallback
function getStored(key, fallback) {
  if (typeof localStorage === 'undefined') return fallback;

  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
}

function createAppStore() {
  const initial = {
    theme: getStored("theme", "system"),
    viewMode: getStored("viewMode", "grid"),
    compactMode: getStored("compactMode", false),
    selectedTags: getStored("selectedTags", []),
    selectedBrands: getStored("selectedBrands", []),
    selectedVariants: getStored("selectedVariants", []),
    tagDropdownOpen: false,
    searchQuery: "",
    // Add more state properties as needed
  };

  const { subscribe, set, update } = writable(initial);

  // Store subscriber to save to localStorage on change
  subscribe((state) => {
    if (typeof localStorage === 'undefined') return;

    localStorage.setItem("theme", JSON.stringify(state.theme));
    localStorage.setItem("viewMode", JSON.stringify(state.viewMode));
    localStorage.setItem("compactMode", JSON.stringify(state.compactMode));
    localStorage.setItem("selectedTags", JSON.stringify(state.selectedTags));
    localStorage.setItem("selectedBrands", JSON.stringify(state.selectedBrands));
    localStorage.setItem("selectedVariants", JSON.stringify(state.selectedVariants));
  });

  return {
    subscribe,

    // Theme actions
    setTheme: (theme) => update((s) => ({ ...s, theme })),

    // View mode actions
    setViewMode: (viewMode) => update((s) => ({ ...s, viewMode })),
    toggleCompactMode: () => update((s) => ({ ...s, compactMode: !s.compactMode })),

    // Search actions
    setSearchQuery: (searchQuery) => update((s) => ({ ...s, searchQuery })),

    // Tags actions
    toggleTagDropdown: () => update((s) => ({ ...s, tagDropdownOpen: !s.tagDropdownOpen })),
    addTag: (tag) => update((s) =>
      s.selectedTags.includes(tag) ? s : { ...s, selectedTags: [...s.selectedTags, tag] }
    ),
    removeTag: (tag) => update((s) => ({
      ...s,
      selectedTags: s.selectedTags.filter((t) => t !== tag)
    })),
    clearTags: () => update((s) => ({ ...s, selectedTags: [] })),

    // Brands actions
    addBrand: (brand) => update((s) =>
      s.selectedBrands.includes(brand) ? s : { ...s, selectedBrands: [...s.selectedBrands, brand] }
    ),
    removeBrand: (brand) => update((s) => ({
      ...s,
      selectedBrands: s.selectedBrands.filter((b) => b !== brand)
    })),
    clearBrands: () => update((s) => ({ ...s, selectedBrands: [] })),

    // Variants actions
    addVariant: (variant) => update((s) =>
      s.selectedVariants.includes(variant) ? s : { ...s, selectedVariants: [...s.selectedVariants, variant] }
    ),
    removeVariant: (variant) => update((s) => ({
      ...s,
      selectedVariants: s.selectedVariants.filter((v) => v !== variant)
    })),
    clearVariants: () => update((s) => ({ ...s, selectedVariants: [] })),

    // Reset all filters
    resetFilters: () => update((s) => ({
      ...s,
      selectedTags: [],
      selectedBrands: [],
      selectedVariants: [],
      searchQuery: ""
    }))
  };
}

// Create and export the store
export const appStore = createAppStore();
