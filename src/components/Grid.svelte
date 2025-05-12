<script>
  import Preview from './Preview.svelte';
  import Actions from './Actions.svelte';
  import InlineSvg from './InlineSvg.svelte';
  import { onMount, onDestroy } from 'svelte';
  import { getDefaultLogoColor, getThemeColor } from '../utils/colorTheme.js';
  import { generateColorSetCircle } from "../utils/colorCircles.js";

  export let logos = [];
  export let onCopy;
  export let onDownload;
  export let setSearchQuery;
  export let allLogos = [];

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
              targets={logo.targets}
              sets={logo.sets}
              colors={logo.colors}
              activeSet={logo._activeSet}
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
          <button class="brand-filter-btn" title="Filter by brand" on:click={() => {
            setSearchQuery(logo.brand);
            // Update URL with search param
            const params = new URLSearchParams(window.location.search);
            params.set('search', logo.brand);
            const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
            history.replaceState(null, '', newUrl);
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path stroke="currentColor" stroke-linejoin="round" stroke-width="2" d="M20 4H4v2l6 6v8.5l4-2.5v-6l6-6V4z"/></svg>
            {#if allLogos && allLogos.filter(l => l.brand === logo.brand).length > 1}
              <span class="brand-count">{allLogos.filter(l => l.brand === logo.brand).length}</span>
            {/if}
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
                <svg width="100%" height="100%" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg"><path d="M400,0c220.766,0 400,179.234 400,400c0,220.766 -179.234,400 -400,400c-220.766,0 -400,-179.234 -400,-400c0,-220.766 179.234,-400 400,-400Zm-251.006,583.082l434.088,-434.088c-51.359,-37.541 -114.652,-59.71 -183.082,-59.71c-171.489,0 -310.716,139.227 -310.716,310.716c0,68.43 22.169,131.723 59.71,183.082Zm502.495,-365.501l-433.908,433.908c51.241,37.248 114.283,59.227 182.419,59.227c171.489,-0 310.716,-139.227 310.716,-310.716c-0,-68.136 -21.979,-131.178 -59.227,-182.419Z" fill="#33363f"/></svg>
              </span>
              {#if logo.sets}
                {#each Object.entries(logo.sets) as [setName, setConfig], i}
                  <span
                    class="color-circle set-circle"
                    title={`Color Set ${i + 1}: ${setName}`}
                    tabindex="0"
                    role="button"
                    on:click|stopPropagation={() => {
                      logo._activeColor = Object.values(logo.colors)[i % Object.keys(logo.colors).length];
                      logo._activeSet = setName;
                    }}
                    on:keydown|stopPropagation={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        logo._activeColor = Object.values(logo.colors)[i % Object.keys(logo.colors).length];
                        logo._activeSet = setName;
                      }
                    }}
                    style="padding: 0; overflow: hidden;"
                  >
                    {@html generateColorSetCircle(logo.colors, setConfig)}
                  </span>
                {/each}
              {:else}
                {#each Object.entries(logo.colors) as [colorName, colorValue], i}
                  <span
                    class="color-circle"
                    title={colorName.replace('_', ' ')}
                    style="background:{colorValue}"
                    tabindex="0"
                    role="button"
                    on:click|stopPropagation={() => logo._activeColor = colorValue}
                    on:keydown|stopPropagation={(e) => (e.key === 'Enter' || e.key === ' ') && (logo._activeColor = colorValue)}
                  ></span>
                {/each}
              {/if}
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
    padding: 0.3em 0.8em 0.1em 0.3em;
    border-radius: 4px;
    transition: background 0.2s, color 0.2s;
    z-index: 2;
    margin-left: 0.5em;
    position: relative;
  }
  .brand-filter-btn:hover {
    background: var(--color-accent, #4f8cff);
    color: #fff;
  }

  .brand-count {
    font-size: 0.85em;
    position: absolute;
    bottom: 0;
  }  .set-circle {
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    padding: 0;
  }
</style>
