<script>
  import { onMount } from 'svelte';
  import LogoGrid from './components/LogoGrid.svelte';
  import LogoList from './components/LogoList.svelte';

  let viewMode = 'grid'; // 'grid' or 'list'
  let searchQuery = '';
  let logos = [];
  let filteredLogos = [];
  let theme = 'system';
  let mq;

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

    const stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      theme = stored;
    }
    applyTheme();

    // Listen for system theme changes if using system
    mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', () => {
      if (theme === 'system') applyTheme();
    });
  });

  $: {
    console.log('[theme] reactive theme:', theme);
    applyTheme();
  }

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

  function applyTheme() {
    let effectiveTheme = theme;
    if (theme === 'system') {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', effectiveTheme);
    console.log('[theme] theme:', theme, 'effectiveTheme:', effectiveTheme);
  }

  function setTheme(newTheme) {
    theme = newTheme;
    localStorage.setItem('theme', newTheme);
    console.log('[theme] setTheme:', newTheme);
    applyTheme();
  }
</script>

<main class="container">
  <header class="main-header">
    <div class="header-row">
      <h1>Logo Gallery</h1>
      <div class="theme-switcher">
        <button on:click={() => setTheme('system')} class:active={theme === 'system'} aria-label="System theme">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="2"/><path d="M10 2a8 8 0 0 1 8 8" stroke="currentColor" stroke-width="2"/></svg>
        </button>
        <button on:click={() => setTheme('light')} class:active={theme === 'light'} aria-label="Light mode">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="5" stroke="currentColor" stroke-width="2"/><path d="M10 1v2M10 17v2M3.22 3.22l1.42 1.42M15.36 15.36l1.42 1.42M1 10h2M17 10h2M3.22 16.78l1.42-1.42M15.36 4.64l1.42-1.42" stroke="currentColor" stroke-width="2"/></svg>
        </button>
        <button on:click={() => setTheme('dark')} class:active={theme === 'dark'} aria-label="Dark mode">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15.5 13A7 7 0 0 1 7 4.5a7 7 0 1 0 8.5 8.5z" stroke="currentColor" stroke-width="2"/></svg>
        </button>
      </div>
    </div>
    <div class="header-row header-controls">
      <div class="search-bar">
        <input type="text" placeholder="Search logos..." bind:value={searchQuery} />
      </div>
      <div class="view-toggle">
        <button class:active={viewMode === 'grid'} on:click={setGridView} aria-label="Grid view">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="6" height="6" fill="currentColor"/><rect x="11" y="3" width="6" height="6" fill="currentColor"/><rect x="3" y="11" width="6" height="6" fill="currentColor"/><rect x="11" y="11" width="6" height="6" fill="currentColor"/></svg>
        </button>
        <button class:active={viewMode === 'list'} on:click={setListView} aria-label="List view">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="5" width="12" height="2" fill="currentColor"/><rect x="4" y="9" width="12" height="2" fill="currentColor"/><rect x="4" y="13" width="12" height="2" fill="currentColor"/></svg>
        </button>
      </div>
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
    <p>shadoll Logo Gallery. All logos are property of their respective owners.</p>
  </footer>
</main>

<style>
  :global(:root) {
    --color-bg: #fff;
    --color-text: #222;
    --color-card: #f8f8f8;
    --color-border: #ddd;
    --color-accent: #4f8cff;
  }
  :global([data-theme='dark']) {
    --color-bg: #181a1b;
    --color-text: #f3f3f3;
    --color-card: #23272a;
    --color-border: #333;
    --color-accent: #7da6ff;
  }
  :global(html), :global(body) {
    background: var(--color-bg);
    color: var(--color-text);
  }

  .main-header {
    margin-bottom: 1.5rem;
    background: var(--color-card);
    color: var(--color-text);
    border-radius: 8px;
    padding: 1.2rem 1rem 0.7rem 1rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  }

  .header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.5rem;
  }

  .header-controls {
    margin-top: 0.5rem;
  }

  h1 {
    color: var(--color-accent);
    margin-bottom: 0;
    font-size: 1.3rem;
    font-weight: 700;
  }

  .search-bar {
    margin-bottom: 0;
    width: 100%;
    max-width: 350px;
  }

  .search-bar input {
    width: 100%;
    padding: 0.5rem 0.8rem;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    font-size: 1rem;
    background: var(--color-card);
    color: var(--color-text);
    transition: background 0.2s, color 0.2s;
  }

  .search-bar input::placeholder {
    color: #888;
    opacity: 1;
  }

  .view-toggle {
    display: flex;
    gap: 0.2rem;
  }

  .view-toggle button {
    padding: 0.3rem 0.5rem;
    background: var(--color-card);
    color: var(--color-text);
    border: 1px solid var(--color-border);
    border-radius: 4px;
    font-size: 1rem;
    transition: background 0.2s, color 0.2s;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .view-toggle button.active,
  .view-toggle button:focus {
    background: var(--color-accent);
    color: #fff;
    font-weight: bold;
    outline: 2px solid var(--color-border);
  }

  .theme-switcher {
    display: flex;
    align-items: center;
    gap: 0.2rem;
    margin-left: auto;
  }

  .theme-switcher button {
    background: none;
    border: 1px solid var(--color-border);
    color: var(--color-text);
    padding: 0.2em 0.5em;
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.2s, color 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .theme-switcher button.active,
  .theme-switcher button:focus {
    background: var(--color-accent);
    color: #fff;
    font-weight: bold;
    outline: 2px solid var(--color-border);
  }

  @media (max-width: 700px) {
    .header-row {
      flex-direction: column;
      align-items: stretch;
      gap: 0.5rem;
    }

    .main-header {
      padding: 1rem 0.5rem 0.5rem 0.5rem;
    }

    h1 {
      font-size: 1.1rem;
    }
  }

  .logos-container {
    width: 100%;
  }

  .logo-card, .logo-item {
    background: var(--color-card);
    color: var(--color-text);
    border: 1px solid var(--color-border);
    transition: background 0.2s, color 0.2s;
  }

  :global(.logo-card), :global(.logo-item) {
    background: var(--color-card);
    color: var(--color-text);
    border: 1px solid var(--color-border);
    transition: background 0.2s, color 0.2s;
  }

  footer {
    margin-top: 3rem;
    text-align: center;
    font-size: 0.9rem;
    color: #888;
    background: transparent;
  }
</style>
