<script>
  import InlineSvg from './InlineSvg.svelte';
  import Actions from './Actions.svelte';
  import { getDefaultLogoColor } from '../utils/colorTheme.js';
  import { generateColorSetCircle } from '../utils/colorCircles.js';

  export let logo;
  export let theme;
  export let onCopy;
  export let onDownload;
  export let allLogos = [];
  export let addBrand = () => {};
  export const setTheme = () => {};

  function openPreview(logo) {
    // Navigate to preview page using router
    const routerPath = `/preview/${encodeURIComponent(logo.name.replace(/\s+/g, '-').toLowerCase())}`;
    window.location.hash = routerPath;
  }

  function isSvgLogo(logo) {
    return logo && logo.format && logo.format.toLowerCase() === 'svg';
  }

  $: getLogoThemeColor = (logo) => getDefaultLogoColor(logo.colors, theme);
</script>

<div class="logo-card">
  <div
    class="logo-image"
    role="button"
    tabindex="0"
    aria-label="Preview {logo.name}"
    on:click={() => {
      console.log('CardSquare: Logo clicked, calling openPreview');
      openPreview(logo);
    }}
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
      {#if logo.brand}
        <button
          class="brand-filter-btn"
          title="Filter by brand"
          on:click={() => {
            console.log('CardMiddle: Filtering by brand:', logo.brand);
            addBrand(logo.brand);
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path stroke="currentColor" stroke-linejoin="round" stroke-width="2" d="M20 4H4v2l6 6v8.5l4-2.5v-6l6-6V4z" />
          </svg>
          {#if allLogos && allLogos.filter((l) => l.brand === logo.brand).length > 1}
            <span class="brand-count">{allLogos.filter((l) => l.brand === logo.brand).length}</span>
          {/if}
        </button>
      {/if}
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
            on:click|stopPropagation={() => (logo._activeColor = undefined)}
            on:keydown|stopPropagation={(e) => (e.key === 'Enter' || e.key === ' ') && (logo._activeColor = undefined)}
          >
            <svg width="100%" height="100%" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M400,0c220.766,0 400,179.234 400,400c0,220.766 -179.234,400 -400,400c-220.766,0 -400,-179.234 -400,-400c0,-220.766 179.234,-400 400,-400Zm-251.006,583.082l434.088,-434.088c-51.359,-37.541 -114.652,-59.71 -183.082,-59.71c-171.489,0 -310.716,139.227 -310.716,310.716c0,68.43 22.169,131.723 59.71,183.082Zm502.495,-365.501l-433.908,433.908c51.241,37.248 114.283,59.227 182.419,59.227c171.489,-0 310.716,-139.227 310.716,-310.716c-0,-68.136 -21.979,-131.178 -59.227,-182.419Z"
                fill="#33363f"
              />
            </svg>
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
                on:click|stopPropagation={() => (logo._activeColor = colorValue)}
                on:keydown|stopPropagation={(e) =>
                  (e.key === 'Enter' || e.key === ' ') && (logo._activeColor = colorValue)}
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

<style>
  .logo-card {
    background: var(--color-card);
    color: var(--color-text);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    transition: background 0.2s, color 0.2s, transform 0.2s, box-shadow 0.2s;
  }

  .logo-image {
    height: 260px;
    width: 100%;
    padding: 1rem;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .logo-info {
    padding: 1rem;
    border-top: 1px solid var(--color-border);
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
  }

  /* Format row styling */
  .format-row {
    display: flex;
    align-items: center;
    gap: 1em;
    margin-bottom: 0.5em;
    justify-content: space-between;
  }

  h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.2rem;
    line-height: 1.2;
  }
</style>
