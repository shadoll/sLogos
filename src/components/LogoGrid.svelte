<script>
  import LogoModal from './LogoModal.svelte';
  import LogoActions from './LogoActions.svelte';
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

<LogoModal show={showModal} logo={selectedLogo} theme={theme} on:close={closeModal} />

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
          {#if isSvgLogo(logo) && logo.colors}
            <span class="color-switcher-inline">
              {#each logo.colors as colorObj}
                <span
                  class="color-circle"
                  title={colorObj.label}
                  style="background:{colorObj.value}"
                  tabindex="0"
                  role="button"
                  aria-label={"Switch color to " + colorObj.label}
                  on:click|stopPropagation={() => logo._activeColor = colorObj.value}
                  on:keydown|stopPropagation={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      logo._activeColor = colorObj.value;
                      e.preventDefault();
                    }
                  }}
                ></span>
              {/each}
            </span>
          {/if}
        </div>
        <div class="logo-actions">
          <LogoActions {logo} {onCopy} {onDownload} />
        </div>
      </div>
    </div>
  {:else}
    <p class="no-results">No logos found matching your search criteria.</p>
  {/each}
</div>

<style>
  :global(.logo-card) {
    background: var(--color-card);
    color: var(--color-text);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    /* overflow: hidden; removed to allow dropdown menus to escape the card */
    transition: background 0.2s, color 0.2s, transform 0.2s, box-shadow 0.2s;
    min-width: 320px;
  }
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
    background: var(--color-card);
    color: var(--color-text);
    border-top: 1px solid var(--color-border);
    transition: background 0.2s, color 0.2s;
  }
  .logo-info h3 {
    margin-bottom: 0.5rem;
    color: var(--color-accent, #4f8cff);
  }
  .no-results {
    grid-column: 1 / -1;
    text-align: center;
    padding: 2rem;
    color: #666;
  }
</style>
