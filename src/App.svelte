<script>
  import { onMount } from "svelte";
  // Import Router component directly with explicit path
  import Router from 'svelte-spa-router/Router.svelte';

  // Import routes from centralized router.js file
  import { routes } from './router.js';

  let viewMode = "grid"; // 'grid' or 'list'
  let searchQuery = "";
  let logos = [];
  let filteredLogos = [];
  let displayLogos = [];
  let theme = "system";
  let mq;
  let allTags = [];
  let selectedTags = [];
  let tagDropdownOpen = false;
  let showModal = false;
  let selectedLogo = null;
  let compactMode = false;

  function setSearchQuery(val) {
    searchQuery = val;
    console.log("App: searchQuery set to:", val);
    // Update window.appData immediately
    if (typeof window !== 'undefined' && window.appData) {
      window.appData.searchQuery = val;

      // Also update filtered/display logos immediately for reactive UI
      window.appData.filteredLogos = window.appData.logos.filter((logo) => {
        const matchesSearch = logo.name.toLowerCase().includes(val.toLowerCase())
          || (logo.brand && logo.brand.toLowerCase().includes(val.toLowerCase()));
        const matchesTags =
          !selectedTags.length ||
          (logo.tags &&
            logo.tags.some((tag) =>
              selectedTags.includes(typeof tag === "string" ? tag : tag.text),
            ));
        return matchesSearch && matchesTags;
      });

      window.appData.displayLogos = (!val && compactMode)
        ? window.appData.filteredLogos.filter((logo, idx, arr) =>
            arr.findIndex(l => (l.brand || l.name) === (logo.brand || logo.name)) === idx)
        : window.appData.filteredLogos;

      console.log("App: Updated filtered/display logos directly:",
        window.appData.filteredLogos.length, window.appData.displayLogos.length);
    }
  }

  function setCompactMode(val) {
    compactMode = val;
    localStorage.setItem("compactMode", String(val));

    // Update window.appData immediately on compact mode change
    if (typeof window !== 'undefined' && window.appData) {
      window.appData.compactMode = val;
      console.log("App: Updated compactMode in window.appData to", val);

      // Also update filtered/display logos immediately
      updateFilteredLogosImmediate();
    }
  }

  // Load logos from JSON file with cache busting
  onMount(async () => {
    console.log("App: onMount start - before loading logos");

    // Set initial empty app data
    if (typeof window !== 'undefined') {
      window.appData = {
        logos: [],
        filteredLogos: [],
        displayLogos: [],
        theme,
        effectiveTheme: 'light',
        viewMode,
        searchQuery,
        allTags: [],
        selectedTags: [],
        tagDropdownOpen,
        compactMode,
        setSearchQuery,
        setGridView,
        setListView,
        setTheme,
        toggleDropdown,
        addTag,
        removeTag,
        toggleTag,
        getTagObj,
        closeDropdown,
        setCompactMode,
        onCopy: copyUrl,
        onDownload: downloadLogo
      };
    }

    try {
      // Add timestamp as cache-busting query parameter
      const timestamp = new Date().getTime();
      const response = await fetch(`data/logos.json?t=${timestamp}`, {
        // Force reload from server, don't use cache
        cache: "no-cache",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });

      if (response.ok) {
        logos = await response.json();
        filteredLogos = logos;
        displayLogos = logos;
        console.log(
          "Loaded logos:",
          logos.length,
          "at",
          new Date().toLocaleTimeString(),
        );

        // Update app data immediately after logos are loaded
        if (typeof window !== 'undefined') {
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
            tagDropdownOpen,
            compactMode,
            setSearchQuery,
            setGridView,
            setListView,
            setTheme,
            toggleDropdown,
            addTag,
            removeTag,
            toggleTag,
            getTagObj,
            closeDropdown,
            setCompactMode,
            onCopy: copyUrl,
            onDownload: downloadLogo
          };
          console.log("App: Updated window.appData after loading with", logos.length, "logos");
        }
      } else {
        console.error("Failed to load logos data", response.status);
      }
    } catch (error) {
      console.error("Error loading logos:", error);
    }

    const stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark" || stored === "system") {
      theme = stored;
    }
    applyTheme();

    // Listen for system theme changes if using system
    mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", () => {
      if (theme === "system") applyTheme();
    });

    // Open preview if URL contains anchor
    openLogoByAnchor(window.location.hash);

    // On mount, check for search param in URL and set searchQuery
    const params = new URLSearchParams(window.location.search);
    const searchParam = params.get("search");
    if (searchParam) {
      searchQuery = searchParam;
    }

    // Restore view mode and compact mode from localStorage
    const savedViewMode = localStorage.getItem("viewMode");
    if (savedViewMode === "grid" || savedViewMode === "list") {
      viewMode = savedViewMode;
    }
    const savedCompact = localStorage.getItem("compactMode");
    if (savedCompact === "true" || savedCompact === "false") {
      setCompactMode(savedCompact === "true");
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

  $: filteredLogos = logos.filter((logo) => {
    const matchesSearch = logo.name.toLowerCase().includes(searchQuery.toLowerCase())
      || (logo.brand && logo.brand.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesTags =
      !selectedTags.length ||
      (logo.tags &&
        logo.tags.some((tag) =>
          selectedTags.includes(typeof tag === "string" ? tag : tag.text),
        ));
    return matchesSearch && matchesTags;
  });

  $: displayLogos = (!searchQuery && compactMode)
    ? filteredLogos.filter((logo, idx, arr) =>
        arr.findIndex(l => (l.brand || l.name) === (logo.brand || logo.name)) === idx)
    : filteredLogos;

  // Compute the effective theme for children
  $: effectiveTheme =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;

  // Make app data available globally for components
  $: if (typeof window !== 'undefined') {
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
      tagDropdownOpen,
      compactMode,
      setSearchQuery,
      setGridView,
      setListView,
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
      openLogoByAnchor
    };
    console.log("App: Updated window.appData with", logos.length, "logos,", displayLogos.length, "display logos");
  }

  function setGridView() {
    console.log("Setting view mode to: grid");
    viewMode = "grid";
    localStorage.setItem("viewMode", "grid");

    // Update window.appData immediately on view change
    if (typeof window !== 'undefined' && window.appData) {
      window.appData.viewMode = "grid";
      console.log("App: Updated viewMode in window.appData to grid");
    }
  }

  function setListView() {
    console.log("Setting view mode to: list");
    viewMode = "list";
    localStorage.setItem("viewMode", "list");

    // Update window.appData immediately on view change
    if (typeof window !== 'undefined' && window.appData) {
      window.appData.viewMode = "list";
      console.log("App: Updated viewMode in window.appData to list");
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

  function applyTheme() {
    let effectiveTheme = theme;
    if (theme === "system") {
      effectiveTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    // Apply theme both ways for compatibility
    document.documentElement.setAttribute("data-theme", effectiveTheme);
    document.documentElement.className = effectiveTheme; // Add class-based theming
    console.log("[Theme] Applied theme:", effectiveTheme);
  }

  function setTheme(newTheme) {
    if (newTheme === "light" || newTheme === "dark" || newTheme === "system") {
      theme = newTheme;
      localStorage.setItem("theme", newTheme);
      console.log("[Theme] setTheme:", newTheme);
      // Apply theme immediately after setting
      setTimeout(() => applyTheme(), 0);
    }
  }

  function toggleTag(tag) {
    console.log("App: Toggling tag:", tag);
    if (selectedTags.includes(tag)) {
      selectedTags = selectedTags.filter((t) => t !== tag);
    } else {
      selectedTags = [...selectedTags, tag];
    }

    // Update window.appData immediately
    if (typeof window !== 'undefined' && window.appData) {
      window.appData.selectedTags = [...selectedTags];

      // Update filtered logos immediately
      updateFilteredLogosImmediate();
    }
  }  function addTag(tag) {
    console.log("App: Adding tag:", tag);
    if (!selectedTags.includes(tag)) {
      selectedTags = [...selectedTags, tag];

      // Update window.appData immediately
      if (typeof window !== 'undefined' && window.appData) {
        window.appData.selectedTags = [...selectedTags];

        // Update filtered logos immediately
        updateFilteredLogosImmediate();
      }
    }
    // Close dropdown after adding tag
    tagDropdownOpen = false;

    // Also update the dropdown state in window.appData
    if (typeof window !== 'undefined' && window.appData) {
      window.appData.tagDropdownOpen = false;
      console.log("App: Closed tag dropdown after adding tag");
    }
  }

  function removeTag(tag) {
    console.log("App: Removing tag:", tag);
    selectedTags = selectedTags.filter((t) => t !== tag);

    // Update window.appData immediately
    if (typeof window !== 'undefined' && window.appData) {
      window.appData.selectedTags = [...selectedTags];

      // Update filtered logos immediately
      updateFilteredLogosImmediate();
    }
  }

  // Helper function to immediately update filtered/display logos in window.appData
  function updateFilteredLogosImmediate() {
    if (typeof window !== 'undefined' && window.appData && window.appData.logos) {
      window.appData.filteredLogos = window.appData.logos.filter((logo) => {
        const matchesSearch = logo.name.toLowerCase().includes(searchQuery.toLowerCase())
          || (logo.brand && logo.brand.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesTags =
          !selectedTags.length ||
          (logo.tags &&
            logo.tags.some((tag) =>
              selectedTags.includes(typeof tag === "string" ? tag : tag.text),
            ));
        return matchesSearch && matchesTags;
      });

      window.appData.displayLogos = (!searchQuery && compactMode)
        ? window.appData.filteredLogos.filter((logo, idx, arr) =>
            arr.findIndex(l => (l.brand || l.name) === (logo.brand || logo.name)) === idx)
        : window.appData.filteredLogos;

      console.log("App: Updated filtered logos:", window.appData.filteredLogos.length,
        "display logos:", window.appData.displayLogos.length);
    }
  }

  function toggleDropdown() {
    console.log("App: Toggling tag dropdown, current state:", tagDropdownOpen);
    tagDropdownOpen = !tagDropdownOpen;

    // Update window.appData immediately
    if (typeof window !== 'undefined' && window.appData) {
      window.appData.tagDropdownOpen = tagDropdownOpen;
      console.log("App: Updated tagDropdownOpen in window.appData to", tagDropdownOpen);
    }
  }

  function closeDropdown(e) {
    if (!e.target.closest(".tag-dropdown")) {
      tagDropdownOpen = false;

      // Update window.appData immediately
      if (typeof window !== 'undefined' && window.appData) {
        window.appData.tagDropdownOpen = false;
        console.log("App: Closed dropdown, updated in window.appData");
      }
    }
  }

  function getTagObj(text) {
    return allTags.find((t) => t.text === text);
  }

  // The openPreview function has been removed as it's now handled directly
  // by the Grid.svelte component using the router

  function openLogoByAnchor(hash) {
    if (!hash || !hash.startsWith("#/preview/")) return;

    const anchor = decodeURIComponent(hash.replace("#/preview/", ""));

    const found = logos.find(
      (l) => l.name.replace(/\s+/g, "-").toLowerCase() === anchor,
    );

    if (found) {
      const previewUrl = `#/preview/${encodeURIComponent(found.name.replace(/\s+/g, '-').toLowerCase())}`;
      console.log("App: Navigating to router URL:", previewUrl);
      window.location.href = previewUrl;
    }
  }

  // Listen for outside click to close dropdown
  $: if (tagDropdownOpen) {
    window.addEventListener("click", closeDropdown);
  } else {
    window.removeEventListener("click", closeDropdown);
  }
</script>

<div class="container app-flex">
  <Router {routes} />
</div>

<style>
  .app-flex {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }
  .app-flex {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }
</style>
