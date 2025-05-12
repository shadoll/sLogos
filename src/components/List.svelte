<script>
  import Preview from "./Preview.svelte";
  import Actions from "./Actions.svelte";
  import InlineSvg from "./InlineSvg.svelte";
  import { getThemeColor, getDefaultLogoColor } from "../utils/colorTheme.js";
  import { onMount, onDestroy } from "svelte";

  export let logos = [];
  export let allLogos = [];
  export let onCopy;
  export let onDownload;
  export let setSearchQuery;

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

<Preview show={showModal} logo={selectedLogo} on:close={closeModal} />

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
              <svg
                width="100%"
                height="100%"
                viewBox="0 0 800 800"
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                xmlns:xlink="http://www.w3.org/1999/xlink"
                xml:space="preserve"
                style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;"
              >
                <circle cx="400" cy="400" r="400" style="fill:#d6d6d6;" />
                <path
                  d="M682.843,117.843l-565.686,565.685c-156.209,-156.21 -156.209,-409.476 0,-565.685c156.21,-156.21 409.476,-156.21 565.686,-0Z"
                  style="fill:#33363f;"
                />
              </svg>
            </span>
            {#if logo.sets}
              {#each Object.entries(logo.sets) as [setName, setConfig], i}
                <span
                  class="color-circle set-circle"
                  title={`Color Set ${i + 1}`}
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
                >
                  {i + 1}
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
</style>
