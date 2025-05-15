<script>
  import CardSquare from './CardMiddle.svelte';

  export let logos = [];
  export let onCopy;
  export let onDownload;
  export let setSearchQuery;
  export let allLogos = [];

  export let theme;
</script>

<div class="logo-grid">
  {#each logos as logo}
    <CardSquare
      {logo}
      {theme}
      {onCopy}
      {onDownload}
      {setSearchQuery}
      {allLogos}
    />
  {:else}
    <p class="no-results">No logos found matching your search criteria.</p>
  {/each}
</div>

<style>
  .logo-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1.5rem;
  }

  .no-results {
    grid-column: 1 / -1;
    text-align: center;
    padding: 2rem;
    color: #666;
  }
</style>
