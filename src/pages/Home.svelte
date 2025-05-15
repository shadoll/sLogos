<script>
  import { onMount } from "svelte";
  import Grid from "../components/Grid.svelte";
  import List from "../components/List.svelte";
  import Header from "../components/Header.svelte";

  // Use the app's global data without reloading
  let appData = {};
  let initialized = false;

  // Simple function to get data from the global app object
  function getAppData() {
    if (typeof window !== "undefined" && window.appData) {
      console.log("Home: Using app data with",
        window.appData.logos ? window.appData.logos.length : 0, "logos",
        "displayLogos:", window.appData.displayLogos ? window.appData.displayLogos.length : 0);

      // Create a fresh copy to trigger reactivity
      appData = {
        ...window.appData,
        logos: [...(window.appData.logos || [])],
        displayLogos: [...(window.appData.displayLogos || [])],
        filteredLogos: [...(window.appData.filteredLogos || [])]
      };

      initialized = true;
    } else {
      console.log("Home: window.appData not available yet");
    }
  }

  // Consolidate the onMount functions into a single one
  onMount(() => {
    getAppData();

    // If not initialized yet, set up an interval to check for data
    if (!initialized) {
      console.log("Home: Setting up retry interval for logos data");
      const interval = setInterval(() => {
        if (window.appData && window.appData.logos && window.appData.logos.length > 0) {
          console.log("Home: Data now available:",
            window.appData.logos.length, "logos");
          getAppData();
          initialized = true;
          clearInterval(interval);
        } else {
          console.log("Home: Waiting for logo data, current status:",
            window.appData ? `${window.appData.logos?.length || 0} logos` : "no window.appData");
        }
      }, 200); // Increased interval for better logging

      // No cleanup here - we'll handle in the second part
    }

    // Also watch for changes to window.appData
  let logoCheckInterval;
  let lastViewMode = '';
  let lastCompactMode = false;
  let lastSearchQuery = '';
  let lastSelectedTags = [];
  let lastTagDropdownOpen = false;
  let lastDisplayLogosCount = 0;

  // Set up the interval for watching changes
  logoCheckInterval = setInterval(() => {
    if (window.appData) {
      // Check for logo updates
      if (window.appData.logos &&
          window.appData.logos.length > 0 &&
          (!appData.logos || appData.logos.length === 0)) {
        console.log("Home: Detected logos update in window.appData:", window.appData.logos.length);
        getAppData();
        initialized = true;
      }

      // Check for view mode changes
      if (window.appData.viewMode !== lastViewMode) {
        console.log("Home: Detected viewMode change:",
          lastViewMode, "→", window.appData.viewMode);
        lastViewMode = window.appData.viewMode;
        getAppData();
      }

      // Check for compact mode changes
      if (window.appData.compactMode !== lastCompactMode) {
        console.log("Home: Detected compactMode change:",
          lastCompactMode, "→", window.appData.compactMode);
        lastCompactMode = window.appData.compactMode;
        getAppData();
      }

      // Check for search query changes
      if (window.appData.searchQuery !== lastSearchQuery) {
        console.log("Home: Detected searchQuery change:",
          lastSearchQuery, "→", window.appData.searchQuery);
        lastSearchQuery = window.appData.searchQuery;
        getAppData();
      }

      // Check for display logos count changes
      if (window.appData.displayLogos &&
          window.appData.displayLogos.length !== lastDisplayLogosCount) {
        console.log("Home: Detected displayLogos count change:",
          lastDisplayLogosCount, "→", window.appData.displayLogos.length);
        lastDisplayLogosCount = window.appData.displayLogos.length;
        getAppData();
      }

      // Check for tag selection changes
      const currentSelectedTags = window.appData.selectedTags || [];
      if (JSON.stringify(currentSelectedTags) !== JSON.stringify(lastSelectedTags)) {
        console.log("Home: Detected selectedTags change, now:",
          currentSelectedTags.length, "tags");
        lastSelectedTags = [...currentSelectedTags];
        getAppData();
      }

      // Check for tag dropdown state changes
      if (window.appData.tagDropdownOpen !== lastTagDropdownOpen) {
        console.log("Home: Detected tagDropdownOpen change:",
          lastTagDropdownOpen, "→", window.appData.tagDropdownOpen);
        lastTagDropdownOpen = window.appData.tagDropdownOpen;
        getAppData();
      }
    }
  }, 100); // Faster interval for UI responsiveness

  // Cleanup function to clear the interval when component is destroyed
  return () => clearInterval(logoCheckInterval);
});
</script>

{#if initialized}
  <div class="home-container">
    <Header
      logos={appData.logos || []}
      displayLogos={appData.displayLogos || []}
      theme={appData.theme || "light"}
      setTheme={appData.setTheme || ((t) => {})}
      viewMode={appData.viewMode || "grid"}
      setGridView={appData.setGridView || (() => {})}
      setListView={appData.setListView || (() => {})}
      searchQuery={appData.searchQuery || ""}
      setSearchQuery={appData.setSearchQuery || ((q) => {})}
      allTags={appData.allTags || []}
      selectedTags={appData.selectedTags || []}
      tagDropdownOpen={appData.tagDropdownOpen || false}
      toggleDropdown={appData.toggleDropdown || (() => {})}
      addTag={appData.addTag || (() => {})}
      removeTag={appData.removeTag || (() => {})}
      getTagObj={appData.getTagObj || ((t) => ({text: t}))}
      compactMode={appData.compactMode || false}
      setCompactMode={appData.setCompactMode || ((val) => {})}
    />

    <div class="logos-container main-content">
      {#if appData.viewMode === "grid"}
        <Grid
          logos={appData.displayLogos || []}
          allLogos={appData.logos || []}
          onCopy={appData.onCopy || ((p) => {})}
          onDownload={appData.onDownload || ((p, n) => {})}
          setSearchQuery={appData.setSearchQuery || ((q) => {})}
          theme={appData.effectiveTheme || "light"}
        />
      {:else}
        <List
          logos={appData.displayLogos || []}
          allLogos={appData.logos || []}
          onCopy={appData.onCopy || ((p) => {})}
          onDownload={appData.onDownload || ((p, n) => {})}
          setSearchQuery={appData.setSearchQuery || ((q) => {})}
        />
      {/if}
    </div>

    <!-- Footer -->
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
  </div>
{:else}
  <div class="loading">
    <p>Loading...</p>
  </div>
{/if}

<style>
  .home-container {
    width: 100%;
  }

  .logos-container {
    padding: 1rem;
  }

  .main-content {
    flex: 1 0 auto;
  }

  .loading {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    font-size: 1.5rem;
    color: var(--color-text);
  }

  footer {
    padding: 1.5rem;
    background: var(--color-background);
    color: var(--color-text-muted);
    border-top: 1px solid var(--color-border);
    font-size: 0.9rem;
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
