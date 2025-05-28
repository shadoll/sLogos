<script>
  import { onMount } from 'svelte';
  import Header from '../components/Header.svelte';
  import List from '../components/List.svelte';
  import Footer from '../components/Footer.svelte';
  import { push } from 'svelte-spa-router';

  let logos = [];
  let allLogos = [];
  let viewMode = "grid";
  let theme = "system";
  let searchQuery = "";
  let compactMode = false;
  let tagDropdownOpen = false;
  let selectedTags = [];
  let allTags = [];
  let setTheme = () => {};

  onMount(() => {
    if (typeof window !== 'undefined' && window.appData) {
      logos = window.appData.displayLogos || [];
      allLogos = window.appData.logos || [];
      viewMode = window.appData.viewMode || "grid";
      theme = window.appData.theme || "system";
      searchQuery = window.appData.searchQuery || "";
      compactMode = window.appData.compactMode || false;
      tagDropdownOpen = window.appData.tagDropdownOpen || false;
      selectedTags = window.appData.selectedTags || [];
      allTags = window.appData.allTags || [];

      if (window.appData.setTheme && typeof window.appData.setTheme === 'function') {
        console.log("Home: Found window.appData.setTheme function");
        setTheme = window.appData.setTheme;
      } else {
        console.warn("Home: window.appData.setTheme not found or not a function");
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
    {searchQuery}
    {setSearchQuery}
    {viewMode}
    {theme}
    {setTheme}
    {setGridView}
    {setListView}
    {setCompactView}
    logos={allLogos}
    displayLogos={logos}
    {toggleDropdown}
    {addTag}
    {removeTag}
    allTags={allTags}
    selectedTags={selectedTags}
    tagDropdownOpen={tagDropdownOpen}
    {compactMode}
    {setCompactMode}
    getTagObj={(tag) => (window.appData?.getTagObj ? window.appData.getTagObj(tag) : {text: tag})}
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
      {setTheme}
    />
  </main>

  <Footer />
</div>

<style>
  main {
    padding: 0 1rem 2rem 1rem;
    max-width: 1400px;
    margin: 0 auto;
    width: 100%;
  }
</style>
