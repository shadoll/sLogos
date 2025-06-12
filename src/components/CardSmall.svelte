<script>
  import InlineSvg from "./InlineSvg.svelte";
  import Actions from "./Actions.svelte";
  import ColorSwitcher from "./ColorSwitcher.svelte";
  import { getDefaultLogoColor } from "../utils/colorTheme.js";

  export let logo;
  export let theme;
  export let onCopy;
  export let onDownload;
  export let allLogos = [];
  export let addBrand = () => {};
  export const setTheme = () => {};

  function openPreview(logo) {
    // Navigate to preview page using router
    const routerPath = `/preview/${encodeURIComponent(logo.name.replace(/\s+/g, "-").toLowerCase())}`;
    window.location.hash = routerPath;
  }

  function isSvgLogo(logo) {
    return logo && logo.format && logo.format.toLowerCase() === "svg";
  }

  $: getLogoThemeColor = (logo) => getDefaultLogoColor(logo.colors, theme);
</script>

<div class="logo-list-item">
  <div
    class="logo-image-container"
    role="button"
    tabindex="0"
    aria-label="Preview {logo.name}"
    on:click={() => {
      console.log("CardList: Logo clicked, calling openPreview");
      openPreview(logo);
    }}
    on:keydown={(e) =>
      (e.key === "Enter" || e.key === " ") && openPreview(logo)}
    style="cursor:pointer;"
  >
    {#if isSvgLogo(logo)}
      {#key theme + (logo._activeColor || "")}
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
      {/key}
    {:else}
      <img src={logo.path} alt={logo.name} />
    {/if}
  </div>
  <div class="logo-content">
    <div class="logo-header">
      <h3>{logo.name}</h3>
      {#if logo.brand}
        <button
          class="brand-filter-btn"
          title="Filter by brand"
          on:click={() => {
            console.log("CardList: Filtering by brand:", logo.brand);
            addBrand(logo.brand);
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              stroke="currentColor"
              stroke-linejoin="round"
              stroke-width="2"
              d="M20 4H4v2l6 6v8.5l4-2.5v-6l6-6V4z"
            />
          </svg>
          {#if allLogos && allLogos.filter((l) => l.brand === logo.brand).length > 1}
            <span class="brand-count"
              >{allLogos.filter((l) => l.brand === logo.brand).length}</span
            >
          {/if}
        </button>
      {/if}
    </div>

    <div class="logo-details">
      {#if logo.colors}
        <ColorSwitcher {logo} {theme} mode="standard" onSelect={(color, setName) => {
          logo._activeColor = color;
          logo._activeSet = setName;
        }} />
      {/if}
    </div>

    <div class="logo-actions">
      <Actions {logo} {onCopy} {onDownload} />
    </div>
  </div>
</div>

<style>
  .logo-list-item {
    display: flex;
    background: var(--color-card);
    color: var(--color-text);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    margin-bottom: 0.75rem;
    overflow: hidden;
    height: 130px;
  }

  .logo-image-container {
    width: 180px;
    min-width: 180px;
    height: 100%;
    border-right: 1px solid var(--color-border);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
  }

  .logo-image-container img,
  .logo-image-container :global(svg) {
    max-width: 100%;
    max-height: 100%;
    width: 100%;
    height: 100%;
    object-fit: contain;
    padding: 1rem;
  }

  .logo-content {
    flex: 1;
    padding: 1rem 1.25rem;
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow-y: auto;
  }

  .logo-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .logo-details {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
    flex-wrap: wrap;
  }

  .logo-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: auto;
    position: relative;
    z-index: 20; /* Higher than the list item */
  }


  .brand-filter-btn {
    background: none;
    border: none;
    color: var(--color-text);
    cursor: pointer;
    padding: 0.2em 0.5em;
    border-radius: 4px;
    transition:
      background 0.2s,
      color 0.2s;
    position: relative;
    display: flex;
    align-items: center;
  }

  .brand-filter-btn:hover {
    background: var(--color-accent, #4f8cff);
    color: #fff;
  }

  .brand-count {
    font-size: 0.75em;
    position: absolute;
    bottom: 0;
    right: 0;
  }

  h3 {
    margin: 0;
    font-size: 1.1rem;
    line-height: 1.2;
  }

  /* For mobile view */
  @media (max-width: 600px) {
    .logo-details {
      flex-direction: column;
      align-items: flex-start;
    }

    .logo-actions {
      flex-wrap: wrap;
    }
  }

  /* Responsive grid for the list view */
  @media (max-width: 900px) {
    :global(.list-view) {
      grid-template-columns: 1fr;
    }
  }

  :global(.list-item) {
    position: relative;
    z-index: 1;
  }

  :global(.list-item:hover) {
    z-index: 2; /* Raise the z-index when hovered */
  }
</style>
