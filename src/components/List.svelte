<script>
  import Preview from './Preview.svelte';
  import Actions from './Actions.svelte';
  import InlineSvg from './InlineSvg.svelte';
  import { getThemeColor, getDefaultLogoColor } from '../utils/colorTheme.js';
  import { onMount, onDestroy } from 'svelte';

  export let logos = [];
  export let onCopy;
  export let onDownload;

  let showModal = false;
  let selectedLogo = null;

  let theme = getTheme();

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

  function getTheme() {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  }

  function handleThemeChange(e) {
    theme = e.matches ? 'dark' : 'light';
  }

  onMount(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    mql.addEventListener('change', handleThemeChange);
  });

  onDestroy(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    mql.removeEventListener('change', handleThemeChange);
  });

  $: getLogoThemeColor = logo => getDefaultLogoColor(logo.colors, theme);

  // Debug logging for color and theme
  $: {
    if (logos && logos.length) {
      logos.forEach(logo => {
        if (logo.colors) {
          const themeColor = getDefaultLogoColor(logo.colors, theme);
          const activeColor = logo._activeColor || themeColor;
          console.log('[LogoList] Logo:', logo.name, '| Theme:', theme, '| Theme color:', themeColor, '| Active color:', activeColor);
        }
      });
    }
  }
</script>

<Preview show={showModal} logo={selectedLogo} on:close={closeModal} />

<div class="logo-list">
  {#each logos as logo}
    <div class="logo-item">
      <div class="logo-preview"
        role="button"
        tabindex="0"
        aria-label="Preview {logo.name}"
        on:click={() => openPreview(logo)}
        on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && openPreview(logo)}
        style="cursor:pointer;"
      >
        {#if isSvgLogo(logo)}              <InlineSvg
                path={logo.path}
                color={logo.colors ? (logo._activeColor || getLogoThemeColor(logo)) : undefined}
                colorConfig={logo.colors ? logo.colorConfig : undefined}
                alt={logo.name}
              />
        {:else}
          <img src={logo.path} alt={logo.name} />
        {/if}
      </div>
      <div class="logo-info">
        <h3>{logo.name}</h3>
        <div class="format-row">
          <span><strong>Format:</strong> {logo.format}</span>
        </div>
        {#if logo.colors}
          <div class="color-switcher-preview align-left">
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
                style={`background:${colorObj.value}`}
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
  {:else}
    <p class="no-results">No logos found matching your search criteria.</p>
  {/each}
</div>

<style>
  :global(.logo-item) {
    background: var(--color-card);
    color: var(--color-text);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    display: grid;
    grid-template-columns: 80px 2fr 3fr 150px;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    transition: background 0.2s, color 0.2s;
  }
  .logo-preview {
    height: 100px;
    width: 80px;
    padding: 0;
    border-radius: 4px;
    position: relative;
  }
  .logo-info h3 {
    margin-bottom: 0.5rem;
    color: var(--color-accent, #4f8cff);
  }
  .logo-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .no-results {
    text-align: center;
    padding: 2rem;
    color: #666;
  }
  .color-circle {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-right: 4px;
    cursor: pointer;
    box-sizing: border-box;
  }
  .color-switcher-preview.align-left {
    justify-content: flex-start;
  }
  .color-circle.color-reset {
    background: none !important;
  }
</style>
