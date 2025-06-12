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

<div class="logo-card">
  <div
    class="logo-image"
    role="button"
    tabindex="0"
    aria-label="Preview {logo.name}"
    on:click={() => {
      console.log("CardSquare: Logo clicked, calling openPreview");
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
  <div class="logo-info">
    <div class="logo-title-row">
      <h3>{logo.name}</h3>
      {#if logo.brand}
        <button
          class="brand-filter-btn"
          title="Filter by brand"
          on:click={() => {
            console.log("CardMiddle: Filtering by brand:", logo.brand);
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
    <div class="format-row">
      <span><strong>Format:</strong> {logo.format}</span>
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
  .logo-card {
    background: var(--color-card);
    color: var(--color-text);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    transition:
      background 0.2s,
      color 0.2s,
      transform 0.2s,
      box-shadow 0.2s;
  }

  .logo-image {
    height: 260px;
    width: 100%;
    padding: 1rem;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .logo-info {
    padding: 1rem;
    border-top: 1px solid var(--color-border);
  }

  .logo-title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5em;
  }

  .brand-filter-btn {
    background: none;
    border: none;
    color: var(--color-text);
    cursor: pointer;
    padding: 0.3em 0.8em 0.1em 0.3em;
    border-radius: 4px;
    transition:
      background 0.2s,
      color 0.2s;
    z-index: 2;
    margin-left: 0.5em;
    position: relative;
  }

  .brand-filter-btn:hover {
    background: var(--color-accent, #4f8cff);
    color: #fff;
  }

  .brand-count {
    font-size: 0.85em;
    position: absolute;
    bottom: 0;
  }

  /* Format row styling */
  .format-row {
    display: flex;
    align-items: center;
    gap: 1em;
    margin-bottom: 0.5em;
    justify-content: space-between;
  }

  h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.2rem;
    line-height: 1.2;
  }

</style>
