<script>
  import Preview from './Preview.svelte';
  import Actions from './Actions.svelte';
  import InlineSvg from './InlineSvg.svelte';
  import { onMount, onDestroy } from 'svelte';
  import { getDefaultLogoColor, getThemeColor } from '../utils/colorTheme.js';

  export let logos = [];
  export let onCopy;
  export let onDownload;

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

  // Improved debug logging for color and theme for each logo
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

  // Inline SVG logic for color switching
  let svgCache = {};

  async function fetchInlineSvg(path) {
    if (svgCache[path]) return svgCache[path];
    const res = await fetch(path);
    const text = await res.text();
    svgCache[path] = text;
    return text;
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
        <h3>{logo.name}</h3>
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
</style>
