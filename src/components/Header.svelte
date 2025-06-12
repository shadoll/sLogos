<script>
  import { onMount } from "svelte";
  import Filter from "./Filter.svelte";
  import ThemeSwitcher from "./ThemeSwitcher.svelte";
  import ListViewSwitcher from "./ListViewSwitcher.svelte";
  import SearchBar from "./SearchBar.svelte";

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
