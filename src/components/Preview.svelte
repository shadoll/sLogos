<script>
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import InlineSvg from './InlineSvg.svelte';
  import { getDefaultLogoColor } from '../utils/colorTheme.js';
  import tagsData from '../../public/data/tags.json';
  console.log('Loaded tagsData:', tagsData);

  export let show = false;
  export let logo = null;

  const dispatch = createEventDispatcher();

  function close() {
    dispatch('close');
  }

  function handleKeydown(event) {
    if (event.key === 'Escape') {
      close();
    }
  }

  function isSvgLogo(logo) {
    return logo && logo.format && logo.format.toLowerCase() === 'svg';
  }

  // Helper to get tag object from tags.json by text
  function getTagObj(text) {
    const tag = tagsData && typeof tagsData === 'object' && tagsData[text] ? { text, ...tagsData[text] } : { text };
    console.log('[LogoModal] Tag lookup:', text, tag, tagsData);
    return tag;
  }

  // Always use $theme directly, do not cache in a function
  export let theme;
$: getLogoThemeColor = logo => getDefaultLogoColor(logo.colors, theme);

  $: {
    if (logo && logo.colors) {
      const themeColor = getDefaultLogoColor(logo.colors, theme);
      const activeColor = logo._activeColor || themeColor;
    }
  }

  $: if (logo && logo.tags && logo.tags.length) {
    logo.tags.forEach(tag => {
      console.log('[LogoModal] Tag:', tag);
      getTagObj(tag);
    });
  }

  onMount(() => {
    document.addEventListener('keydown', handleKeydown);
    console.log('[LogoModal] Mounted, added keydown event listener');
  });

  onDestroy(() => {
    document.removeEventListener('keydown', handleKeydown);
  });
</script>

<div class="modal-backdrop"
  style="display: {show && logo ? 'flex' : 'none'}"
  role="dialog"
  aria-modal="true"
>
  {#if logo}
    <div class="modal-content">
      <div class="modal-header">
        <h2>{logo.name}</h2>
        <button class="close-btn" on:click={close} aria-label="Close preview">×</button>
      </div>
      <div class="modal-body">
        <div class="preview-container"
          role="button"
          tabindex="0"
          aria-label="Close preview"
          on:click={close}
          on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && close()}
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
        <div class="logo-details">
          {#if isSvgLogo(logo) && logo.colors}
            <div class="color-switcher-preview">
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
          {#if logo.brand}
            <p><strong>Brand:</strong> <span>{logo.brand}</span></p>
          {/if}
          <p><strong>Format:</strong> <span>{logo.format}</span></p>
          <p><strong>Path:</strong> {logo.path}</p>
          {#if logo.tags && logo.tags.length}
            <div class="logo-tags">
              {#each logo.tags as tag}
                {#if getTagObj(tag).color}
                  <span class="logo-tag" style={`background:${getTagObj(tag).color}`}>{getTagObj(tag).text}</span>
                {:else}
                  <span class="logo-tag">{getTagObj(tag).text}</span>
                {/if}
              {/each}
            </div>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  :global(.modal-backdrop) {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  :global(.modal-content) {
    background: var(--color-card);
    color: var(--text-color);
    border-radius: 8px;
    padding: 1rem;
    max-width: 500px;
    width: 90%;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    border: 1px solid var(--color-border);
    transition: background 0.2s, color 0.2s;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .modal-header h2 {
    margin: 0;
    font-size: 1.5rem;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--text-color, #222);
    transition: color 0.2s;
  }

  .close-btn:hover {
    color: var(--color-accent, #4f8cff);
  }

  .modal-body img {
    max-width: 100%;
    margin-bottom: 1rem;
  }

  .preview-container {
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: var(--color-card);
    border-radius: 4px;
    padding: 2rem;
    min-height: 200px;
    max-height: 60vh;
    max-width: 100%;
    transition: background 0.2s, color 0.2s;
    overflow: auto;
  }

  .preview-container img {
    max-width: 100%;
    max-height: 60vh;
    object-fit: contain;
  }

  .logo-details {
    padding: 1rem;
    background-color: var(--color-card);
    color: var(--text-color);
    border-radius: 4px;
    transition: background 0.2s, color 0.2s;
  }

  .logo-details p {
    margin-bottom: 0.5rem;
  }

  .logo-tags {
    margin-top: 1rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .color-switcher-preview {
    display: flex;
    align-items: center;
  }

  .color-circle.color-reset {
    background: none !important;
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
</style>
