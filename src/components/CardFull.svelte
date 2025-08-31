<script>
  import CountryMap from "./CountryMap.svelte";
  import { onMount, getContext } from "svelte";
  import InlineSvg from "./InlineSvg.svelte";
  import Actions from "./Actions.svelte";
  import ColorSwitcher from "./ColorSwitcher.svelte";
  import { getDefaultLogoColor, getThemeColor } from "../utils/colorTheme.js";
  import { fetchSvgSource } from "../utils/svgSource.js";
  import { collections } from "../collections.js";
  import { get } from "svelte/store";

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
    if (inlineSvgRef && typeof inlineSvgRef.getSvgSource === "function") {
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
    if (inlineSvgRef && typeof inlineSvgRef.getSvgSource === "function") {
      // Get the updated SVG source with all color changes applied
      const updatedSource = inlineSvgRef.getSvgSource();

      try {
        const tempEl = document.createElement("textarea");
        tempEl.value = updatedSource || svgSource;
        document.body.appendChild(tempEl);
        tempEl.select();
        document.execCommand("copy");
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
      fetchSvgSource(getImageUrl(logo))
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

  // Capitalize first letter of a string
  function capitalizeFirst(str) {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // Use the current collection context for baseDir
  let collection = getContext("collection");
  if (!collection) {
    // fallback: try to infer from window.appData
    if (
      typeof window !== "undefined" &&
      window.appData &&
      window.appData.collection
    ) {
      collection =
        collections.find((c) => c.name === window.appData.collection) ||
        collections[0];
    } else {
      collection = collections[0];
    }
  }

  function getImageUrl(logo) {
    return `/${collection.baseDir}/${logo.path}`;
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
      <h2>{logo.title || logo.name}</h2>
      <div class="header-spacer"></div>
    </div>
    <div class="preview-body">
      <div class="preview-container">
        {#if isSvgLogo(logo)}
          <InlineSvg
            bind:this={inlineSvgRef}
            path={getImageUrl(logo)}
            color={logo.colors
              ? logo._activeColor || getLogoThemeColor(logo)
              : undefined}
            colorConfig={logo.colors ? logo.colorConfig : undefined}
            targets={logo.targets}
            sets={logo.sets}
            colors={logo.colors}
            activeSet={logo._activeSet}
            alt={logo.title || logo.name}
          />
        {:else}
          <img src={getImageUrl(logo)} alt={logo.title || logo.name} />
        {/if}
      </div>
      <div class="right-column">
        {#if logo.tags && logo.tags.some((tagObj) => (tagObj.text || tagObj) === "Country") && logo.meta && logo.meta["ISO code"]}
          <CountryMap
            countryCodes={[String(logo.meta["ISO code"]).trim().toUpperCase()]}
            countryScale={true}
          />
        {/if}

        <div class="logo-details fullscreen-details">
          {#if logo.colors}
            <ColorSwitcher
              {logo}
              {theme}
              mode="standard"
              onSelect={(color, setName) => {
                logo._activeColor = color;
                logo._activeSet = setName;
                setTimeout(updateSvgSource, 100);
              }}
            />
          {/if}
          {#if logo.brand}
            <p><strong>Owner:</strong> <span>{logo.brand}</span></p>
          {/if}
          <p><strong>Format:</strong> <span>{logo.format}</span></p>
          <p><strong>Path:</strong> {logo.path}</p>
          {#if logo.meta}
            <div class="logo-meta">
              {#each Object.entries(logo.meta) as [key, value]}
                <p>
                  {#if typeof value === "string" && value.startsWith("https://")}
                    <a
                      class="meta-link"
                      href={value}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {capitalizeFirst(key)}
                      <svg
                        height="12"
                        viewBox="0 0 12 12"
                        width="12"
                        xmlns="http://www.w3.org/2000/svg"
                        ><path
                          d="m6 1h5v5l-2.14-2.15-4.16 4.15-.7-.7 4.15-4.16zm-4 2h2v1h-2v6h6v-2h1v2a1 1 0 0 1 -1 1h-6a1 1 0 0 1 -1-1v-6a1 1 0 0 1 1-1"
                          fill="currentColor"
                        /></svg
                      >
                    </a>
                  {:else}
                    <strong>{capitalizeFirst(key)}:</strong>
                    <span>{value}</span>
                  {/if}
                </p>
              {/each}
            </div>
          {/if}
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
          {#if logo.variants && logo.variants.length}
            <div class="variants-list">
              {#each logo.variants as variant}
                <span class="logo-variant">{variant}</span>
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
  .actions-wrapper {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    width: 100%;
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
    /* display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    background-color: var(--color-card); */
    color: var(--color-text);
    /* overflow: hidden;
    position: relative;
    contain: layout style paint; */
  }

  .preview-container img {
    max-width: 90%;
    max-height: 90%;
    width: auto;
    height: auto;
    object-fit: contain;
    display: block;
  }

  .logo-details.fullscreen-details {
    width: 100%;
    background: var(--color-card);
    color: var(--color-text);
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 16px 4px rgba(0, 0, 0, 0.18);
  }
  .logo-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .variants-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }
  .logo-tag {
    display: inline-block;
    background: var(--color-accent);
    color: var(--white);
    border-radius: 12px;
    padding: 0.2em 0.8em;
    font-size: 0.85em;
    font-weight: 500;
    letter-spacing: 0.02em;
    margin-right: 0.3em;
    margin-top: 0.2em;
    margin-bottom: 0.2em;
    transition: background 0.2s;
  }

  .logo-variant {
    display: inline-block;
    background: #9b59b6;
    color: white;
    border-radius: 12px;
    padding: 0.2em 0.8em;
    font-size: 0.85em;
    font-weight: 500;
    letter-spacing: 0.02em;
    margin-right: 0.3em;
    margin-top: 0.2em;
    margin-bottom: 0.2em;
    transition: background 0.2s;
  }

  .logo-variant:hover {
    background: #8e44ad;
  }
  .preview-actions-container {
    width: 100%;
    background: var(--color-card);
    color: var(--color-text);
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 16px 4px rgba(0, 0, 0, 0.18);
    z-index: 2;
    position: relative;
    border-top: 1px solid var(--color-border);
    padding-top: 1rem;
  }

  .meta-link {
    color: var(--color-accent);
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 0.25em;
    transition: text-decoration 0.15s;
  }
  .meta-link:hover {
    text-decoration: underline;
  }

  @media (max-width: 900px) {
    .preview-wrapper {
      overflow-y: auto;
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
    padding: 0 1.5rem;
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
