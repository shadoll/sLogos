<script>
  import LogoModal from './LogoModal.svelte';
  import LogoActions from './LogoActions.svelte';
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

<LogoModal show={showModal} logo={selectedLogo} on:close={closeModal} />

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
        {#if isSvgLogo(logo)}
          <InlineSvg
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
        {#if isSvgLogo(logo) && logo.colors}
          <div class="color-switcher-under">
            {#each logo.colors as colorObj}
              <span
                class="color-circle"
                title={colorObj.label}
                style="background:{colorObj.value}"
                tabindex="0"
                role="button"
                aria-label={"Set color " + colorObj.label}
                on:click|stopPropagation={() => logo._activeColor = colorObj.value}
                on:keydown|stopPropagation={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    logo._activeColor = colorObj.value;
                    e.preventDefault();
                  }
                }}
              ></span>
            {/each}
          </div>
        {/if}
      </div>
      <div class="logo-actions">
        <LogoActions {logo} {onCopy} {onDownload} />
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
</style>
