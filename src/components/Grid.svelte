<script>
  import Preview from './Preview.svelte';
  import Actions from './Actions.svelte';
  import InlineSvg from './InlineSvg.svelte';
  import { onMount, onDestroy } from 'svelte';
  import { getDefaultLogoColor, getThemeColor } from '../utils/colorTheme.js';

  export let logos = [];
  export let onCopy;
  export let onDownload;
  export let setSearchQuery;

  let showModal = false;
  let selectedLogo = null;

  function openPreview(logo) {
    selectedLogo = logo;
    showModal = true;
  }

  function closeModal() {
    showModal = false;
  }

  function isSvgLogo(logo) {
    return logo.format && logo.format.toLowerCase() === 'svg';
  }

  export let theme;
$: getLogoThemeColor = logo => getDefaultLogoColor(logo.colors, theme);

  $: {
    if (logos && logos.length) {
      logos.forEach(logo => {
        if (logo.colors) {
          const themeColor = getDefaultLogoColor(logo.colors, theme);
          const fallbackColor = getThemeColor(logo.colors, theme);
          const activeColor = logo._activeColor || themeColor;
        }
      });
    }
  }
</script>

<Preview show={showModal} logo={selectedLogo} theme={theme} on:close={closeModal} />

<div class="logo-grid">
  {#each logos as logo}
    <div class="logo-card">
      <div class="logo-image"
        role="button"
        tabindex="0"
        aria-label="Preview {logo.name}"
        on:click={() => openPreview(logo)}
        on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && openPreview(logo)}
        style="cursor:pointer;"
      >
        {#if isSvgLogo(logo)}
          {#key theme + (logo._activeColor || '')}
            <InlineSvg
              path={logo.path}
              color={logo.colors ? (logo._activeColor || getLogoThemeColor(logo)) : undefined}
              colorConfig={logo.colors ? logo.colorConfig : undefined}
              alt={logo.name}
            />
          {/key}
        {:else}
          <img src={logo.path} alt={logo.name} />
        {/if}
      </div>
      <div class="logo-info">
        <div class="logo-title-row">
          <h3>{logo.name}</h3>
          <button class="brand-filter-btn" title="Filter by brand" on:click={() => setSearchQuery(logo.brand)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path stroke="currentColor" stroke-linejoin="round" stroke-width="2" d="M20 4H4v2l6 6v8.5l4-2.5v-6l6-6V4z"/></svg>
          </button>
        </div>
        <div class="format-row">
          <span><strong>Format:</strong> {logo.format}</span>
          {#if logo.colors}
            <div class="color-switcher-preview align-right">
              <span
                class="color-circle color-reset"
                title="Reset to theme color"
                tabindex="0"
                role="button"
                aria-label="Reset to theme color"
                style="background: none; width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; padding: 0; margin: 0; border: none;"
                on:click|stopPropagation={() => logo._activeColor = undefined}
                on:keydown|stopPropagation={(e) => (e.key === 'Enter' || e.key === ' ') && (logo._activeColor = undefined)}
              >
                <svg width="100%" height="100%" viewBox="0 0 800 800" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">
                  <circle cx="400" cy="400" r="400" style="fill:#d6d6d6;"/>
                  <path d="M682.843,117.843l-565.686,565.685c-156.209,-156.21 -156.209,-409.476 0,-565.685c156.21,-156.21 409.476,-156.21 565.686,-0Z" style="fill:#33363f;"/>
                </svg>
              </span>
              {#each logo.colors as colorObj}
                <span
                  class="color-circle"
                  title={colorObj.label}
                  style="background:{colorObj.value}"
                  tabindex="0"
                  role="button"
                  on:click|stopPropagation={() => logo._activeColor = colorObj.value}
                  on:keydown|stopPropagation={(e) => (e.key === 'Enter' || e.key === ' ') && (logo._activeColor = colorObj.value)}
                ></span>
              {/each}
            </div>
          {/if}
        </div>
        <div class="logo-actions">
          <Actions {logo} {onCopy} {onDownload} />
        </div>
      </div>
    </div>
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
  .logo-image {
    height: 260px;
    width: 100%;
    padding: 1rem;
    position: relative;
  }
  .logo-info {
    padding: 1rem;
    border-top: 1px solid var(--color-border);
  }

  .no-results {
    grid-column: 1 / -1;
    text-align: center;
    padding: 2rem;
    color: #666;
  }

  .color-switcher-preview.align-right {
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }

  .logo-title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5em;
  }

  .brand-filter-btn {
    background: none;
    border: none;
    color: var(--color-text);
    cursor: pointer;
    padding: 0.2em;
    border-radius: 4px;
    transition: background 0.2s, color 0.2s;
    z-index: 2;
    margin-left: 0.5em;
  }
  .brand-filter-btn:hover {
    background: var(--color-accent, #4f8cff);
    color: #fff;
  }
</style>
