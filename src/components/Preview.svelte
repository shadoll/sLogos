<script>
  import { onMount } from 'svelte';
  import InlineSvg from './InlineSvg.svelte';
  import Actions from './Actions.svelte';
  import { getDefaultLogoColor, getThemeColor } from '../utils/colorTheme.js';
  import { generateColorSetCircle } from "../utils/colorCircles.js";
  import { fetchSvgSource } from "../utils/svgSource.js";

  export let show = false;
  export let logo = null;
  export let theme;
  export const openLogoByAnchor = () => {};
  export let onDownload = (path, name) => {
    const a = document.createElement('a');
    a.href = path;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // For SVG source code display
  let svgSource = '';
  let isFetchingSvgSource = false;

  // No event dispatching, parent is fully responsible for controlling the component

  function isSvgLogo(logo) {
    return logo && logo.format && logo.format.toLowerCase() === 'svg';
  }  // Function to copy SVG source from textarea
  function copySvgSourceFromTextarea() {
    if (svgSource) {
      try {
        navigator.clipboard.writeText(svgSource);
        return true;
      } catch (err) {
        console.error('Error copying from textarea:', err);
        // Show content in prompt as fallback
        window.prompt('Copy the SVG source code:', svgSource);
        return false;
      }
    }
    return false;
  }

  $: getLogoThemeColor = logo => getDefaultLogoColor(logo.colors, theme);

  $: validColorConfig = logo && typeof logo.colorConfig === 'object' && logo.colorConfig.selector ? logo.colorConfig : undefined;

  // No URL manipulation in the component anymore
  // Parent components should handle all URL and navigation concerns

  // Only fetch SVG source when displayed
  $: if (show && logo) {
    // Fetch SVG source when logo is displayed and is an SVG
    if (logo.format === 'SVG' && !svgSource) {
      isFetchingSvgSource = true;
      fetchSvgSource(logo.path)
        .then(source => {
          svgSource = source;
          isFetchingSvgSource = false;
        })
        .catch(err => {
          console.error('Error fetching SVG source:', err);
          isFetchingSvgSource = false;
        });
    }
  }

  // Component doesn't handle any window events or URL changes
  // Parent should handle all navigation logic

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
  style="display: {show === true ? 'flex' : 'none'}"
  role="dialog"
  aria-modal="true"
>
  {#if logo}
    <div class="modal-content fullscreen-modal">
      <div class="modal-header">
        <div class="header-spacer"></div>
        <h2>{logo.name}</h2>
        <div class="header-spacer"></div>
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
        <div class="right-column">
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

        <div class="preview-actions-container">
          <div class="actions-wrapper">
            <Actions
              logo={logo}
              onDownload={onDownload}
              onCopySource={copySvgSourceFromTextarea}
              inPreview={true}
            />
          </div>
        </div>

        {#if isSvgLogo(logo) && svgSource}
          <div class="source-code-container">
            <h3>SVG Source Code</h3>
            <div class="source-code-wrapper">
              <textarea class="source-code" readonly>{svgSource}</textarea>
            </div>
          </div>
        {/if}
      </div>
      </div>
    </div>
  {/if}
</div>

<style>

  .preview-actions-container {
    width: 100%;
    background: var(--color-card);
    color: var(--color-text);
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 16px 4px rgba(0,0,0,0.18);
    z-index: 1;
    position: relative;
  }

  .actions-wrapper {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    width: 100%;
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
  .header-spacer {
    /* This empty div helps maintain the centered title with the back button on the left */
    width: 70px;
  }
  .modal-body.fullscreen-body {
    flex: 1 1 auto;
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    justify-content: center;
    width: 100vw;
    height: 100%;
    background: var(--color-card);
    padding: 0 2rem 2rem 2rem;
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
    width: 100%;
    background: var(--color-card);
    color: var(--color-text);
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 16px 4px rgba(0,0,0,0.18);
    overflow-y: auto;
    z-index: 1;
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

  .preview-actions-container {
    margin-top: 2rem;
    border-top: 1px solid var(--color-border);
    padding-top: 1rem;
  }

  /* These styles are no longer needed as we're using the Actions component */

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
    .right-column {
      max-width: 100%;
      width: 100%;
    }
    .preview-actions-container {
      margin: 0 auto;
      width: 100%;
    }
  }

  .right-column {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    width: 300px;
  }

  .source-code-container {
    width: 100%;
    background: var(--color-card);
    color: var(--color-text);
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 16px 4px rgba(0,0,0,0.18);
    z-index: 1;
    position: relative;
    margin-top: 2rem;
  }

  .source-code-container h3 {
    font-size: 1rem;
    margin: 0 0 1rem 0;
    color: var(--color-text);
  }

  .source-code-wrapper {
    position: relative;
    width: 100%;
    border-radius: 6px;
    overflow: hidden;
    border: 1px solid var(--color-border, #ddd);
  }

  .source-code {
    width: 100%;
    min-height: 180px;
    max-height: 300px;
    padding: 1rem;
    font-family: monospace;
    font-size: 0.6rem;
    line-height: 1.4;
    border: none;
    border-radius: 6px;
    resize: none;
    overflow-y: auto;
  }
</style>
