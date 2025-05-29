<script>
  import { onMount } from "svelte";
  import InlineSvg from "./InlineSvg.svelte";
  import Actions from "./Actions.svelte";
  import { getDefaultLogoColor, getThemeColor } from "../utils/colorTheme.js";
  import { generateColorSetCircle } from "../utils/colorCircles.js";
  import { fetchSvgSource } from "../utils/svgSource.js";

  export let show = false;
  export let logo = null;
  export let theme;
  export const setTheme = () => {};
  export const openLogoByAnchor = () => {};
  export let onDownload = (path, name) => {
    const a = document.createElement("a");
    a.href = path;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // For SVG source code display
  let svgSource = "";
  let isFetchingSvgSource = false;
  let inlineSvgRef; // Reference to the InlineSvg component

  // Watch for color changes and update SVG source
  function updateSvgSource() {
    if (inlineSvgRef && typeof inlineSvgRef.getSvgSource === 'function') {
      const newSource = inlineSvgRef.getSvgSource();
      if (newSource) {
        svgSource = newSource;
      }
    }
  }

  function isSvgLogo(logo) {
    return logo && logo.format && logo.format.toLowerCase() === "svg";
  }
  function copySvgSourceFromTextarea() {
    if (inlineSvgRef && typeof inlineSvgRef.getSvgSource === 'function') {
      // Get the updated SVG source with all color changes applied
      const updatedSource = inlineSvgRef.getSvgSource();

      try {
        const tempEl = document.createElement('textarea');
        tempEl.value = updatedSource || svgSource;
        document.body.appendChild(tempEl);
        tempEl.select();
        document.execCommand('copy');
        document.body.removeChild(tempEl);
        return true;
      } catch (err) {
        console.error("Error copying SVG source:", err);
        window.prompt("Copy the SVG source code:", updatedSource || svgSource);
        return false;
      }
    } else if (svgSource) {
      // Fallback to the original source if component reference is not available
      try {
        navigator.clipboard.writeText(svgSource);
        return true;
      } catch (err) {
        console.error("Error copying from textarea:", err);
        window.prompt("Copy the SVG source code:", svgSource);
        return false;
      }
    }
    return false;
  }

  // Update SVG source every time the component rerenders with new colors
  $: if (logo && (logo._activeColor || (logo && logo._activeSet))) {
    // Use a small delay to ensure the SVG has been rendered with the new colors
    setTimeout(updateSvgSource, 100);
  }

  $: validColorConfig =
    logo && typeof logo.colorConfig === "object" && logo.colorConfig.selector
      ? logo.colorConfig
      : undefined;

  $: getLogoThemeColor = (logo) => getDefaultLogoColor(logo.colors, theme);
  $: if (show && logo) {
    if (logo.format === "SVG" && !svgSource) {
      isFetchingSvgSource = true;
      fetchSvgSource(logo.path)
        .then((source) => {
          svgSource = source;
          isFetchingSvgSource = false;
        })
        .catch((err) => {
          console.error("Error fetching SVG source:", err);
          isFetchingSvgSource = false;
        });
    }

    // Ensure the page scrolls to the top when preview is shown
    window.scrollTo(0, 0);
  }

  // Svelte action to remove width/height from SVGs for responsive scaling
  function removeSvgSize(node) {
    function cleanSvg() {
      const svgs = node.querySelectorAll("svg");
      svgs.forEach((svg) => {
        svg.removeAttribute("width");
        svg.removeAttribute("height");
        svg.style.width = "100%";
        svg.style.height = "100%";
      });
    }
    cleanSvg();
    // In case SVG is loaded async (e.g. InlineSvg), observe for changes
    const observer = new MutationObserver(cleanSvg);
    observer.observe(node, { childList: true, subtree: true });
    return {
      destroy() {
        observer.disconnect();
      },
    };
  }
</script>

<div
  class="preview-wrapper"
  style="display: {show === true ? 'flex' : 'none'}"
  role="region"
  aria-label="Logo preview"
>
  {#if logo}
    <div class="modal-header">
      <div class="header-spacer"></div>
      <h2>{logo.name}</h2>
      <div class="header-spacer"></div>
    </div>
    <div class="preview-body">
      <div class="preview-container" use:removeSvgSize>
        {#if isSvgLogo(logo)}
          <InlineSvg
            bind:this={inlineSvgRef}
            path={logo.path}
            color={logo.colors
              ? logo._activeColor || getLogoThemeColor(logo)
              : undefined}
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
                on:click|stopPropagation={() => {
                      logo._activeColor = undefined;
                      logo._activeSet = undefined; // Reset activeSet too
                      setTimeout(updateSvgSource, 100); // Update SVG source after color reset
                    }}
                on:keydown|stopPropagation={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    logo._activeColor = undefined;
                    logo._activeSet = undefined;
                    setTimeout(updateSvgSource, 100);
                  }
                }}
              >
                <svg
                  width="100%"
                  height="100%"
                  viewBox="0 0 800 800"
                  xmlns="http://www.w3.org/2000/svg"
                  ><path
                    d="M400,0c220.766,0 400,179.234 400,400c0,220.766 -179.234,400 -400,400c-220.766,0 -400,-179.234 -400,-400c0,-220.766 179.234,-400 400,-400Zm-251.006,583.082l434.088,-434.088c-51.359,-37.541 -114.652,-59.71 -183.082,-59.71c-171.489,0 -310.716,139.227 -310.716,310.716c0,68.43 22.169,131.723 59.71,183.082Zm502.495,-365.501l-433.908,433.908c51.241,37.248 114.283,59.227 182.419,59.227c171.489,-0 310.716,-139.227 310.716,-310.716c-0,-68.136 -21.979,-131.178 -59.227,-182.419Z"
                    fill="#33363f"
                  /></svg
                >
              </span>
              {#if logo.sets}
                {#each Object.entries(logo.sets) as [setName, setConfig], i}
                  <span
                    class="color-circle set-circle"
                    title={`Color Set ${i + 1}: ${setName}`}
                    tabindex="0"
                    role="button"
                    on:click|stopPropagation={() => {
                      logo._activeColor = Object.values(logo.colors)[
                        i % Object.keys(logo.colors).length
                      ];
                      logo._activeSet = setName;
                      setTimeout(updateSvgSource, 100); // Update SVG source after color change
                    }}
                    on:keydown|stopPropagation={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        logo._activeColor = Object.values(logo.colors)[
                          i % Object.keys(logo.colors).length
                        ];
                        logo._activeSet = setName;
                        setTimeout(updateSvgSource, 100); // Update SVG source after color change
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
                    title={colorName.replace("_", " ")}
                    style={`background:${colorValue}`}
                    tabindex="0"
                    role="button"
                    on:click|stopPropagation={() => {
                      logo._activeColor = colorValue;
                      logo._activeSet = undefined; // Clear any active set when setting individual color
                      setTimeout(updateSvgSource, 100); // Update SVG source after color change
                    }}
                    on:keydown|stopPropagation={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        logo._activeColor = colorValue;
                        logo._activeSet = undefined; // Clear any active set
                        setTimeout(updateSvgSource, 100); // Update SVG source after color change
                      }
                    }}
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
                <span
                  class="logo-tag"
                  style={tagObj.color ? `background:${tagObj.color}` : ""}
                  >{tagObj.text || tagObj}</span
                >
              {/each}
            </div>
          {/if}
        </div>

        <div class="preview-actions-container">
          <div class="actions-wrapper">
            <Actions
              {logo}
              {onDownload}
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
  {/if}
</div>

<style>
  .preview-actions-container {
    width: 100%;
    background: var(--color-card);
    color: var(--color-text);
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 16px 4px rgba(0, 0, 0, 0.18);
    z-index: 2;
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
  .preview-wrapper {
    position: relative;
    width: 100%;
    height: 100%;
    background: var(--color-bg);
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
    padding: 1.5rem 2rem;
    background: var(--color-card);
    color: var(--color-text);
    z-index: 2;
    flex-shrink: 0;
    border-bottom: 1px solid var(--color-border);
  }

  .modal-header h2 {
    font-size: 2rem;
    color: var(--color-accent, #4f8cff);
    margin: 0;
  }

  .header-spacer {
    width: 70px;
  }

  .preview-body {
    flex: 1;
    display: flex;
    flex-direction: row;
    min-height: 0;
    overflow: hidden;
  }

  .preview-container {
    flex: 3;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    background-color: var(--color-card);
    color: var(--color-text);
    overflow: hidden;
    position: relative;
  }

  .preview-container img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    width: auto;
    height: auto;
  }

  .right-column {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    flex: 1;
    min-width: 300px;
    max-width: 400px;
    overflow-y: auto;
    padding: 1.5rem;
    background: var(--color-bg);
  }
  .logo-details.fullscreen-details {
    width: 100%;
    background: var(--color-card);
    color: var(--color-text);
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 16px 4px rgba(0, 0, 0, 0.18);
    overflow-y: auto;
  }
  .logo-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }


  .preview-actions-container {
    margin-top: 2rem;
    border-top: 1px solid var(--color-border);
    padding-top: 1rem;
  }
  @media (max-width: 900px) {
    .preview-wrapper {
      overflow-y: auto;
    }

    .preview-body {
      flex-direction: column;
      align-items: stretch;
      overflow: visible;
      min-height: auto;
    }

    .preview-container {
      flex: none;
      width: 100%;
      height: 60vh;
      min-height: 300px;
      padding: 1rem;
    }

    .right-column {
      flex: none;
      max-width: 100%;
      min-width: 0;
      width: 100%;
      padding: 1rem;
      overflow-y: visible;
      max-height: none;
      background: var(--color-bg);
    }

    .modal-header {
      padding: 1rem;
    }

    .logo-details.fullscreen-details {
      max-width: 100%;
      min-width: 0;
      width: 100%;
      padding: 1rem;
    }

    .preview-actions-container {
      margin: 0;
      width: 100%;
    }
  }

  .right-column {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    flex: 1;
    min-width: 300px;
    max-width: 400px;
    overflow-y: auto;
    padding: 1.5rem;
    background: var(--color-bg);
  }

  .source-code-container {
    width: 100%;
    background: var(--color-card);
    color: var(--color-text);
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 16px 4px rgba(0, 0, 0, 0.18);
    position: relative;
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


  .logo-details {
    margin-top: 1rem;
    color: var(--color-text);
  }

  .logo-details p {
    margin: 0.5rem 0;
    font-size: 0.9rem;
    color: var(--color-text);
  }

  .logo-details strong,
  .logo-details span {
    color: var(--color-text);
  }
</style>
