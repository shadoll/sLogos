<script>
  import { onMount } from 'svelte';
  import PreviewComponent from '../components/Preview.svelte';
  import Footer from '../components/Footer.svelte';
  import { push } from 'svelte-spa-router';

  // Get logo name from URL parameter
  export let params = {};

  let logo = null;
  let theme = "system";
  let logos = [];
  let setTheme = () => {}; // Default no-op function

  onMount(() => {
    if (typeof window !== 'undefined' && window.appData) {
      logos = window.appData.logos || [];
      theme = window.appData.theme || "system";

      // Check if setTheme exists in window.appData
      if (window.appData.setTheme && typeof window.appData.setTheme === 'function') {
        console.log("PreviewPage: Found window.appData.setTheme function");
        setTheme = window.appData.setTheme;
      } else {
        console.warn("PreviewPage: window.appData.setTheme not found or not a function");
      }

      // Find the logo based on the URL parameter
      const logoName = params.logoName.replace(/-/g, ' ');
      logo = logos.find(l =>
        l.name.toLowerCase().replace(/\s+/g, '-') === params.logoName.toLowerCase() ||
        l.name.toLowerCase() === logoName.toLowerCase()
      );

      if (!logo) {
        console.error("Logo not found:", params.logoName);
        push('/', { replace: true });
      }
    }

    // Back button event listener
    const handlePopState = () => {
      const hash = window.location.hash;
      if (!hash.includes('/preview/')) {
        push('/', { replace: true });
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  });

  function onDownload(path, name) {
    if (typeof window !== 'undefined' && window.appData && window.appData.onDownload) {
      window.appData.onDownload(path, name);
    }
  }
</script>

<div class="preview-route">
  <div class="back-button-container">
    <button class="back-button" on:click={() => push('/', { replace: true })}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 12H5m0 0l7 7m-7-7l7-7"/>
      </svg>
      Back to Gallery
    </button>
  </div>

  <div class="preview-container">
    <PreviewComponent logo={logo} {theme} {onDownload} show={true} {setTheme} />
  </div>

  <Footer />
</div>

<style>
  .preview-route {
    width: 100%;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .preview-container {
    flex: 1;
  }

  .back-button-container {
    padding: 1rem 2rem;
    background: var(--color-card);
    position: sticky;
    top: 0;
    z-index: 5;
  }

  .back-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: var(--color-accent);
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.2s;
    font-weight: 500;
  }

  .back-button:hover {
    background: var(--color-accent-hover);
  }
</style>
