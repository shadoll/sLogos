<script>
  import Preview from "./Preview.svelte";
  import Actions from "./Actions.svelte";
  import InlineSvg from "./InlineSvg.svelte";
  import { getThemeColor, getDefaultLogoColor } from "../utils/colorTheme.js";
  import { generateColorSetCircle } from "../utils/colorCircles.js";
  import { onMount, onDestroy } from "svelte";

  export let logos = [];
  export let allLogos = [];
  export let onCopy;
  export let onDownload;
  export let setSearchQuery;

  let showModal = false;
  let selectedLogo = null;

  let theme = getTheme();  function openPreview(logo) {
    // Navigate to preview page instead of showing modal
    const previewUrl = `#/preview/${encodeURIComponent(logo.name.replace(/\s+/g, '-').toLowerCase())}`;
    window.location.href = previewUrl;
  }

  function isSvgLogo(logo) {
    return logo.format && logo.format.toLowerCase() === "svg";
  }

  function getTheme() {
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return "light";
  }

  function handleThemeChange(e) {
    theme = e.matches ? "dark" : "light";
  }

  onMount(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    mql.addEventListener("change", handleThemeChange);
  });

  onDestroy(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    mql.removeEventListener("change", handleThemeChange);
  });

  $: getLogoThemeColor = (logo) => getDefaultLogoColor(logo.colors, theme);

  $: {
    if (logos && logos.length) {
      logos.forEach((logo) => {
        if (logo.colors) {
          const themeColor = getDefaultLogoColor(logo.colors, theme);
          const activeColor = logo._activeColor || themeColor;
          console.log(
            "[LogoList] Logo:",
            logo.name,
            "| Theme:",
            theme,
            "| Theme color:",
            themeColor,
            "| Active color:",
            activeColor,
          );
        }
      });
    }
  }
</script>

<div class="logo-list">
  {#each logos as logo}
    <div class="logo-item">
      <div
        class="logo-preview"
        role="button"
        tabindex="0"
        aria-label="Preview {logo.name}"
        on:click={() => openPreview(logo)}
        on:keydown={(e) =>
          (e.key === "Enter" || e.key === " ") && openPreview(logo)}
        style="cursor:pointer;"
      >
        {#if isSvgLogo(logo)}
          <InlineSvg
            path={logo.path}
            color={logo.colors
              ? logo._activeColor || getLogoThemeColor(logo)
              : undefined}
            colorConfig={logo.colors ? logo.colorConfig : undefined}
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
      <div class="logo-info">
        <div class="logo-list-title-row">
          <h3>{logo.name}</h3>
        </div>
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
              on:click|stopPropagation={() => (logo._activeColor = undefined)}
              on:keydown|stopPropagation={(e) =>
                (e.key === "Enter" || e.key === " ") &&
                (logo._activeColor = undefined)}
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
                    if (e.key === "Enter" || e.key === " ") {
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
                  on:click|stopPropagation={() =>
                    (logo._activeColor = colorValue)}
                  on:keydown|stopPropagation={(e) =>
                    (e.key === "Enter" || e.key === " ") &&
                    (logo._activeColor = colorValue)}
                ></span>
              {/each}
            {/if}
          </div>
        {/if}
      </div>
      <div class="logo-actions">
        <button
          class="brand-filter-btn common-btn"
          title="Filter by brand"
          on:click={() => {
            console.log("List: Filtering by brand:", logo.brand);
            setSearchQuery(logo.brand);
            // Update URL with search param
            const params = new URLSearchParams(window.location.search);
            params.set('search', logo.brand);
            const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
            history.replaceState(null, '', newUrl);
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path stroke="currentColor" stroke-linejoin="round" stroke-width="2" d="M20 4H4v2l6 6v8.5l4-2.5v-6l6-6V4z"/>
          </svg>
          {#if allLogos && allLogos.filter(l => l.brand === logo.brand).length > 1}
            <span class="brand-count-index">{allLogos.filter(l => l.brand === logo.brand).length}</span>
          {/if}
        </button>
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
    transition:
      background 0.2s,
      color 0.2s;
  }
  .logo-preview {
    height: 100px;
    width: 80px;
    padding: 0;
    border-radius: 4px;
    position: relative;
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
  .color-switcher-preview.align-left {
    justify-content: flex-start;
  }
  .brand-filter-btn {
    background: none;
    border: none;
    color: var(--color-text);
    cursor: pointer;
    padding: 0.2em;
    border-radius: 4px;
    transition:
      background 0.2s,
      color 0.2s;
    z-index: 2;
    margin-left: 0.5em;
  }
  .brand-filter-btn:hover {
    background: var(--color-accent-light, #e0f0ff);
    color: #fff;
  }
  .brand-filter-btn.common-btn {
    background: var(--secondary-color);
    color: #fff;
    border: none;
    padding: 0.4em 0.8em 0.4em 0.3em;
    border-radius: 6px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 1em;
    transition: background 0.2s, color 0.2s;
    margin-left: 0.5em;
    box-shadow: 0 1px 2px rgba(0,0,0,0.04);
    position: relative;
  }
  .brand-filter-btn.common-btn:hover {
    background: var(--color-accent-dark, #3576c7);
    color: #fff;
  }
  .brand-count-index {
    position: absolute;
    font-size: 0.85em;
    bottom: 0.1em;
    right: 0.3em;
  }
  .logo-list-title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5em;
  }

  .set-circle {
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    padding: 0;
  }
</style>
