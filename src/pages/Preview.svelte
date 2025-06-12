<script>
  import { onMount } from 'svelte';
  import CardFull from '../components/CardFull.svelte';
  import Footer from '../components/Footer.svelte';
  import { push } from 'svelte-spa-router';

  // Get logo name from URL parameter
  export let params = {};

  let logo = null;
  let theme = "system";
  let logos = [];
  let setTheme = () => {}; // Default no-op function

  onMount(() => {
    function tryFindLogo() {
      if (typeof window !== 'undefined' && window.appData && Array.isArray(window.appData.logos) && window.appData.logos.length > 0) {
        logos = window.appData.logos || [];
        theme = window.appData.theme || "system";
        if (window.appData.setTheme && typeof window.appData.setTheme === 'function') {
          setTheme = window.appData.setTheme;
        }
        const logoName = params.logoName.replace(/-/g, ' ');
        logo = logos.find(l =>
          l.name.toLowerCase().replace(/\s+/g, '-') === params.logoName.toLowerCase() ||
          l.name.toLowerCase() === logoName.toLowerCase()
        );
        if (!logo) {
          console.error("Logo not found:", params.logoName);
          push('/', { replace: true });
        }
        return true;
      }
      return false;
    }

    if (!tryFindLogo()) {
      // Poll until logos are loaded
      const interval = setInterval(() => {
        if (tryFindLogo()) {
          clearInterval(interval);
        }
      }, 100);
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
    <CardFull logo={logo} {theme} {onDownload} show={true} {setTheme} />
  </div>

  <Footer />
</div>

<style>
  .preview-route {
    width: 100%;
    height: 100vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .preview-container {
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  .back-button-container {
    padding: 1rem 2rem;
    background: var(--color-card);
    flex-shrink: 0;
    border-bottom: 1px solid var(--color-border);
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

  @media (max-width: 900px) {
    .preview-route {
      height: auto;
      min-height: 100vh;
      overflow: visible;
    }

    .preview-container {
      overflow: visible;
      min-height: auto;
    }
  }
</style>
