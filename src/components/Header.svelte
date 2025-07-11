<script>
  import { onMount } from "svelte";
  import Filter from "./Filter.svelte";
  import ThemeSwitcher from "./ThemeSwitcher.svelte";
  import ListViewSwitcher from "./ListViewSwitcher.svelte";
  import SearchBar from "./SearchBar.svelte";
  import { collections } from "../collections.js";

  export let displayLogos = [];
  export let allLogos = []; // Add this to get total count
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
  export let collection = "logos";
  export let setCollection = () => {};

  let dropdownOpen = false;

  function handleTitleClick() {
    dropdownOpen = !dropdownOpen;
  }

  function handleCollectionSelect(name) {
    setCollection(name);
    dropdownOpen = false;
  }

  $: currentCollectionObj = collections.find(c => c.name === collection);
  $: currentLabel = (currentCollectionObj?.title || currentCollectionObj?.label || "Logo Gallery").replace(/s$/, "");
</script>

<header class="main-header">
  <div class="header-row">
    <div class="header-title">
      <div class="header-icon">
        <img src="favicon.svg" alt="Logo Gallery icon" />
      </div>
      <button class="collection-title-btn" on:click={handleTitleClick} aria-haspopup="listbox" aria-expanded={dropdownOpen}>
        {currentLabel} <span class="triangle">▼</span>
      </button>
      {#if dropdownOpen}
        <ul class="collection-dropdown" role="listbox">
          {#each collections as c}
            <li
              class:active={c.name === collection}
              role="option"
              aria-selected={c.name === collection}
              tabindex="0"
              on:click={() => handleCollectionSelect(c.name)}
              on:keydown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleCollectionSelect(c.name);
                }
              }}
            >{c.title} Gallery</li>
          {/each}
        </ul>
      {/if}
    </div>
    <span class="logo-count">
      {#if (searchQuery && searchQuery.trim() !== "") || selectedTags.length > 0 || selectedBrands.length > 0 || selectedVariants.length > 0 || compactMode}
        {displayLogos ? displayLogos.length : 0} of {allLogos ? allLogos.length : 0} images
        displayed
      {:else}
        {allLogos ? allLogos.length : 0} images in gallery
      {/if}
    </span>
    <ThemeSwitcher {theme} {setTheme} />
  </div>

  <div class="header-row header-controls">
    <SearchBar {searchQuery} {setSearchQuery} />
    <Filter
      {allLogos}
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
      collection={currentCollectionObj}
    />
    <ListViewSwitcher
      {viewMode}
      {setGridView}
      {setListView}
      {setCompactView}
    />
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

  .header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.5rem;
  }

  .logo-count {
    font-family: system-ui, Arial, sans-serif;
    font-size: 0.6rem;
    font-weight: normal;
    color: var(--color-text);
    opacity: 0.7;
    margin-left: 1rem;
    align-self: center;
    padding-top: 0.9rem;
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

  .collection-title-btn {
    background: none;
    border: none;
    font: inherit;
    color: inherit;
    font-size: 1.5rem;
    font-weight: bold;
    display: flex;
    align-items: center;
    gap: 0.3em;
    cursor: pointer;
    padding: 0;
    margin: 0 1rem 0 0;
    position: relative;
    transition: color 0.15s;
  }
  .collection-title-btn:hover,
  .collection-title-btn:focus {
    color: var(--color-primary, #0070f3);
  }
  .triangle {
    font-size: 1rem;
    margin-left: 0.2em;
    transition: transform 0.2s;
  }
  .collection-title-btn[aria-expanded="true"] .triangle {
    transform: rotate(180deg);
  }
  .collection-dropdown {
    position: absolute;
    top: 2.2em;
    left: 0;
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    z-index: 10;
    min-width: 180px;
    padding: 0.3em 0;
    margin: 0;
    list-style: none;
  }
  .collection-dropdown li {
    padding: 0.5em 1.2em;
    cursor: pointer;
    font-size: 1.1rem;
    color: var(--color-text);
    transition: background 0.13s, color 0.13s;
  }
  .collection-dropdown li.active,
  .collection-dropdown li:hover {
    background: var(--color-primary, #0070f3);
    color: #fff;
  }

  .header-controls {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin: 1rem 0;
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

    .header-controls :global(.search-bar) {
      grid-column: 1;
      grid-row: 1;
    }

    .header-controls :global(.view-toggle) {
      grid-column: 2;
      grid-row: 1;
    }

    .header-controls :global(.filter-section) {
      grid-column: 1 / -1;
      grid-row: 2;
    }
  }
</style>
