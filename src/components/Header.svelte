<script>
  import { onMount } from "svelte";

  export let logos = [];
  export let displayLogos = [];
  export let theme = "system";
  export let setTheme = () => {};
  export let viewMode;
  export let setGridView;
  export let setListView;
  export let setCompactView;
  export let searchQuery;
  export let setSearchQuery;
  export let allTags = [];
  export let selectedTags = [];
  export let selectedBrands = [];
  export let tagDropdownOpen = false;
  export let toggleDropdown = () => console.log("toggleDropdown not provided");
  export let addTag = () => console.log("addTag not provided");
  export let removeTag = () => console.log("removeTag not provided");
  export let addBrand = () => console.log("addBrand not provided");
  export let removeBrand = () => console.log("removeBrand not provided");
  export let getTagObj = (tag) => ({ text: tag });
  export let compactMode = false;
  export let setCompactMode = () => {};

  let searchInput; // Reference to the search input element
  let tagSearchQuery = ""; // Search query for filtering tags
  let activeTab = "categories"; // "categories" or "brands"

  // Filter available tags based on search query
  $: filteredAvailableTags = allTags.filter(
    (t) =>
      !selectedTags.includes(t.text) &&
      t.text.toLowerCase().includes(tagSearchQuery.toLowerCase()),
  );

  // Filter all tags based on search query (both selected and unselected)
  $: filteredAllTags = allTags.filter((t) =>
    t.text.toLowerCase().includes(tagSearchQuery.toLowerCase()),
  );

  // Compute all unique brands
  $: allBrands = Array.from(
    new Set(
      logos
        .map((logo) => logo.brand)
        .filter((brand) => brand && brand.trim() !== "")
    )
  ).sort();

  // Filter brands based on search query
  $: filteredAllBrands = allBrands.filter((brand) =>
    brand.toLowerCase().includes(tagSearchQuery.toLowerCase())
  );

  onMount(() => {
    // Add global keydown listener for the / hotkey
    function handleKeydown(event) {
      // Check if the / key is pressed and no input/textarea is focused
      if (
        event.key === "/" &&
        !["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)
      ) {
        event.preventDefault(); // Prevent the / character from being typed
        searchInput?.focus(); // Focus the search input
      }
    }

    document.addEventListener("keydown", handleKeydown);

    // Cleanup listener on component destroy
    return () => {
      document.removeEventListener("keydown", handleKeydown);
    };
  });

  function onInput(event) {
    searchQuery = event.target.value;
    setSearchQuery(searchQuery);
    // Update URL with search param
    const params = new URLSearchParams(window.location.search);
    if (searchQuery) {
      params.set("search", searchQuery);
    } else {
      params.delete("search");
    }
    const newUrl =
      window.location.pathname +
      (params.toString() ? "?" + params.toString() : "");
    history.replaceState(null, "", newUrl);

    console.log("Header: Search query set to:", searchQuery);
  }

  function toggleBrand(brand) {
    if (selectedBrands.includes(brand)) {
      selectedBrands = selectedBrands.filter(b => b !== brand);
    } else {
      selectedBrands = [...selectedBrands, brand];
    }

    // Save to localStorage
    localStorage.setItem("selectedBrands", JSON.stringify(selectedBrands));

    // Update URL parameters
    updateFilterParams();
  }

  function updateFilterParams() {
    const params = new URLSearchParams(window.location.search);

    // Update tags
    if (selectedTags.length > 0) {
      params.set("tags", selectedTags.join(","));
    } else {
      params.delete("tags");
    }

    // Update brands
    if (selectedBrands.length > 0) {
      params.set("brands", selectedBrands.join(","));
    } else {
      params.delete("brands");
    }

    const newUrl = window.location.pathname + (params.toString() ? "?" + params.toString() : "");
    history.replaceState(null, "", newUrl);


  }
</script>

<header class="main-header">
  <div class="header-row">
    <div class="header-title">
      <div class="header-icon">
        <img src="favicon.svg" alt="Logo Gallery icon" />
      </div>
      <h1>Logo Gallery</h1>
    </div>
    <span class="logo-count">
      {#if displayLogos && logos && displayLogos.length === logos.length}
        {logos.length} images in gallery
      {:else}
        {displayLogos ? displayLogos.length : 0} of {logos ? logos.length : 0} images
        displayed
      {/if}
    </span>
    <div class="theme-switcher">
      <div class="theme-switch-group button-group">
        <button
          on:click={() => setTheme("system")}
          class:active={theme === "system"}
          aria-label="System theme"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            ><circle
              cx="10"
              cy="10"
              r="8"
              stroke="currentColor"
              stroke-width="2"
            /><path
              d="M10 2a8 8 0 0 1 8 8"
              stroke="currentColor"
              stroke-width="2"
            /></svg
          >
        </button>
        <button
          on:click={() => setTheme("light")}
          class:active={theme === "light"}
          aria-label="Light mode"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            ><circle
              cx="10"
              cy="10"
              r="5"
              stroke="currentColor"
              stroke-width="2"
            /><path
              d="M10 1v2M10 17v2M3.22 3.22l1.42 1.42M15.36 15.36l1.42 1.42M1 10h2M17 10h2M3.22 16.78l1.42-1.42M15.36 4.64l1.42-1.42"
              stroke="currentColor"
              stroke-width="2"
            /></svg
          >
        </button>
        <button
          on:click={() => setTheme("dark")}
          class:active={theme === "dark"}
          aria-label="Dark mode"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            ><path
              d="M15.5 13A7 7 0 0 1 7 4.5a7 7 0 1 0 8.5 8.5z"
              stroke="currentColor"
              stroke-width="2"
            /></svg
          >
        </button>
      </div>
    </div>
  </div>

  <div class="header-row header-controls">
    <div class="search-bar">
      <input
        type="text"
        placeholder="Search logos..."
        bind:value={searchQuery}
        bind:this={searchInput}
        on:input={onInput}
        aria-label="Search logos"
      />
      {#if searchQuery}
        <button
          class="clear-btn"
          on:click={() => {
            searchQuery = "";
            setSearchQuery("");
            const params = new URLSearchParams(window.location.search);
            params.delete("search");
            const newUrl =
              window.location.pathname +
              (params.toString() ? "?" + params.toString() : "");
            history.replaceState(null, "", newUrl);
            console.log("Header: Search query cleared");
          }}
          aria-label="Clear search"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M4 4L12 12M12 4L4 12"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
        </button>
      {/if}
      <div class="hotkey-hint">
        <kbd>/</kbd>
      </div>
    </div>
    <div class="filter-section">
      <div class="filter-dropdown">
        <button
          class="filter-toggle"
          on:click|stopPropagation={toggleDropdown}
          aria-label="Open filter options"
          class:active={tagDropdownOpen}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3 4a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v2a1 1 0 0 1-.293.707L14 13.414V19a1 1 0 0 1-.553.894l-2 1A1 1 0 0 1 10 20v-6.586L3.293 6.707A1 1 0 0 1 3 6V4z"
              fill="currentColor"
            />
          </svg>
          {#if selectedTags.length + selectedBrands.length + (compactMode ? 1 : 0) > 0}
            <span class="filter-count"
              >{selectedTags.length + selectedBrands.length + (compactMode ? 1 : 0)}</span
            >
          {/if}
        </button>
        {#if tagDropdownOpen}
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <div class="filter-dropdown-panel" on:click|stopPropagation>
            <div class="filter-options">
              <button
                class="filter-option-item"
                class:selected={compactMode}
                on:click={() => setCompactMode(!compactMode)}
                aria-label={compactMode
                  ? "Disable group by brand"
                  : "Enable group by brand"}
              >
                <span class="option-icon">
                  <span class="permanent-icon">
                    {#if compactMode}
                      ✔️
                    {/if}
                  </span>
                  <span class="hover-icon">
                    {#if compactMode}
                      ✕
                    {:else}
                      ✔︎
                    {/if}
                  </span>
                </span>
                <span class="option-label"> Group by brand </span>
              </button>
            </div>

            {#if filteredAvailableTags.length > 0 || tagSearchQuery || allBrands.length > 0}
              <div class="filter-separator"></div>
              <div class="filter-tabs-section">
                <div class="filter-tabs">
                  <button
                    class="filter-tab"
                    class:active={activeTab === "categories"}
                    on:click={() => activeTab = "categories"}
                  >
                    Categories
                  </button>
                  <button
                    class="filter-tab"
                    class:active={activeTab === "brands"}
                    on:click={() => activeTab = "brands"}
                  >
                    Brands
                  </button>
                </div>

                <div class="tags-search-bar">
                  <input
                    type="text"
                    placeholder={activeTab === "categories" ? "Search categories..." : "Search brands..."}
                    bind:value={tagSearchQuery}
                    class="tags-search-input"
                  />
                  {#if tagSearchQuery}
                    <button
                      class="tags-search-clear"
                      on:click|stopPropagation={() => (tagSearchQuery = "")}
                      aria-label="Clear search"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M4 4L12 12M12 4L4 12"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                        />
                      </svg>
                    </button>
                  {/if}
                </div>

                {#if activeTab === "categories"}
                  {#if filteredAllTags.length > 0}
                    <div class="filter-tags-list">
                      {#each filteredAllTags as tagObj}
                        {@const isSelected = selectedTags.includes(tagObj.text)}
                        <button
                          class="filter-tag-item"
                          class:selected={isSelected}
                          on:click={() =>
                            isSelected
                              ? removeTag(tagObj.text)
                              : addTag(tagObj.text)}
                          aria-label={isSelected
                            ? `Remove tag: ${tagObj.text}`
                            : `Add tag: ${tagObj.text}`}
                        >
                          <span class="tag-icon">
                            <span class="permanent-icon">
                              {#if isSelected}
                                ✔︎
                              {/if}
                            </span>
                            <span class="hover-icon">
                              {#if isSelected}
                                ✕
                              {:else}
                                ✔︎
                              {/if}
                            </span>
                          </span>
                          <span
                            class="tag-text"
                            style={tagObj.color ? `color: ${tagObj.color};` : ""}
                            >{tagObj.text}</span
                          >
                        </button>
                      {/each}
                    </div>
                  {:else}
                    <div class="no-tags">
                      {tagSearchQuery
                        ? "No categories match your search"
                        : "No available categories"}
                    </div>
                  {/if}
                {:else}
                  {#if filteredAllBrands.length > 0}
                    <div class="filter-tags-list">
                      {#each filteredAllBrands as brand}
                        {@const isSelected = selectedBrands.includes(brand)}
                        <button
                          class="filter-tag-item filter-brand-item"
                          class:selected={isSelected}
                          on:click={() =>
                            isSelected
                              ? removeBrand(brand)
                              : addBrand(brand)}
                          aria-label={isSelected
                            ? `Remove brand: ${brand}`
                            : `Add brand: ${brand}`}
                        >
                          <span class="tag-icon">
                            <span class="permanent-icon">
                              {#if isSelected}
                                ✔︎
                              {/if}
                            </span>
                            <span class="hover-icon">
                              {#if isSelected}
                                ✕
                              {:else}
                                ✔︎
                              {/if}
                            </span>
                          </span>
                          <span class="brand-text">{brand}</span>
                        </button>
                      {/each}
                    </div>
                  {:else}
                    <div class="no-tags">
                      {tagSearchQuery
                        ? "No brands match your search"
                        : "No available brands"}
                    </div>
                  {/if}
                {/if}
              </div>
            {/if}

            {#if selectedTags.length > 0 || selectedBrands.length > 0 || compactMode}
              <div class="filter-separator"></div>
              <div class="clear-all-section">
                <button
                  class="clear-all-button"
                  on:click={() => {
                    selectedTags.forEach(tag => removeTag(tag));
                    selectedBrands.forEach(brand => removeBrand(brand));
                    if (compactMode) setCompactMode(false);
                  }}
                  aria-label="Clear all filters"
                >
                  <span class="clear-all-icon">✕</span>
                  <span class="clear-all-text">Clear all</span>
                </button>
              </div>
            {/if}
          </div>
        {/if}
      </div>

      <div class="selected-filters">
        {#each selectedTags as tagText}
          <button
            class="selected-tag"
            aria-label={`Remove tag: ${getTagObj(tagText).text}`}
            on:click={() => removeTag(getTagObj(tagText).text)}
          >
            {getTagObj(tagText).text}
            <span class="close">&times;</span>
          </button>
        {/each}

        {#each selectedBrands as brand}
          <button
            class="selected-brand"
            aria-label={`Remove brand: ${brand}`}
            on:click={() => removeBrand(brand)}
          >
            {brand}
            <span class="close">&times;</span>
          </button>
        {/each}

        {#if compactMode}
          <button
            class="compact-indicator"
            on:click={() => setCompactMode(false)}
            aria-label="Disable group by brand"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10 11L3 11"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
              <path
                d="M10 16H3"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
              <path
                d="M14 13.5L16.1 16L20 11"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M3 6L13.5 6M20 6L17.75 6"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
            </svg>
            Group by brand
            <span class="close">&times;</span>
          </button>
        {/if}
      </div>
    </div>
    <div class="view-toggle">
      <div class="view-mode-group button-group">
        <button
          class:active={viewMode === "compact"}
          on:click={setCompactView}
          aria-label="Compact view"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect x="2" y="2" width="4" height="4" fill="currentColor" />
            <rect x="8" y="2" width="4" height="4" fill="currentColor" />
            <rect x="14" y="2" width="4" height="4" fill="currentColor" />
            <rect x="2" y="8" width="4" height="4" fill="currentColor" />
            <rect x="8" y="8" width="4" height="4" fill="currentColor" />
            <rect x="14" y="8" width="4" height="4" fill="currentColor" />
            <rect x="2" y="14" width="4" height="4" fill="currentColor" />
            <rect x="8" y="14" width="4" height="4" fill="currentColor" />
            <rect x="14" y="14" width="4" height="4" fill="currentColor" />
          </svg>
        </button>
        <button
          class:active={viewMode === "grid"}
          on:click={setGridView}
          aria-label="Grid view"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            ><rect x="3" y="3" width="6" height="6" fill="currentColor" /><rect
              x="11"
              y="3"
              width="6"
              height="6"
              fill="currentColor"
            /><rect
              x="3"
              y="11"
              width="6"
              height="6"
              fill="currentColor"
            /><rect
              x="11"
              y="11"
              width="6"
              height="6"
              fill="currentColor"
            /></svg
          >
        </button>
        <button
          class:active={viewMode === "list"}
          on:click={setListView}
          aria-label="List view"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            ><rect x="4" y="5" width="12" height="2" fill="currentColor" /><rect
              x="4"
              y="9"
              width="12"
              height="2"
              fill="currentColor"
            /><rect
              x="4"
              y="13"
              width="12" height="2" fill="currentColor" /></svg
          >
        </button>
      </div>
    </div>
  </div>
</header>

<style>
  .main-header {
    padding: 0.5rem 1rem;
    background: var(--color-card);
    border-bottom: 1px solid var(--color-border);
    border-radius: 0;
    margin-bottom: 1rem;
  }

  .header-title {
    display: flex;
    align-items: center;
    gap: 0.5em;
  }

  .header-icon {
    width: 28px;
    height: 28px;
    border-radius: 4px;
  }

  .header-icon {
    width: 28px;
    height: 28px;
  }

  .header-controls {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin: 1rem 0;
  }

  .search-bar {
    margin-bottom: 0;
    width: 100%;
    max-width: 500px;
    position: relative;
    display: flex;
    align-items: center;
  }

  .search-bar input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    font-size: 1rem;
    background: var(--color-card);
    color: var(--color-text);
    padding-right: 4em;
  }

  .clear-btn {
    position: absolute;
    right: 2.5em; /* Positioned to leave space for hotkey hint */
    background: none;
    border: none;
    padding: 0;
    margin: 0;
    cursor: pointer;
    color: #888;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
  }

  .clear-btn:hover {
    color: #f44336;
  }

  .hotkey-hint {
    position: absolute;
    right: 0.5em;
    display: flex;
    align-items: center;
    pointer-events: none;
  }

  .hotkey-hint kbd {
    background: var(--color-border);
    color: var(--color-text);
    border: 1px solid var(--color-border);
    border-radius: 3px;
    padding: 0.2em 0.4em;
    font-size: 0.75em;
    font-family: monospace;
    font-weight: bold;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }

  .theme-switcher {
    display: flex;
    align-items: center;
    gap: 0.2rem;
    margin-left: auto;
  }

  .filter-section {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0.5rem;
    align-items: flex-start;
    position: relative;
  }

  .selected-tag {
    background: var(--color-accent);
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 0.1em 0.8em;
    font-size: 0.75em;
    font-weight: 300;
    letter-spacing: 0.02em;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.3em;
    opacity: 1;
    transition:
      background 0.2s,
      color 0.2s;
  }

  .selected-tag .close {
    margin-left: 0.4em;
    font-size: 1.1em;
    font-weight: bold;
    cursor: pointer;
    opacity: 0.7;
    transition: opacity 0.2s;
  }

  .selected-tag .close:hover {
    opacity: 1;
  }

  .compact-indicator {
    background: var(--color-border);
    color: var(--color-text);
    border: none;
    border-radius: 8px;
    padding: 0.1em 0.8em;
    font-size: 0.75em;
    font-weight: 300;
    display: flex;
    align-items: center;
    gap: 0.4em;
    opacity: 0.8;
    cursor: pointer;
    transition:
      background 0.2s,
      color 0.2s,
      opacity 0.2s;
  }

  .compact-indicator:hover {
    opacity: 1;
    background: var(--color-text);
    color: var(--color-card);
  }

  .compact-indicator .close {
    margin-left: 0.4em;
    font-size: 1.1em;
    font-weight: bold;
    cursor: pointer;
    opacity: 0.7;
    transition: opacity 0.2s;
  }

  .compact-indicator .close:hover {
    opacity: 1;
  }

  .filter-dropdown {
    grid-column: 1;
    position: relative;
    display: inline-block;
  }

  .filter-toggle {
    background: var(--color-card);
    color: var(--color-text);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    padding: 0.6em 0.8em;
    font-size: 0.9em;
    cursor: pointer;
    transition:
      background 0.2s,
      color 0.2s,
      border-color 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    gap: 0.3rem;
    height: 40px;
  }

  .filter-toggle:hover,
  .filter-toggle.active {
    background: var(--color-accent);
    color: #fff;
    border-color: var(--color-accent);
  }

  .filter-count {
    background: var(--color-accent);
    color: #fff;
    border-radius: 50%;
    min-width: 16px;
    height: 16px;
    font-size: 0.7em;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    bottom: -6px;
    right: -6px;
    padding: 0 2px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }

  .filter-toggle.active .filter-count {
    background: #fff;
    color: var(--color-accent);
  }

  .filter-dropdown-panel {
    position: absolute;
    left: 0;
    top: 100%;
    margin-top: 0.5rem;
    min-width: 250px;
    background: var(--color-card);
    color: var(--color-text);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .filter-options {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .filter-separator {
    height: 1px;
    background: var(--color-border);
    margin: 0.5rem 0;
  }

  .filter-tabs {
    display: flex;
    margin-bottom: 0.5rem;
  }

  .filter-tab {
    flex: 1;
    background: none;
    border: none;
    padding: 0.4rem 0.8rem;
    font-size: 0.85em;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    color: var(--color-text);
    opacity: 0.7;
    border-radius: 0;
  }

  .filter-tab.active {
    background: var(--color-card);
    opacity: 1;
  }

  .filter-tab:hover:not(.active) {
    opacity: 0.9;
  }

  .tags-search-bar {
    position: relative;
    margin-bottom: 0.5rem;
  }

  .tags-search-input {
    width: 100%;
    padding: 0.5rem 2.5rem 0.5rem 0.5rem;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    font-size: 0.85em;
    background: var(--color-card);
    color: var(--color-text);
  }

  .tags-search-clear {
    position: absolute;
    right: 0.5rem;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    padding: 0.2rem;
    cursor: pointer;
    color: #888;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 2px;
    transition:
      color 0.2s,
      background 0.2s;
  }

  .tags-search-clear:hover {
    color: #f44336;
  }

  .filter-tags-list {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    max-height: 200px;
    overflow-y: auto;
  }

  .filter-tag-item {
    background: none;
    border: none;
    padding: 0.4rem 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    border-radius: 4px;
    transition: background 0.2s;
    text-align: left;
    color: var(--color-text);
  }

  .filter-tag-item:hover {
    background: var(--color-border);
  }

  .filter-tag-item.selected {
    background: none;
    color: var(--color-text);
  }

  .filter-tag-item.selected:hover {
    background: var(--color-border);
    opacity: 1;
  }

  .filter-brand-item.selected {
    background: none;
    color: var(--color-text);
  }

  .filter-brand-item.selected:hover {
    background: var(--color-border);
  }

  .tag-icon {
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    position: relative;
    font-size: 14px;
  }

  .filter-tag-item .tag-icon .hover-icon {
    opacity: 0;
    transition: opacity 0.2s;
    position: absolute;
  }

  .filter-tag-item:hover .tag-icon .hover-icon {
    opacity: 1;
  }

  .filter-tag-item:hover .tag-icon .permanent-icon {
    opacity: 0;
  }

  .filter-option-item:hover .option-icon .hover-icon {
    opacity: 1;
  }

  .filter-option-item:hover .option-icon .permanent-icon {
    opacity: 0;
  }

  .tag-text {
    font-size: 0.85em;
    font-weight: 500;
  }

  .brand-text {
    font-size: 0.85em;
    font-weight: 500;
  }

  .no-tags {
    color: #888;
    font-size: 0.85em;
    padding: 1rem;
    text-align: center;
    font-style: italic;
  }

  .filter-option-item {
    background: none;
    border: none;
    padding: 0.4rem 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    border-radius: 4px;
    transition: background 0.2s;
    text-align: left;
    color: var(--color-text);
    width: 100%;
  }

  .filter-option-item:hover {
    background: var(--color-border);
  }

  .option-icon {
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    position: relative;
    font-size: 14px;
  }

  .filter-option-item .option-icon .hover-icon {
    opacity: 0;
    transition: opacity 0.2s;
    position: absolute;
  }

  .filter-option-item:hover .option-icon .hover-icon {
    opacity: 1;
  }

  .filter-option-item:hover .option-icon > *:not(.hover-icon) {
    opacity: 0;
  }

  .permanent-icon {
    position: absolute;
    transition: opacity 0.2s;
  }

  .hover-icon {
    opacity: 0;
    transition: opacity 0.2s;
    position: absolute;
  }

  .clear-all-section {
    display: flex;
    flex-direction: column;
  }

  .clear-all-button {
    background: none;
    border: none;
    padding: 0.4rem 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    border-radius: 4px;
    transition: background 0.2s;
    text-align: left;
    color: var(--color-text);
    width: 100%;
  }

  .clear-all-button:hover {
    background: var(--color-border);
  }

  .clear-all-icon {
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 14px;
  }

  .clear-all-text {
    font-size: 0.85em;
    font-weight: 500;
  }

  .filter-tabs {
    display: flex;
    border-bottom: 1px solid var(--color-border);
    margin-bottom: 0.75rem;
  }

  .filter-tab {
    background: none;
    border: none;
    color: var(--color-text);
    cursor: pointer;
    padding: 0.5rem 0.75rem;
    border-bottom: 2px solid transparent;
    transition: color 0.2s, border-color 0.2s;
    font-size: 0.9rem;
    opacity: 0.7;
    border-radius: 0;
  }

  .filter-tab:hover {
    opacity: 1;
  }

  .filter-tab.active {
    color: var(--color-accent);
    border-bottom-color: var(--color-accent);
    opacity: 1;
    font-weight: 500;
    box-shadow: none;
  }

  .selected-brand {
    background: #27ae60;
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 0.2em 0.8em 0.2em 0.8em;
    font-size: 0.85em;
    font-weight: 500;
    letter-spacing: 0.02em;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.3em;
    opacity: 1;
    transition:
      background 0.2s,
      color 0.2s;
  }

  .selected-brand:hover {
    background: #219150;
  }

  .selected-brand .close {
    margin-left: 0.4em;
    font-size: 1.1em;
    font-weight: bold;
    cursor: pointer;
    opacity: 0.7;
    transition: opacity 0.2s;
  }

  .selected-brand .close:hover {
    opacity: 1;
  }

  .selected-filters {
    grid-column: 2;
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
    align-items: flex-end;
    min-height: 2.5rem;
    max-height: 5rem;
    overflow: hidden;
  }

  @media (max-width: 700px) {
    .header-row {
      display: grid;
      grid-template-columns: 1fr auto;
      grid-template-rows: auto auto;
      gap: 0.5rem;
      align-items: center;
    }

    .header-title {
      grid-column: 1;
      grid-row: 1;
    }

    .theme-switcher {
      grid-column: 2;
      grid-row: 1;
    }

    .logo-count {
      grid-column: 1 / -1;
      grid-row: 2;
      margin-left: 0;
      padding-top: 0;
      justify-self: start;
    }

    .header-controls {
      display: grid;
      grid-template-columns: 1fr auto;
      grid-template-rows: auto auto;
      gap: 1rem;
      margin: 1rem 0;
    }

    .search-bar {
      grid-column: 1;
      grid-row: 1;
    }

    .view-toggle {
      grid-column: 2;
      grid-row: 1;
    }

    .filter-section {
      grid-column: 1 / -1;
      grid-row: 2;
    }
  }
</style>
