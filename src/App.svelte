<script>
  import { onMount } from "svelte";
  import Grid from "./components/Grid.svelte";
  import List from "./components/List.svelte";
  import Header from "./components/Header.svelte";
  import Preview from "./components/Preview.svelte";

  let viewMode = "grid"; // 'grid' or 'list'
  let searchQuery = "";
  let logos = [];
  let filteredLogos = [];
  let theme = "system";
  let mq;
  let allTags = [];
  let selectedTags = [];
  let tagDropdownOpen = false;
  let showModal = false;
  let selectedLogo = null;

  function setSearchQuery(val) {
    searchQuery = val;
  }

  // Load logos from JSON file with cache busting
  onMount(async () => {
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
        console.log(
          "Loaded logos:",
          logos.length,
          "at",
          new Date().toLocaleTimeString(),
        );
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

  // Compute the effective theme for children
  $: effectiveTheme =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;

  function setGridView() {
    console.log("Setting view mode to: grid");
    viewMode = "grid";
  }

  function setListView() {
    console.log("Setting view mode to: list");
    viewMode = "list";
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
    if (selectedTags.includes(tag)) {
      selectedTags = selectedTags.filter((t) => t !== tag);
    } else {
      selectedTags = [...selectedTags, tag];
    }
  }

  function addTag(tag) {
    if (!selectedTags.includes(tag)) {
      selectedTags = [...selectedTags, tag];
    }
    tagDropdownOpen = false;
  }

  function removeTag(tag) {
    selectedTags = selectedTags.filter((t) => t !== tag);
  }

  function toggleDropdown() {
    tagDropdownOpen = !tagDropdownOpen;
  }

  function closeDropdown(e) {
    if (!e.target.closest(".tag-dropdown")) {
      tagDropdownOpen = false;
    }
  }

  function getTagObj(text) {
    return allTags.find((t) => t.text === text);
  }

  function openPreview(logo) {
    selectedLogo = logo;
    showModal = true;
  }

  function openLogoByAnchor(hash) {
    if (!hash || !hash.startsWith("#preview-")) return;
    const anchor = decodeURIComponent(
      hash.replace("#preview-", "").replace(/-/g, " "),
    );
    const found = logos.find(
      (l) =>
        l.name.replace(/\s+/g, "-").toLowerCase() ===
        anchor.replace(/\s+/g, "-").toLowerCase(),
    );
    if (found) {
      openPreview(found);
    }
  }

  // Listen for outside click to close dropdown
  $: if (tagDropdownOpen) {
    window.addEventListener("click", closeDropdown);
  } else {
    window.removeEventListener("click", closeDropdown);
  }
</script>

<main class="container app-flex">
  <Header
    {logos}
    {theme}
    {setTheme}
    {viewMode}
    {setGridView}
    {setListView}
    bind:searchQuery
    setSearchQuery={setSearchQuery}
    {allTags}
    {selectedTags}
    {tagDropdownOpen}
    {toggleDropdown}
    {addTag}
    {removeTag}
    {toggleTag}
    {getTagObj}
    {closeDropdown}
    {filteredLogos}
  />

  <Preview
    bind:show={showModal}
    bind:logo={selectedLogo}
    {theme}
    {logos}
    {openLogoByAnchor}
  />

  <div class="logos-container main-content">
    {#if viewMode === "grid"}
      <Grid
        logos={filteredLogos}
        onCopy={copyUrl}
        onDownload={downloadLogo}
        theme={effectiveTheme}
        setSearchQuery={setSearchQuery}
        on:openPreview={(e) => openPreview(e.detail)}
      />
    {:else}
      <List
        logos={filteredLogos}
        onCopy={copyUrl}
        onDownload={downloadLogo}
        setSearchQuery={setSearchQuery}
        on:openPreview={(e) => openPreview(e.detail)}
      />
    {/if}
  </div>

  <footer>
    <div class="footer-flex">
      <span class="footer-left">shadoll Logo Gallery</span>
      <span class="footer-center">All logos are property of their respective owners.</span>
      <a
        href="https://github.com/shadoll/sLogos"
        target="_blank"
        rel="noopener noreferrer"
        class="footer-github"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="#ccc"
          style="margin-right:0.3em;"
        ><path
            d="M12 0.297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.387 0.6 0.113 0.82-0.258 0.82-0.577 0-0.285-0.011-1.04-0.017-2.04-3.338 0.726-4.042-1.61-4.042-1.61-0.546-1.387-1.333-1.756-1.333-1.756-1.089-0.745 0.084-0.729 0.084-0.729 1.205 0.084 1.84 1.236 1.84 1.236 1.07 1.834 2.809 1.304 3.495 0.997 0.108-0.775 0.418-1.305 0.762-1.605-2.665-0.305-5.466-1.334-5.466-5.931 0-1.311 0.469-2.381 1.236-3.221-0.124-0.303-0.535-1.523 0.117-3.176 0 0 1.008-0.322 3.301 1.23 0.957-0.266 1.983-0.399 3.003-0.404 1.02 0.005 2.047 0.138 3.006 0.404 2.291-1.553 3.297-1.23 3.297-1.23 0.653 1.653 0.242 2.873 0.119 3.176 0.77 0.84 1.235 1.91 1.235 3.221 0 4.609-2.803 5.624-5.475 5.921 0.43 0.372 0.823 1.102 0.823 2.222 0 1.606-0.015 2.898-0.015 3.293 0 0.322 0.216 0.694 0.825 0.576 4.765-1.589 8.199-6.085 8.199-11.386 0-6.627-5.373-12-12-12z"
        /></svg>
      </a>
    </div>
  </footer>

  <style>
    .app-flex {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .main-content {
      flex: 1 0 auto;
    }
    footer {
      flex: 0 0 auto;
    }
    .footer-flex {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      gap: 1em;
    }
    .footer-left {
      flex: 1;
      text-align: left;
    }
    .footer-center {
      flex: 2;
      text-align: left;
    }
    .footer-github {
      flex: 0;
      margin-left: 1em;
      display: inline-flex;
      align-items: center;
    }
    @media (max-width: 700px) {
      .footer-flex {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.3em;
      }
      .footer-left, .footer-center {
        text-align: left;
        width: 100%;
      }
      .footer-github {
        margin-left: 0;
        margin-top: 0.5em;
      }
    }
  </style>
</main>
