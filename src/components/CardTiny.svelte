<script>
  import InlineSvg from "./InlineSvg.svelte";
  import { getDefaultLogoColor } from "../utils/colorTheme.js";
  import ColorSwitcher from './ColorSwitcher.svelte';

  export let logo;
  export let theme;

  function openPreview(logo) {
    // Navigate to preview page using router
    const routerPath = `/preview/${encodeURIComponent(logo.name.replace(/\s+/g, "-").toLowerCase())}`;
    window.location.hash = routerPath;
  }

  function handleClick() {
    console.log("CardTiny: Logo clicked, calling openPreview");
    openPreview(logo);
  }

  function handleKeydown(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleClick();
    }
  }

  function isSvgLogo(logo) {
    return logo && logo.format && logo.format.toLowerCase() === "svg";
  }

  $: getLogoThemeColor = (logo) => getDefaultLogoColor(logo.colors, theme);

</script>

<div
  class="card-tiny"
  on:click={handleClick}
  on:keydown={handleKeydown}
  role="button"
  tabindex="0"
  aria-label={`View ${logo.name} logo`}
  style="position: relative;"
>
  <div class="image-container">
    {#if isSvgLogo(logo)}
      <InlineSvg
        path={logo.path}
        color={logo.colors ? (logo._activeColor || getLogoThemeColor(logo)) : undefined}
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
  {#if logo.colors}
    <ColorSwitcher {logo} {theme} mode="compact" onSelect={(color, setName) => {
      logo._activeColor = color;
      logo._activeSet = setName;
    }} />
  {/if}
  <div class="name">{logo.name}</div>
</div>

<style>
  .card-tiny {
    width: 200px;
    height: 200px;
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: 12px;
    cursor: pointer;
    transition:
      background 0.2s,
      color 0.2s,
      transform 0.2s,
      box-shadow 0.2s;
    display: flex;
    flex-direction: column;
    gap: 8px;
    position: relative; /* Ensure absolute children are positioned correctly */
    overflow: visible;
  }

  .card-tiny:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .card-tiny:focus {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }

  .image-container {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    position: relative; /* Needed for color chooser absolute positioning */
  }

  .image-container img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }

  .name {
    font-weight: 500;
    color: var(--color-text);
    text-align: center;
    font-size: 0.875rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
