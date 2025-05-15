<script>
  import { onMount } from 'svelte';
  import { push, pop } from 'svelte-spa-router';
  import PreviewComponent from '../components/Preview.svelte';
  import Footer from '../components/Footer.svelte';
  import { getDefaultLogoColor } from '../utils/colorTheme.js';

  // Get preview ID from URL parameter
  export let params = {};

  let logo = null;
  let theme = 'light'; // Default theme
  let allLogos = [];
  let showPreview = false;

  // Download handler
  function onDownload(path, name) {
    const a = document.createElement('a');
    a.href = path;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // Go back to previous page
  function goBack() {
    pop();
  }

  // Set theme based on user preference or system
  function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      theme = savedTheme;
    } else {
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    // Apply theme to document
    if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark-theme');
    } else {
      document.documentElement.classList.remove('dark-theme');
    }
  }

  // Find logo by ID in URL
  function findLogoByUrlId(id) {
    if (!id || !allLogos.length) return null;

    const decodedId = decodeURIComponent(id);
    console.log("Preview page: Looking for logo with ID:", decodedId);

    // Try to match by name
    const foundLogo = allLogos.find(logo => {
      const urlFriendlyName = logo.name.replace(/\s+/g, '-').toLowerCase();
      return urlFriendlyName === decodedId;
    });

    console.log("Preview page: Found logo:", foundLogo ? foundLogo.name : "none");
    return foundLogo;
  }

  // Handle close event from Preview component - navigate back to home
  function handleClose() {
    push('/');
  }

  onMount(async () => {
    console.log("Preview page: onMount with params:", params);
    // Initialize theme
    initTheme();

    // Ensure page starts at the top
    window.scrollTo(0, 0);

    // First try to get logos from window.appData if available
    if (window.appData && window.appData.logos && window.appData.logos.length > 0) {
      console.log("Preview page: Using logos from window.appData:", window.appData.logos.length);
      allLogos = window.appData.logos;
    } else {
      // Fetch logos data directly if not available in window.appData
      try {
        console.log("Preview page: Fetching logos data directly");
        const timestamp = new Date().getTime(); // Cache busting
        const response = await fetch(`/data/logos.json?t=${timestamp}`, {
          cache: "no-cache",
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        });
        if (!response.ok) throw new Error('Failed to fetch logos data');

        allLogos = await response.json();
        console.log("Preview page: Loaded", allLogos.length, "logos directly");
      } catch (error) {
        console.error('Preview page: Error loading logos:', error);
      }
    }

    // Find the logo to display based on URL
    if (params.id && allLogos.length > 0) {
      logo = findLogoByUrlId(params.id);

      // Set document title
      if (logo) {
        document.title = `${logo.name} - Logo Gallery`;
        showPreview = true;
        console.log("Preview page: Set up logo for display:", logo.name);
      } else {
        console.error("Preview page: Logo not found for ID:", params.id);
      }
    } else {
      console.log("Preview page: No params.id or no logos loaded:",
        params.id, allLogos.length);
    }

    if (!logo && params.id) {
      console.error("Preview page: Logo not found: " + params.id);
      // Redirect to home if logo not found
      push('/');
    }
  });
</script>

{#if logo}
  <header class="back-button-container">
    <button class="back-button" on:click={goBack}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 12H5M12 19l-7-7 7-7"></path>
      </svg>
      Back to Gallery
    </button>
  </header>

  <main class="preview-content">
    <PreviewComponent
      show={true}
      {logo}
      {theme}
      {onDownload}
      on:close={handleClose}
    />
  </main>

  <Footer />
{:else}
  <div class="loading-container">
    <p>Loading logo...</p>
  </div>
{/if}

<style>
  /* Page level styles applied to body in global.css */

  .back-button-container {
    position: fixed;
    top: 20px;
    left: 20px;
    z-index: 2500;
  }

  .back-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 1rem;
    background: var(--color-card, #fff);
    color: var(--color-text, #222);
    border: 1px solid var(--color-border, #ddd);
    border-radius: 6px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    cursor: pointer;
    transition: all 0.2s;
  }

  .back-button:hover {
    background: var(--color-accent, #4f8cff);
    color: #fff;
  }

  .loading-container {
    width: 100%;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    color: var(--color-text, #222);
  }

  .preview-content {
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
  }

  /* Footer styles now come from the Footer component */
</style>
