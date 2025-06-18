<script>
  export let allLogos = [];
  export let allTags = [];
  export let selectedTags = [];
  export let selectedBrands = [];
  export let selectedVariants = [];
  export let tagDropdownOpen = false;
  export let toggleDropdown = () => console.log("toggleDropdown not provided");
  export let addTag = () => console.log("addTag not provided");
  export let removeTag = () => console.log("removeTag not provided");
  export let addBrand = () => console.log("addBrand not provided");
  export let removeBrand = () => console.log("removeBrand not provided");
  export let addVariant = () => console.log("addVariant not provided");
  export let removeVariant = () => console.log("removeVariant not provided");
  export let getTagObj = (tag) => ({ text: tag });
  export let compactMode = false;
  export let setCompactMode = () => {};

  let tagSearchQuery = ""; // Search query for filtering tags
  let activeTab = "categories"; // "categories", "brands", or "variants"

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
      allLogos
        .map((logo) => logo.brand)
        .filter((brand) => brand && brand.trim() !== "")
    )
  ).sort();

  // Compute all unique variants
  $: allVariants = Array.from(
    new Set(
      allLogos
        .filter((logo) => logo.variants && Array.isArray(logo.variants))
        .flatMap((logo) => logo.variants)
        .filter((variant) => variant && variant.trim() !== "")
    )
  ).sort();

  // Filter brands based on search query
  $: filteredAllBrands = allBrands.filter((brand) =>
    brand.toLowerCase().includes(tagSearchQuery.toLowerCase())
  );

  // Filter variants based on search query
  $: filteredAllVariants = allVariants.filter((variant) =>
    variant.toLowerCase().includes(tagSearchQuery.toLowerCase())
  );

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

  function toggleVariant(variant) {
    if (selectedVariants.includes(variant)) {
      removeVariant(variant);
    } else {
      addVariant(variant);
    }

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

    // Update variants
    if (selectedVariants.length > 0) {
      params.set("variants", selectedVariants.join(","));
    } else {
      params.delete("variants");
    }

    const newUrl = window.location.pathname + (params.toString() ? "?" + params.toString() : "");
    history.replaceState(null, "", newUrl);
  }
</script>

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
      {#if selectedTags.length + selectedBrands.length + selectedVariants.length + (compactMode ? 1 : 0) > 0}
        <span class="filter-count"
          >{selectedTags.length + selectedBrands.length + selectedVariants.length + (compactMode ? 1 : 0)}</span
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
            on:click={() => {
              const newValue = !compactMode;
              setCompactMode(newValue);
              compactMode = newValue;
            }}
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

        {#if filteredAvailableTags.length > 0 || tagSearchQuery || allBrands.length > 0 || allVariants.length > 0}
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
              {#if allBrands.length > 0}
                <button
                  class="filter-tab"
                  class:active={activeTab === "brands"}
                  on:click={() => activeTab = "brands"}
                >
                  Owners
                </button>
              {/if}
              {#if allVariants.length > 0}
                <button
                  class="filter-tab"
                  class:active={activeTab === "variants"}
                  on:click={() => activeTab = "variants"}
                >
                  Variants
                </button>
              {/if}
            </div>

            <div class="tags-search-bar">
              <input
                type="text"
                placeholder={activeTab === "categories" ? "Search categories..." : activeTab === "brands" ? "Search brands..." : "Search variants..."}
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
            {:else if activeTab === "brands" && allBrands.length > 0}
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
            {:else if activeTab === "variants" && allVariants.length > 0}
              {#if filteredAllVariants.length > 0}
                <div class="filter-tags-list">
                  {#each filteredAllVariants as variant}
                    {@const isSelected = selectedVariants.includes(variant)}
                    <button
                      class="filter-tag-item filter-variant-item"
                      class:selected={isSelected}
                      on:click={() => toggleVariant(variant)}
                      aria-label={isSelected
                        ? `Remove variant: ${variant}`
                        : `Add variant: ${variant}`}
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
                      <span class="variant-text">{variant}</span>
                    </button>
                  {/each}
                </div>
              {:else}
                <div class="no-tags">
                  {tagSearchQuery
                    ? "No variants match your search"
                    : "No available variants"}
                </div>
              {/if}
            {/if}
          </div>
        {/if}

        {#if selectedTags.length > 0 || selectedBrands.length > 0 || selectedVariants.length > 0 || compactMode}
          <div class="filter-separator"></div>
          <div class="clear-all-section">
            <button
              class="clear-all-button"
              on:click={() => {
                selectedTags.forEach(tag => removeTag(tag));
                selectedBrands.forEach(brand => removeBrand(brand));
                [...selectedVariants].forEach(variant => removeVariant(variant));
                if (compactMode) {
                  setCompactMode(false);
                  compactMode = false;
                }
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
        class="selected-filter-btn selected-tag"
        aria-label={`Remove tag: ${getTagObj(tagText).text}`}
        on:click={() => removeTag(getTagObj(tagText).text)}
      >
        {getTagObj(tagText).text}
        <span class="close">&times;</span>
      </button>
    {/each}

    {#each selectedBrands as brand}
      <button
        class="selected-filter-btn selected-brand"
        aria-label={`Remove brand: ${brand}`}
        on:click={() => removeBrand(brand)}
      >
        {brand}
        <span class="close">&times;</span>
      </button>
    {/each}

    {#each selectedVariants as variant}
      <button
        class="selected-filter-btn selected-variant"
        aria-label={`Remove variant: ${variant}`}
        on:click={() => removeVariant(variant)}
      >
        {variant}
        <span class="close">&times;</span>
      </button>
    {/each}

    {#if compactMode}
      <button
        class="selected-filter-btn compact-indicator"
        on:click={() => {
          setCompactMode(false);
          compactMode = false;
        }}
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

<style>
  .filter-section {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0.5rem;
    align-items: flex-start;
    position: relative;
  }

  /* Base styles for all selected filter buttons */
  .selected-filter-btn {
    border: none;
    border-radius: 4px;
    padding: 0.1em 0.7em;
    font-size: 0.75em;
    font-weight: 300;
    letter-spacing: 0.02em;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.3em;
    opacity: 1;
    transition: background 0.2s, color 0.2s, transform 0.1s;
    position: relative;
    color: #fff;
  }

  .selected-filter-btn:hover {
    filter: brightness(1.6);
  }

  .selected-filter-btn .close {
    margin-left: 0.4em;
    font-size: 1.1em;
    font-weight: bold;
    cursor: pointer;
    opacity: 0.7;
    transition: opacity 0.2s;
  }

  .selected-filter-btn .close:hover {
    opacity: 1;
  }

  /* Type-specific styles */
  .selected-tag {
    background: var(--color-accent);
    color: #fff;
  }

  .selected-tag:hover {
    background: var(--color-accent);
  }

  .selected-brand {
    background: #27ae60;
    color: #fff;
  }

  .selected-brand:hover {
    background: var(--additional-color);
  }

  .selected-variant {
    background: #9b59b6;
    color: #fff;
  }

  .selected-variant:hover {
    background: #8e44ad;
  }

  .compact-indicator {
    background: var(--color-border);
    color: var(--color-text);
    opacity: 0.8;
  }

  .compact-indicator:hover {
    opacity: 1;
    background: var(--color-text);
    color: var(--color-card);
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

  .filter-variant-item.selected {
    background: none;
    color: var(--color-text);
  }

  .filter-variant-item.selected:hover {
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

  .variant-text {
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
</style>
