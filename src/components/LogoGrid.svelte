<script>
  import LogoModal from './LogoModal.svelte';
  import LogoActions from './LogoActions.svelte';
  import InlineSvg from './InlineSvg.svelte';
  import { onMount } from 'svelte';

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

<LogoModal show={showModal} logo={selectedLogo} on:close={closeModal} />

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
        {#if isSvgLogo(logo) && logo.colors}
          <InlineSvg path={logo.path} color={logo._activeColor || logo.colors[0].value} colorConfig={logo.colorConfig} alt={logo.name} />
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
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    background: var(--color-card);
    color: var(--color-text);
    position: relative;
    overflow: hidden;
    cursor: pointer;
    transition: background 0.2s, color 0.2s;
  }
  .logo-image img,
.logo-image :global(svg) {
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  object-position: center;
  display: block;
  margin: 0 auto;
}
  /* Make inline SVGs scale and fit like <img> */
  .logo-image svg {
    max-width: 80%;
    max-height: 80%;
    width: auto !important;
    height: auto !important;
    object-fit: contain;
    object-position: center;
    display: block;
    margin: 0 auto;
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
  /* .logo-info p { font-size: 0.9rem; color: var(--color-text); margin-bottom: 1rem; } */
  .logo-actions {
    display: flex;
    align-items: center;
    gap: 0.5em;
    flex-wrap: nowrap;
  }
  .format-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1em;
    margin-bottom: 0.5em;
  }
  .color-switcher-inline {
    display: flex;
    gap: 0.4em;
    align-items: center;
    margin-left: auto;
  }
  .color-switcher {
    display: flex;
    gap: 0.4em;
    margin: 0.5em 0 0.5em 0;
    align-items: center;
  }
  .color-circle {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 2px solid #eee;
    box-shadow: 0 1px 2px rgba(0,0,0,0.08);
    cursor: pointer;
    display: inline-block;
    transition: border 0.2s, box-shadow 0.2s;
  }
  .color-circle:hover {
    border: 2px solid #888;
    box-shadow: 0 2px 8px rgba(0,0,0,0.12);
  }
  .no-results {
    grid-column: 1 / -1;
    text-align: center;
    padding: 2rem;
    color: #666;
  }

  .color-switcher {
    display: flex;
    gap: 0.4em;
    margin: 0.5em 0 0.5em 0;
    align-items: center;
  }
  .color-circle {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 2px solid #eee;
    box-shadow: 0 1px 2px rgba(0,0,0,0.08);
    cursor: pointer;
    display: inline-block;
    transition: border 0.2s, box-shadow 0.2s;
  }
  .color-circle:hover {
    border: 2px solid #888;
    box-shadow: 0 2px 8px rgba(0,0,0,0.12);
  }
</style>
