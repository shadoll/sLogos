<script>
  import { onMount } from "svelte";
  import Grid from "../components/Grid.svelte";
  import List from "../components/List.svelte";
  import Header from "../components/Header.svelte";
  import Footer from "../components/Footer.svelte";

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

  <main class="logos-container">
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
  </main>

  <Footer />
{:else}
  <div class="loading">
    <p>Loading...</p>
  </div>
{/if}

<style>
  .logos-container {
    padding: 1rem;
  }

  .loading {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    font-size: 1.5rem;
    color: var(--color-text);
  }
</style>
