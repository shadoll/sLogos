<script>
  import { onMount } from 'svelte';
  import Header from '../components/Header.svelte';
  import List from '../components/List.svelte';
  import Footer from '../components/Footer.svelte';

  let logos = [];
  let allLogos = [];
  let viewMode = "grid";
  let theme = "system";
  let searchQuery = "";
  let compactMode = false;
  let tagDropdownOpen = false;
  let selectedTags = [];
  let allTags = [];
  let selectedBrands = [];
  let selectedVariants = [];
  let addBrand = () => {};
  let removeBrand = () => {};
  let addVariant = () => {};
  let removeVariant = () => {};
  let setTheme = () => {};
  let collection = "logos"; // Default collection
  let setCollection = () => {};


  $: ({
    logos = [],
    filteredLogos = [],
    displayLogos = [],
    theme = "system",
    effectiveTheme = "light",
    viewMode = "grid",
    searchQuery = "",
    collection = "logos",
    allTags = [],
    selectedTags = [],
    selectedBrands = [],
    selectedVariants = [],
    tagDropdownOpen = false,
    compactMode = false,
    setSearchQuery = () => {},
    setGridView = () => {},
    setListView = () => {},
    setCompactView = () => {},
    setTheme = () => {},
    setCollection = () => {},
    toggleDropdown = () => {},
    addTag = () => {},
    removeTag = () => {},
    addBrand = () => {},
    removeBrand = () => {},
    addVariant = () => {},
    removeVariant = () => {},
    toggleTag = () => {},
    getTagObj = () => ({ text: "" }),
    closeDropdown = () => {},
    setCompactMode = () => {},
    onCopy = () => {},
    onDownload = () => {},
  } = appData || {});

  onMount(() => {
    if (typeof window !== 'undefined' && window.appData) {
      logos = window.appData.displayLogos || [];
      allLogos = window.appData.logos || [];
      viewMode = window.appData.viewMode || "grid";
      theme = window.appData.theme || "system";
      collection = window.appData.collection || "logos";
      searchQuery = window.appData.searchQuery || "";
      compactMode = window.appData.compactMode || false;
      tagDropdownOpen = window.appData.tagDropdownOpen || false;
      selectedTags = window.appData.selectedTags || [];
      allTags = window.appData.allTags || [];
      selectedBrands = window.appData.selectedBrands || [];

      if (window.appData.setTheme && typeof window.appData.setTheme === 'function') {
        console.log("Home: Found window.appData.setTheme function");
        setTheme = window.appData.setTheme;
      } else {
        console.warn("Home: window.appData.setTheme not found or not a function");
      }

      if (window.appData.addBrand && typeof window.appData.addBrand === 'function') {
        addBrand = window.appData.addBrand;
      }

      if (window.appData.removeBrand && typeof window.appData.removeBrand === 'function') {
        removeBrand = window.appData.removeBrand;
      }

      if (window.appData.selectedBrands) {
        selectedBrands = window.appData.selectedBrands;
      }

      if (window.appData.addVariant && typeof window.appData.addVariant === 'function') {
        addVariant = window.appData.addVariant;
      }

      if (window.appData.removeVariant && typeof window.appData.removeVariant === 'function') {
        removeVariant = window.appData.removeVariant;
      }

      if (window.appData.selectedVariants) {
        selectedVariants = window.appData.selectedVariants;
      }

      // Set up reactivity with window.appData
      const interval = setInterval(() => {
        if (window.appData) {
          logos = window.appData.displayLogos || logos;
          allLogos = window.appData.logos || allLogos;
          viewMode = window.appData.viewMode || viewMode;
          theme = window.appData.theme || theme;
          searchQuery = window.appData.searchQuery || searchQuery;
          compactMode = window.appData.compactMode || compactMode;

          if (typeof window.appData.tagDropdownOpen === 'boolean') {
            tagDropdownOpen = window.appData.tagDropdownOpen;
          }

          if (window.appData.selectedTags) {
            selectedTags = [...window.appData.selectedTags];
          }

          if (window.appData.allTags) {
            allTags = [...window.appData.allTags];
          }

          if (window.appData.selectedBrands) {
            selectedBrands = [...window.appData.selectedBrands];
          }

          if (window.appData.selectedVariants) {
            selectedVariants = [...window.appData.selectedVariants];
          }
        }
      }, 100);

      return () => clearInterval(interval);
    }
  });

  function setSearchQuery(query) {
    searchQuery = query;
    if (typeof window !== 'undefined' && window.appData && window.appData.setSearchQuery) {
      window.appData.setSearchQuery(query);
    }
  }

  function onCopy(path) {
    if (typeof window !== 'undefined' && window.appData && window.appData.onCopy) {
      window.appData.onCopy(path);
    }
  }

  function onDownload(path, name) {
    if (typeof window !== 'undefined' && window.appData && window.appData.onDownload) {
      window.appData.onDownload(path, name);
    }
  }

  function setGridView() {
    if (typeof window !== 'undefined' && window.appData && window.appData.setGridView) {
      window.appData.setGridView();
    }
  }

  function setListView() {
    if (typeof window !== 'undefined' && window.appData && window.appData.setListView) {
      window.appData.setListView();
    }
  }

  function setCompactView() {
    if (typeof window !== 'undefined' && window.appData && window.appData.setCompactView) {
      window.appData.setCompactView();
    }
  }

  function toggleDropdown() {
    tagDropdownOpen = !tagDropdownOpen;
    console.log("Home: Toggle dropdown to:", tagDropdownOpen);

    if (typeof window !== 'undefined' && window.appData && window.appData.toggleDropdown) {
      window.appData.toggleDropdown();
    }
  }

  function addTag(tag) {
    if (typeof window !== 'undefined' && window.appData && window.appData.addTag) {
      window.appData.addTag(tag);
    }
  }

  function removeTag(tag) {
    if (typeof window !== 'undefined' && window.appData && window.appData.removeTag) {
      window.appData.removeTag(tag);
    }
  }

  function setCompactMode(value) {
    // Update local state first
    compactMode = value;
    console.log("Home: Setting compact mode to:", value);

    if (typeof window !== 'undefined' && window.appData && window.appData.setCompactMode) {
      window.appData.setCompactMode(value);
    }
  }
</script>

<div class="container">
  <Header
    {logos}
    displayLogos={logos}
    {allLogos}
    {theme}
    {setTheme}
    {viewMode}
    {setGridView}
    {setListView}
    {setCompactView}
    {searchQuery}
    {setSearchQuery}
    allTags={allTags}
    selectedTags={selectedTags}
    selectedBrands={selectedBrands}
    selectedVariants={selectedVariants}
    {tagDropdownOpen}
    {toggleDropdown}
    {addTag}
    {removeTag}
    addBrand={addBrand}
    removeBrand={removeBrand}
    addVariant={addVariant}
    removeVariant={removeVariant}
    getTagObj={(tag) => (window.appData?.getTagObj ? window.appData.getTagObj(tag) : {text: tag})}
    {compactMode}
    {setCompactMode}
    {collection}
    {setCollection}
  />

  <main>
    <List
      logos={logos}
      {theme}
      {viewMode}
      {onCopy}
      {onDownload}
      {setSearchQuery}
      {allLogos}
      {addBrand}
      {setTheme}
    />
  </main>

  <Footer />
</div>

<style>
  .container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  main {
    padding: 0 1rem 2rem 1rem;
    max-width: 1400px;
    margin: 0 auto;
    width: 100%;
    flex: 1;
  }
</style>
