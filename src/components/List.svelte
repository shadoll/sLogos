<script>
  import CardSmall from './CardSmall.svelte';
  import CardMiddle from './CardMiddle.svelte';
  import { getDefaultLogoColor } from '../utils/colorTheme.js';

  export let logos = [];
  export let onCopy;
  export let onDownload;
  export let setSearchQuery;
  export let allLogos = [];
  export let theme;
  export let viewMode = "grid";
  export let setTheme = () => {};

  $: getLogoThemeColor = logo => getDefaultLogoColor(logo.colors, theme);
</script>

<div class={`logos-container ${viewMode}-view`}>
  {#each logos as logo}
    {#if viewMode === "grid"}
      <CardMiddle
        {logo}
        {theme}
        {onCopy}
        {onDownload}
        {setSearchQuery}
        {allLogos}
        {setTheme}
      />
    {:else}
      <CardSmall
        {logo}
        {theme}
        {onCopy}
        {onDownload}
        {setSearchQuery}
        {allLogos}
        {setTheme}
      />
    {/if}
  {:else}
    <p class="no-results">No logos found matching your search criteria.</p>
  {/each}
</div>

<style>
  .logos-container {
    width: 100%;
  }

  .grid-view {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1.5rem;
  }

  .list-view {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
    gap: 0.75rem;
  }

  .no-results {
    text-align: center;
    padding: 2rem;
    color: #666;
    grid-column: 1 / -1; /* For grid view */
  }
</style>
