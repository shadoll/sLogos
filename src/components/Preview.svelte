<script>
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import InlineSvg from './InlineSvg.svelte';
  import { getDefaultLogoColor, getThemeColor } from '../utils/colorTheme.js';
  import { generateColorSetCircle } from "../utils/colorCircles.js";

  export let show = false;
  export let logo = null;
  export let theme;
  export let openLogoByAnchor = () => {};

  const dispatch = createEventDispatcher();

  function close() {
    show = false;
    dispatch('close');
    // Remove preview anchor from URL
    if (window.location.hash.startsWith('#preview-')) {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }

  function handleKeydown(event) {
    if (event.key === 'Escape') {
      close();
    }
  }

  function isSvgLogo(logo) {
    return logo && logo.format && logo.format.toLowerCase() === 'svg';
  }

  $: getLogoThemeColor = logo => getDefaultLogoColor(logo.colors, theme);

  $: validColorConfig = logo && typeof logo.colorConfig === 'object' && logo.colorConfig.selector ? logo.colorConfig : undefined;

  // Improved debug logging for color and theme
  $: {
    if (logo && logo.colors) {
      const themeColor = getDefaultLogoColor(logo.colors, theme);
      const fallbackColor = getThemeColor(logo.colors, theme);
      const activeColor = logo._activeColor || themeColor;
    }
  }

  // Sync show state with URL hash
  $: {
    if (typeof window !== 'undefined') {
      if (window.location.hash.startsWith('#preview-')) {
        show = true;
      } else {
        show = false;
      }
    }
  }

  // Update URL hash when opening/closing preview
  $: if (show && logo) {
    const anchor = '#preview-' + encodeURIComponent(logo.name.replace(/\s+/g, '-').toLowerCase());
    if (window.location.hash !== anchor) {
      history.replaceState(null, '', window.location.pathname + window.location.search + anchor);
    }
  }

  // Watch for show/close to update scroll lock
  $: if (show && logo) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }

  // On mount, check for preview anchor and open if present
  onMount(() => {
    document.addEventListener('keydown', handleKeydown);
    if (window.location.hash.startsWith('#preview-')) {
      openLogoByAnchor(window.location.hash);
    }
    window.addEventListener('hashchange', onHashChange);
    // Lock background scroll when preview is open
    if (show && logo) {
      document.body.style.overflow = 'hidden';
    }
  });

  onDestroy(() => {
    document.removeEventListener('keydown', handleKeydown);
    window.removeEventListener('hashchange', onHashChange);
    // Restore scroll when component is destroyed
    document.body.style.overflow = '';
  });

  function onHashChange() {
    if (window.location.hash.startsWith('#preview-')) {
      openLogoByAnchor(window.location.hash);
    } else {
      dispatch('close');
    }
  }

  // Svelte action to remove width/height from SVGs for responsive scaling
  function removeSvgSize(node) {
    function cleanSvg() {
      const svgs = node.querySelectorAll('svg');
      svgs.forEach(svg => {
        svg.removeAttribute('width');
        svg.removeAttribute('height');
        svg.style.width = '100%';
        svg.style.height = '100%';
      });
    }
    cleanSvg();
    // In case SVG is loaded async (e.g. InlineSvg), observe for changes
    const observer = new MutationObserver(cleanSvg);
    observer.observe(node, { childList: true, subtree: true });
    return {
      destroy() {
        observer.disconnect();
      }
    };
  }
</script>

<div class="modal-backdrop fullscreen"
  style="display: {show && logo ? 'flex' : 'none'}"
  role="dialog"
  aria-modal="true"
>
  {#if logo}
    <div class="modal-content fullscreen-modal">
      <div class="modal-header">
        <h2>{logo.name}</h2>
        <button class="close-btn" on:click={close} aria-label="Close preview">×</button>
      </div>
      <div class="modal-body fullscreen-body">
        <div class="preview-container fullscreen-preview"
          role="img"
          aria-label={logo.name}
        >
          <div class="preview-media-wrapper" use:removeSvgSize>
            {#if isSvgLogo(logo)}
              <InlineSvg
                path={logo.path}
                color={logo.colors ? (logo._activeColor || getLogoThemeColor(logo)) : undefined}
                colorConfig={validColorConfig}
                targets={logo.targets}
                sets={logo.sets}
                colors={logo.colors}
                activeSet={logo._activeSet}
                alt={logo.name}
              />
            {:else}
              <img src={logo.path} alt={logo.name} />
            {/if}
          </div>
        </div>
        <div class="logo-details fullscreen-details">
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
                {#each Object.entries(logo.colors) as [colorName, colorValue]}
                  <span
                    class="color-circle"
                    title={colorName.replace('_', ' ')}
                    style={`background:${colorValue}`}
                    tabindex="0"
                    role="button"
                    on:click|stopPropagation={() => logo._activeColor = colorValue}
                    on:keydown|stopPropagation={(e) => (e.key === 'Enter' || e.key === ' ') && (logo._activeColor = colorValue)}
                  ></span>
                {/each}
              {/if}
            </div>
          {/if}
          {#if logo.brand}
            <p><strong>Brand:</strong> <span>{logo.brand}</span></p>
          {/if}
          <p><strong>Format:</strong> <span>{logo.format}</span></p>
          <p><strong>Path:</strong> {logo.path}</p>
          {#if logo.tags && logo.tags.length}
            <div class="logo-tags">
              {#each logo.tags as tagObj}
                <span class="logo-tag" style={tagObj.color ? `background:${tagObj.color}` : ''}>{tagObj.text || tagObj}</span>
              {/each}
            </div>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .set-circle {
    background: var(--color-border);
    color: var(--color-text);
    font-size: 10px;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  :global(.dark-theme) .set-circle {
    background: #444;
    color: #eee;
  }

  .modal-backdrop.fullscreen {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0,0,0,0.7); /* match .modal-backdrop in global.css */
    z-index: 2000;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }
  .modal-content.fullscreen-modal {
    width: 100vw;
    height: 100vh;
    max-width: 100vw;
    max-height: 100vh;
    border-radius: 0;
    box-shadow: none;
    background: var(--color-card);
    color: var(--color-text);
    display: flex;
    flex-direction: column;
    padding: 0;
    border: none;
    overflow: hidden;
  }
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 2rem 2.5rem 1rem 2.5rem;
    background: var(--color-card);
    color: var(--color-text);
    z-index: 2;
    flex: 0 0 auto;
  }
  .modal-header h2 {
    font-size: 2.2rem;
    color: var(--color-accent, #4f8cff);
    margin: 0;
  }
  .close-btn {
    font-size: 2.5rem;
    background: none;
    border: none;
    color: var(--color-text);
    cursor: pointer;
    transition: color 0.2s;
    z-index: 2;
  }
  .close-btn:hover {
    color: #f44336;
  }
  .modal-body.fullscreen-body {
    flex: 1 1 auto;
    display: flex;
    flex-direction: row;
    align-items: stretch;
    justify-content: center;
    width: 100vw;
    height: 100%;
    background: var(--color-card);
    padding: 0;
    gap: 2.5rem;
    overflow: hidden;
  }
  .preview-container.fullscreen-preview {
    flex: 2 1 0;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 0;
    min-height: 0;
    background: var(--color-card);
    height: 100%;
    width: 100%;
    overflow: hidden;
  }
  .preview-media-wrapper {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }
  .preview-media-wrapper img {
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
    object-fit: contain;
    display: block;
    margin: 0;
    max-width: 100%;
    max-height: 100%;
  }
  .logo-details.fullscreen-details {
    flex: 1 1 300px;
    min-width: 220px;
    max-width: 300px;
    background: var(--color-card);
    color: var(--color-text);
    border-radius: 12px;
    padding: 2rem 2rem 1.5rem 2rem;
    margin: 0 2rem 0 0;
    box-shadow: 0 2px 16px 4px rgba(0,0,0,0.18);
    overflow-y: auto;
    align-self: center;
    z-index: 1;
    max-height: 100%;
  }
  .logo-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .set-circle {
    background: var(--color-border);
    color: var(--color-text);
    font-size: 10px;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Dark theme variation */
  :global(.dark-theme) .set-circle {
    background: #444;
    color: #eee;
  }

  @media (max-width: 900px) {
    .modal-body.fullscreen-body {
      flex-direction: column;
      align-items: stretch;
      gap: 1.5rem;
      padding: 0 0.5rem 0.5rem 0.5rem;
    }
    .logo-details.fullscreen-details {
      margin: 0 auto 1.5rem auto;
      max-width: 100vw;
      min-width: 0;
      width: 100%;
      padding: 1.2rem 0.7rem 1rem 0.7rem;
    }
    .modal-header {
      padding: 1.2rem 0.7rem 0.7rem 0.7rem;
    }
  }
</style>
