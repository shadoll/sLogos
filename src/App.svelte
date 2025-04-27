<script>
  import { onMount } from 'svelte';
  import LogoGrid from './components/LogoGrid.svelte';
  import LogoList from './components/LogoList.svelte';

  let viewMode = 'grid'; // 'grid' or 'list'
  let searchQuery = '';
  let logos = [];
  let filteredLogos = [];

  // Load logos from JSON file with cache busting
  onMount(async () => {
    try {
      // Add timestamp as cache-busting query parameter
      const timestamp = new Date().getTime();
      const response = await fetch(`data/logos.json?t=${timestamp}`, {
        // Force reload from server, don't use cache
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (response.ok) {
        logos = await response.json();
        filteredLogos = logos;
        console.log('Loaded logos:', logos.length, 'at', new Date().toLocaleTimeString());
      } else {
        console.error('Failed to load logos data', response.status);
      }
    } catch (error) {
      console.error('Error loading logos:', error);
    }
  });

  $: {
    filteredLogos = logos.filter(logo =>
      logo.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  function setGridView() {
    console.log('Setting view mode to: grid');
    viewMode = 'grid';
  }

  function setListView() {
    console.log('Setting view mode to: list');
    viewMode = 'list';
  }

  function copyUrl(logoPath) {
    const url = `${window.location.origin}/${logoPath}`;
    navigator.clipboard.writeText(url)
      .then(() => {
        alert('URL copied to clipboard!');
      })
      .catch(err => {
        console.error('Failed to copy URL: ', err);
      });
  }

  function downloadLogo(logoPath, logoName) {
    const link = document.createElement('a');
    link.href = logoPath;
    link.download = logoName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
</script>

<main class="container">
  <header>
    <h1>Logo Gallery</h1>
    <p>Collection of company and brand logos for your projects</p>

    <div class="search-bar">
      <input
        type="text"
        placeholder="Search logos..."
        bind:value={searchQuery}
      />
    </div>

    <div class="view-toggle">
      <button
        class:active={viewMode === 'grid'}
        on:click={setGridView}
      >
        Grid View
      </button>
      <button
        class:active={viewMode === 'list'}
        on:click={setListView}
      >
        List View
      </button>
    </div>

    <!-- Debug info to show current view mode -->
    <div style="margin-bottom: 10px; font-size: 0.8rem; color: #666;">
      Current view: {viewMode}
    </div>
  </header>

  <div class="logos-container">
    {#if viewMode === 'grid'}
      <LogoGrid
        logos={filteredLogos}
        onCopy={copyUrl}
        onDownload={downloadLogo}
      />
    {:else}
      <LogoList
        logos={filteredLogos}
        onCopy={copyUrl}
        onDownload={downloadLogo}
      />
    {/if}
  </div>

  <footer>
    <p>© {new Date().getFullYear()} Logo Gallery. All logos are property of their respective owners.</p>
  </footer>
</main>

<style>
  header {
    margin-bottom: 2rem;
  }

  h1 {
    color: var(--secondary-color);
    margin-bottom: 0.5rem;
  }

  p {
    margin-bottom: 1.5rem;
  }

  footer {
    margin-top: 3rem;
    text-align: center;
    font-size: 0.9rem;
    color: #666;
  }

  .view-toggle {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .view-toggle button {
    padding: 0.5rem 1rem;
    background-color: #e0e0e0;
    color: var(--text-color);
    border: none;
    border-radius: 4px;
    font-size: 0.9rem;
    transition: all 0.2s;
  }

  .active {
    background-color: var(--secondary-color) !important;
    color: white !important;
    font-weight: bold;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    transform: translateY(-2px);
  }

  .search-bar {
    margin-bottom: 1.5rem;
    width: 100%;
    max-width: 500px;
  }

  .search-bar input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
  }

  .logos-container {
    width: 100%;
  }
</style>
