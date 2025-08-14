<script>
  import { onMount } from "svelte";
  import { collections } from "./collections.js";
  import { applyTheme, setTheme, themeStore } from "./utils/theme.js";
  import Router from "svelte-spa-router/Router.svelte";
  import Home from "./pages/Home.svelte";
  import Preview from "./pages/Preview.svelte";
  import Game from "./pages/Game.svelte";
  import FlagQuiz from "./pages/FlagQuiz.svelte";
  import CapitalsQuiz from "./pages/CapitalsQuiz.svelte";
  import NotFound from "./pages/NotFound.svelte";
  import Header from "./components/Header.svelte";
  import GeographyQuiz from "./pages/GeographyQuiz.svelte";

  export const routes = {
    "/": Home,
    "/preview/:logoName": Preview,
    "/game": Game,
    "/game/flags": FlagQuiz,
    "/game/capitals": CapitalsQuiz,
    "/game/geography": GeographyQuiz,
    "*": NotFound,
  };

  let viewMode = "grid"; // 'grid' or 'list'
  let searchQuery = "";
  let logos = [];
  let filteredLogos = [];
  let displayLogos = [];
  let theme;
  // Keep local theme in sync with shared theme store
  $: theme = $themeStore;
  let allTags = [];
  let selectedTags = [];
  let selectedBrands = [];
  let selectedVariants = [];
  let tagDropdownOpen = false;
  let showModal = false;
  let selectedLogo = null;
  let compactMode = false;

  // --- Collection support ---
  let collection = localStorage.getItem("collection") || "logos";
  function setCollection(val) {
    console.log("setCollection called with", val, "current:", collection);
    if (val !== collection) {
      collection = val;
      localStorage.setItem("collection", val);
      loadCollectionData();
    }
  }

  async function loadCollectionData() {
    console.log("loadCollectionData: loading collection", collection);
    // Load the correct data file for the selected collection
    try {
      const timestamp = new Date().getTime();
      const response = await fetch(`data/${collection}.json?t=${timestamp}`);
      console.log("loadCollectionData: fetch status", response.status);
      if (response.ok) {
        logos = await response.json();
        // Only use the current collection's data
        allTags = [];
        selectedTags = [];
        selectedBrands = [];
        selectedVariants = [];
        filteredLogos = logos;
        displayLogos = logos;
        // Reset filters and state for new collection
        searchQuery = "";
        tagDropdownOpen = false;
        compactMode = false;
      } else {
        logos = [];
        filteredLogos = [];
        displayLogos = [];
        allTags = [];
        selectedTags = [];
        selectedBrands = [];
        selectedVariants = [];
        tagDropdownOpen = false;
        compactMode = false;
        console.log("loadCollectionData: failed to load data for", collection);
      }
    } catch (error) {
      logos = [];
      filteredLogos = [];
      displayLogos = [];
      allTags = [];
      selectedTags = [];
      selectedBrands = [];
      selectedVariants = [];
      tagDropdownOpen = false;
      compactMode = false;
      console.error(
        "loadCollectionData: error loading data for",
        collection,
        error,
      );
    }
  }

  function setSearchQuery(val) {
    searchQuery = val;
    console.log("App: searchQuery set to:", val);
    // Update window.appData immediately
    if (typeof window !== "undefined" && window.appData) {
      window.appData.searchQuery = val;

      // Also update filtered/display logos immediately for reactive UI
      window.appData.filteredLogos = window.appData.logos.filter((logo) => {
        const matchesSearch =
          logo.name.toLowerCase().includes(val.toLowerCase()) ||
          (logo.title &&
            logo.title.toLowerCase().includes(val.toLowerCase())) ||
          (logo.brand &&
            logo.brand.toLowerCase().includes(val.toLowerCase())) ||
          (logo.meta &&
            Object.values(logo.meta).some(
              (v) =>
                typeof v === "string" &&
                v.toLowerCase().includes(val.toLowerCase()),
            ));
        const matchesTags =
          !selectedTags.length ||
          (logo.tags &&
            logo.tags.some((tag) =>
              selectedTags.includes(typeof tag === "string" ? tag : tag.text),
            ));
        const matchesBrands =
          !selectedBrands.length ||
          (logo.brand && selectedBrands.includes(logo.brand));
        const matchesVariants =
          !selectedVariants.length ||
          (logo.variants &&
            Array.isArray(logo.variants) &&
            logo.variants.some((v) => selectedVariants.includes(v)));
        return matchesSearch && matchesTags && matchesBrands && matchesVariants;
      });

      window.appData.displayLogos =
        !val && compactMode
          ? window.appData.filteredLogos.filter(
              (logo, idx, arr) =>
                arr.findIndex(
                  (l) => (l.brand || l.name) === (logo.brand || logo.name),
                ) === idx,
            )
          : window.appData.filteredLogos;

      console.log(
        "App: Updated filtered/display logos directly:",
        window.appData.filteredLogos.length,
        window.appData.displayLogos.length,
      );
    }
  }

  function setCompactMode(val) {
    compactMode = val;
    localStorage.setItem("compactMode", String(val));

    // Update window.appData immediately on compact mode change
    if (typeof window !== "undefined" && window.appData) {
      window.appData.compactMode = val;
      console.log("App: Updated compactMode in window.appData to", val);

      // Also update filtered/display logos immediately
      updateFilteredLogosImmediate();
    }
  }

  // Load logos from JSON file with cache busting
  onMount(async () => {
    console.log("App: onMount start - before loading logos");
    await loadCollectionData();

    // Set initial empty app data
    if (typeof window !== "undefined") {
      window.appData = {
        logos: [],
        filteredLogos: [],
        displayLogos: [],
        theme: $themeStore,
        effectiveTheme: "light",
        viewMode,
        searchQuery,
        allTags: [],
        selectedTags: [],
        selectedBrands: [],
        selectedVariants: [],
        tagDropdownOpen,
        compactMode,
        setSearchQuery,
        setGridView,
        setListView,
        setCompactView,
        setTheme,
        toggleDropdown,
        addTag,
        removeTag,
        toggleTag,
        getTagObj,
        closeDropdown,
        setCompactMode,
        onCopy: copyUrl,
        onDownload: downloadLogo,
        addBrand,
        removeBrand,
        addVariant,
        removeVariant,
      };
    }

    const params = new URLSearchParams(window.location.search);
    const searchParam = params.get("search");
    if (searchParam) {
      searchQuery = searchParam;
    }

    // Restore selected tags from URL
    const tagsParam = params.get("tags");
    if (tagsParam) {
      selectedTags = tagsParam.split(",").filter((tag) => tag.trim());
      console.log("App: Restored selectedTags from URL:", selectedTags);
      // Update localStorage with URL values
      localStorage.setItem("selectedTags", JSON.stringify(selectedTags));
    }

    // Restore selected brands from URL
    const brandsParam = params.get("brands");
    if (brandsParam) {
      selectedBrands = brandsParam.split(",").filter((brand) => brand.trim());
      console.log("App: Restored selectedBrands from URL:", selectedBrands);
      // Update localStorage with URL values      localStorage.setItem("selectedBrands", JSON.stringify(selectedBrands));
    }

    // Restore selected variants from URL
    const variantsParam = params.get("variants");
    if (variantsParam) {
      selectedVariants = variantsParam
        .split(",")
        .filter((variant) => variant.trim());
      console.log("App: Restored selectedVariants from URL:", selectedVariants);
      // Update localStorage with URL values
      localStorage.setItem(
        "selectedVariants",
        JSON.stringify(selectedVariants),
      );
    }

    // Force update window.appData after restoration
    setTimeout(() => {
      if (typeof window !== "undefined" && window.appData) {
        window.appData.selectedTags = [...selectedTags];
        window.appData.selectedBrands = [...selectedBrands];
        window.appData.selectedVariants = [...selectedVariants];
        console.log(
          "App: Updated window.appData after restoration with variants:",
          selectedVariants,
        );
        updateFilteredLogosImmediate();

        // Force re-render of components by updating references
        selectedTags = [...selectedTags];
        selectedBrands = [...selectedBrands];
        selectedVariants = [...selectedVariants];
      }
    }, 100);

    // Restore view mode and compact mode from localStorage
    const savedViewMode = localStorage.getItem("viewMode");
    if (
      savedViewMode === "grid" ||
      savedViewMode === "list" ||
      savedViewMode === "compact"
    ) {
      viewMode = savedViewMode;
    }
    const savedCompact = localStorage.getItem("compactMode");
    if (savedCompact === "true" || savedCompact === "false") {
      setCompactMode(savedCompact === "true");
    }

    // Restore selected tags from localStorage (only if not already set from URL)
    if (!tagsParam) {
      const savedTags = localStorage.getItem("selectedTags");
      if (savedTags) {
        try {
          const parsedTags = JSON.parse(savedTags);
          if (Array.isArray(parsedTags)) {
            selectedTags = parsedTags;
            console.log(
              "App: Restored selectedTags from localStorage:",
              selectedTags,
            );
          }
        } catch (error) {
          console.error("App: Error parsing saved tags:", error);
          localStorage.removeItem("selectedTags");
        }
      }
    }

    // Restore selected brands from localStorage (only if not already set from URL)
    if (!brandsParam) {
      const savedBrands = localStorage.getItem("selectedBrands");
      if (savedBrands) {
        try {
          const parsedBrands = JSON.parse(savedBrands);
          if (Array.isArray(parsedBrands)) {
            selectedBrands = parsedBrands;
            console.log(
              "App: Restored selectedBrands from localStorage:",
              selectedBrands,
            );
          }
        } catch (error) {
          console.error("App: Error parsing saved brands:", error);
          localStorage.removeItem("selectedBrands");
        }
      }
    }

    // Restore selected variants from localStorage (only if not already set from URL)
    if (!variantsParam) {
      const savedVariants = localStorage.getItem("selectedVariants");
      if (savedVariants) {
        try {
          const parsedVariants = JSON.parse(savedVariants);
          if (Array.isArray(parsedVariants)) {
            selectedVariants = parsedVariants;
            console.log(
              "App: Restored selectedVariants from localStorage:",
              selectedVariants,
            );
          }
        } catch (error) {
          console.error("App: Error parsing saved variants:", error);
          localStorage.removeItem("selectedVariants");
        }
      }
    }
  });

  // Make sure to apply theme whenever it changes
  $: if (theme) {
    console.log("[Theme] Theme changed:", theme);
    applyTheme();
  }

  // Compute all unique tags as objects with text and optional color
  $: allTags = Array.from(
    new Map(
      logos.flatMap((logo) =>
        (logo.tags || []).map((tag) => {
          if (typeof tag === "string") return [tag, { text: tag }];
          return [tag.text, tag];
        }),
      ),
    ).values(),
  ).sort((a, b) => a.text.localeCompare(b.text));

  // Update the filtering logic to include brand and variant filtering in the reactive statement
  $: filteredLogos = logos.filter((logo) => {
    const matchesSearch =
      logo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (logo.title &&
        logo.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (logo.brand &&
        logo.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (logo.meta &&
        Object.values(logo.meta).some(
          (v) =>
            typeof v === "string" &&
            v.toLowerCase().includes(searchQuery.toLowerCase()),
        ));
    const matchesTags =
      !selectedTags.length ||
      (logo.tags &&
        logo.tags.some((tag) =>
          selectedTags.includes(typeof tag === "string" ? tag : tag.text),
        ));
    const matchesBrands =
      !selectedBrands.length ||
      (logo.brand && selectedBrands.includes(logo.brand));
    const matchesVariants =
      !selectedVariants.length ||
      (logo.variants &&
        Array.isArray(logo.variants) &&
        logo.variants.some((v) => selectedVariants.includes(v)));
    return matchesSearch && matchesTags && matchesBrands && matchesVariants;
  });

  $: displayLogos =
    !searchQuery && compactMode
      ? filteredLogos.filter(
          (logo, idx, arr) =>
            arr.findIndex(
              (l) => (l.brand || l.name) === (logo.brand || logo.name),
            ) === idx,
        )
      : filteredLogos;

  // Compute the effective theme for children
  $: effectiveTheme =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;

  // Make app data available globally for components
  $: if (typeof window !== "undefined") {
    window.appData = {
      logos,
      filteredLogos,
      displayLogos,
      theme,
      effectiveTheme,
      viewMode,
      searchQuery,
      allTags,
      selectedTags,
      selectedBrands,
      selectedVariants,
      tagDropdownOpen,
      compactMode,
      collection,
      setCollection,
      collections,
      setSearchQuery,
      setGridView,
      setListView,
      setCompactView,
        setTheme: (newTheme) => {
        console.log("window.appData.setTheme called with:", newTheme);
        setTheme(newTheme);
      },
      toggleDropdown,
      addTag,
      removeTag,
      toggleTag,
      addBrand,
      removeBrand,
      addVariant,
      removeVariant,
      getTagObj,
      closeDropdown,
      setCompactMode,
      onCopy: copyUrl,
      onDownload: downloadLogo,
      openLogoByAnchor,
    };
    console.log(
      "App: Updated window.appData with",
      logos.length,
      "logos,",
      displayLogos.length,
      "display logos",
    );
  }

  function setGridView() {
    console.log("Setting view mode to: grid");
    viewMode = "grid";
    localStorage.setItem("viewMode", "grid");

    // Update window.appData immediately on view change
    if (typeof window !== "undefined" && window.appData) {
      window.appData.viewMode = "grid";
      console.log("App: Updated viewMode in window.appData to grid");
    }
  }

  function setListView() {
    console.log("Setting view mode to: list");
    viewMode = "list";
    localStorage.setItem("viewMode", "list");

    // Update window.appData immediately on view change
    if (typeof window !== "undefined" && window.appData) {
      window.appData.viewMode = "list";
      console.log("App: Updated viewMode in window.appData to list");
    }
  }

  function setCompactView() {
    console.log("Setting view mode to: compact");
    viewMode = "compact";
    localStorage.setItem("viewMode", "compact");

    // Update window.appData immediately on view change
    if (typeof window !== "undefined" && window.appData) {
      window.appData.viewMode = "compact";
      console.log("App: Updated viewMode in window.appData to compact");
    }
  }

  function copyUrl(logoPath) {
    const url = `${window.location.origin}/${logoPath}`;
    // Try modern clipboard API first
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard
        .writeText(url)
        .then(() => {
          alert("URL copied to clipboard!");
        })
        .catch((err) => {
          // Fallback: use execCommand for legacy support
          try {
            const input = document.createElement("input");
            input.value = url;
            document.body.appendChild(input);
            input.select();
            document.execCommand("copy");
            document.body.removeChild(input);
            alert("URL copied to clipboard!");
          } catch (fallbackErr) {
            // Final fallback: show prompt for manual copy
            window.prompt("Copy this URL:", url);
          }
        });
    } else {
      // Fallback for non-secure context or missing clipboard API
      try {
        const input = document.createElement("input");
        input.value = url;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
        alert("URL copied to clipboard!");
      } catch (fallbackErr) {
        window.prompt("Copy this URL:", url);
      }
    }
  }

  function downloadLogo(logoPath, logoName) {
    const link = document.createElement("a");
    link.href = logoPath;
    link.download = logoName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function toggleTag(tag) {
    console.log("App: Toggling tag:", tag);
    if (selectedTags.includes(tag)) {
      selectedTags = selectedTags.filter((t) => t !== tag);
    } else {
      selectedTags = [...selectedTags, tag];
    }

    // Save to localStorage
    localStorage.setItem("selectedTags", JSON.stringify(selectedTags));
    console.log("App: Updated selectedTags:", selectedTags);

    // Update window.appData immediately
    if (typeof window !== "undefined" && window.appData) {
      window.appData.selectedTags = [...selectedTags];
      console.log("App: Updated selectedTags in window.appData");

      // Update filtered logos immediately
      updateFilteredLogosImmediate();
    }
  }

  function addTag(tag) {
    console.log("App: Adding tag:", tag);
    if (!selectedTags.includes(tag)) {
      selectedTags = [...selectedTags, tag];
      localStorage.setItem("selectedTags", JSON.stringify(selectedTags));
      console.log("App: Updated selectedTags:", selectedTags);

      // Update window.appData immediately
      if (typeof window !== "undefined" && window.appData) {
        window.appData.selectedTags = [...selectedTags];
        console.log("App: Updated selectedTags in window.appData");

        // Update filtered logos immediately
        updateFilteredLogosImmediate();
      }
    }
    // Close dropdown after adding tag
    tagDropdownOpen = false;

    // Also update the dropdown state in window.appData
    if (typeof window !== "undefined" && window.appData) {
      window.appData.tagDropdownOpen = false;
      console.log("App: Closed tag dropdown after adding tag");
    }
  }

  function removeTag(tag) {
    console.log("App: Removing tag:", tag);
    selectedTags = selectedTags.filter((t) => t !== tag);
    localStorage.setItem("selectedTags", JSON.stringify(selectedTags));
    console.log("App: Updated selectedTags:", selectedTags);

    // Update window.appData immediately
    if (typeof window !== "undefined" && window.appData) {
      window.appData.selectedTags = [...selectedTags];
      console.log("App: Updated selectedTags in window.appData");

      // Update filtered logos immediately
      updateFilteredLogosImmediate();
    }
  }

  function addBrand(brand) {
    console.log("App: Adding brand:", brand);
    if (!selectedBrands.includes(brand)) {
      selectedBrands = [...selectedBrands, brand];
      localStorage.setItem("selectedBrands", JSON.stringify(selectedBrands));
      console.log("App: Updated selectedBrands:", selectedBrands);

      // Update window.appData immediately
      if (typeof window !== "undefined" && window.appData) {
        window.appData.selectedBrands = [...selectedBrands];
        console.log("App: Updated selectedBrands in window.appData");

        // Update filtered logos immediately
        updateFilteredLogosImmediate();
      }
    }

    // Close dropdown after adding brand
    tagDropdownOpen = false;

    // Also update the dropdown state in window.appData
    if (typeof window !== "undefined" && window.appData) {
      window.appData.tagDropdownOpen = false;
    }
  }

  function removeBrand(brand) {
    console.log("App: Removing brand:", brand);
    selectedBrands = selectedBrands.filter((b) => b !== brand);
    localStorage.setItem("selectedBrands", JSON.stringify(selectedBrands));
    console.log("App: Updated selectedBrands:", selectedBrands);

    // Update window.appData immediately
    if (typeof window !== "undefined" && window.appData) {
      window.appData.selectedBrands = [...selectedBrands];
      console.log("App: Updated selectedBrands in window.appData");

      // Update filtered logos immediately
      updateFilteredLogosImmediate();
    }
  }

  function addVariant(variant) {
    console.log("App: Adding variant:", variant);
    if (!selectedVariants.includes(variant)) {
      selectedVariants = [...selectedVariants, variant];
      localStorage.setItem(
        "selectedVariants",
        JSON.stringify(selectedVariants),
      );
      console.log("App: Updated selectedVariants:", selectedVariants);

      // Update window.appData immediately
      if (typeof window !== "undefined" && window.appData) {
        window.appData.selectedVariants = [...selectedVariants];
        console.log("App: Updated selectedVariants in window.appData");

        // Update filtered logos immediately
        updateFilteredLogosImmediate();
      }
    }

    // Close dropdown after adding variant
    tagDropdownOpen = false;

    // Also update the dropdown state in window.appData
    if (typeof window !== "undefined" && window.appData) {
      window.appData.tagDropdownOpen = false;
    }

    // Force reactive update
    selectedVariants = selectedVariants;
  }

  function removeVariant(variant) {
    console.log("App: Removing variant:", variant);
    selectedVariants = selectedVariants.filter((v) => v !== variant);
    localStorage.setItem("selectedVariants", JSON.stringify(selectedVariants));
    console.log("App: Updated selectedVariants:", selectedVariants);

    // Update window.appData immediately
    if (typeof window !== "undefined" && window.appData) {
      window.appData.selectedVariants = [...selectedVariants];
      console.log("App: Updated selectedVariants in window.appData");

      // Update filtered logos immediately
      updateFilteredLogosImmediate();
    }

    // Force reactive update
    selectedVariants = selectedVariants;
  }

  // Helper function to immediately update filtered/display logos in window.appData
  function updateFilteredLogosImmediate() {
    if (typeof window !== "undefined" && window.appData) {
      // Update filtered logos immediately for reactive UI
      window.appData.filteredLogos = window.appData.logos.filter((logo) => {
        const matchesSearch =
          logo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (logo.title &&
            logo.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (logo.brand &&
            logo.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (logo.meta &&
            Object.values(logo.meta).some(
              (v) =>
                typeof v === "string" &&
                v.toLowerCase().includes(searchQuery.toLowerCase()),
            ));
        const matchesTags =
          !selectedTags.length ||
          (logo.tags &&
            logo.tags.some((tag) =>
              selectedTags.includes(typeof tag === "string" ? tag : tag.text),
            ));
        const matchesBrands =
          !selectedBrands.length ||
          (logo.brand && selectedBrands.includes(logo.brand));
        const matchesVariants =
          !selectedVariants.length ||
          (logo.variants &&
            Array.isArray(logo.variants) &&
            logo.variants.some((v) => selectedVariants.includes(v)));
        return matchesSearch && matchesTags && matchesBrands && matchesVariants;
      });

      window.appData.displayLogos =
        !searchQuery && compactMode
          ? window.appData.filteredLogos.filter(
              (logo, idx, arr) =>
                arr.findIndex(
                  (l) => (l.brand || l.name) === (logo.brand || logo.name),
                ) === idx,
            )
          : window.appData.filteredLogos;

      console.log(
        "App: Updated filtered/display logos:",
        window.appData.filteredLogos.length,
        window.appData.displayLogos.length,
      );

      // Force update the main reactive statements as well
      filteredLogos = [...window.appData.filteredLogos];
      displayLogos = [...window.appData.displayLogos];
    }
  }

  function toggleDropdown() {
    tagDropdownOpen = !tagDropdownOpen;
    console.log("App: Toggling tag dropdown, current state:", tagDropdownOpen);

    // Update window.appData immediately
    if (typeof window !== "undefined" && window.appData) {
      window.appData.tagDropdownOpen = tagDropdownOpen;
    }
  }

  function closeDropdown() {
    tagDropdownOpen = false;
    if (typeof window !== "undefined" && window.appData) {
      window.appData.tagDropdownOpen = false;
    }
  }

  function getTagObj(tag) {
    const tagObj = allTags.find((t) => t.text === tag);
    return tagObj || { text: tag };
  }

  function openLogoByAnchor(hash) {
    if (!hash || !hash.startsWith("#/preview/")) return;

    const logoName = hash.replace("#/preview/", "").replace(/-/g, " ");
    const logo = logos.find(
      (l) =>
        l.name.toLowerCase().replace(/\s+/g, "-") ===
          hash.replace("#/preview/", "").toLowerCase() ||
        l.name.toLowerCase() === logoName.toLowerCase(),
    );

    if (logo) {
      selectedLogo = logo;
      showModal = true;
    }
  }

  // Listen for outside click to close dropdown
  function handleOutsideClick(event) {
    if (tagDropdownOpen && !event.target.closest(".filter-dropdown")) {
      closeDropdown();
    }
  }

  $: if (typeof window !== "undefined") {
    if (tagDropdownOpen) {
      document.addEventListener("click", handleOutsideClick);
    } else {
      document.removeEventListener("click", handleOutsideClick);
    }
  }
</script>

<Router {routes} let:Component>
  <svelte:component
  this={Component}
  {displayLogos}
  allLogos={logos}
  {theme}
  setTheme={setTheme}
    {viewMode}
    {setGridView}
    {setListView}
    {setCompactView}
    {searchQuery}
    {setSearchQuery}
    {allTags}
    {selectedTags}
    {selectedBrands}
    {selectedVariants}
    {tagDropdownOpen}
    {toggleDropdown}
    {addTag}
    {removeTag}
    {addBrand}
    {removeBrand}
    {addVariant}
    {removeVariant}
    {getTagObj}
    {compactMode}
    {setCompactMode}
    {collection}
    {setCollection}
    {collections}
  />
</Router>

<style>
</style>
