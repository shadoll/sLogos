<script>
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import InlineSvg from './InlineSvg.svelte';
  import { getDefaultLogoColor } from '../utils/colorTheme.js';
  import { loadTagsData, getTagObj } from '../utils/tagUtils.js';

  export let show = false;
  export let logo = null;
  export let theme;

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

  function getLogoThemeColor(logo) {
    return logo && logo.colors ? getDefaultLogoColor(logo.colors, theme) : undefined;
  }

  onMount(async () => {
    document.addEventListener('keydown', handleKeydown);
    await loadTagsData();
  });

  onDestroy(() => {
    document.removeEventListener('keydown', handleKeydown);
  });
</script>

<div class="modal-backdrop" class:show style="display: {show ? 'flex' : 'none'}" on:click={close}>
  {#if logo}
    <div class="modal-content" on:click|stopPropagation>
      <button class="close-btn" on:click={close} aria-label="Close modal">&times;</button>
      <div class="modal-body">
        <div class="preview-image-container">
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
          <h2>{logo.name}</h2>
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
                <svg width="100%" height="100%" viewBox="0 0 800 800" version="1.1" xmlns="http://www.w3.org/2000/svg" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">
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
                  <span class="logo-tag" style={`background:${getTagObj(tag).color}`}>{tag}</span>
                {:else}
                  <span class="logo-tag">{tag}</span>
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
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0,0,0,0.7);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .modal-content {
    background: var(--color-card);
    color: var(--color-text);
    border-radius: 12px;
    box-shadow: 0 4px 32px rgba(0,0,0,0.18);
    max-width: 96vw;
    max-height: 96vh;
    width: 100vw;
    height: 100vh;
    display: flex;
    flex-direction: column;
    position: relative;
    padding: 2rem;
    overflow: auto;
  }
  .preview-image-container {
    flex: 1 1 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    max-width: 100%;
    max-height: 80vh;
    overflow: auto;
    margin-bottom: 2rem;
  }
  .preview-image-container img,
  .preview-image-container :global(svg) {
    max-width: 90%;
    max-height: 70vh;
    width: auto;
    height: auto;
    object-fit: contain;
    display: block;
    margin: auto;
  }
  .close-btn {
    position: absolute;
    top: 1.5rem;
    right: 2rem;
    font-size: 2.2rem;
    background: none;
    border: none;
    color: var(--color-text);
    cursor: pointer;
    z-index: 1100;
    padding: 0.2em 0.5em;
    border-radius: 50%;
    transition: background 0.2s;
  }
  .close-btn:hover {
    background: rgba(0,0,0,0.18);
  }
  .logo-details {
    padding: 1rem;
    background: var(--color-card);
    color: var(--color-text);
    border-radius: 8px;
    border: 1px solid var(--color-border);
  }
  .logo-details h2 {
    margin-top: 0;
    margin-bottom: 1rem;
    color: var(--color-accent);
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
</style>
