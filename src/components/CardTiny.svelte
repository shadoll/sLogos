<script>
  import InlineSvg from "./InlineSvg.svelte";
  import { getDefaultLogoColor } from "../utils/colorTheme.js";
  import ColorSwitcher from './ColorSwitcher.svelte';
  import { collections } from '../collections.js';
  import { getContext } from 'svelte';

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

  function getCollectionByPath(path) {
    return collections.find(col => path.startsWith(col.baseDir.replace('images/', '')) || path.startsWith(col.baseDir));
  }

  function getBaseDir(logo) {
    const collection = getCollectionByPath(logo.path);
    return collection ? collection.baseDir : 'images/logos';
  }

  let collection = getContext('collection');
  if (!collection) {
    if (typeof window !== 'undefined' && window.appData && window.appData.collection) {
      collection = collections.find(c => c.name === window.appData.collection) || collections[0];
    } else {
      collection = collections[0];
    }
  }
  function getImageUrl(logo) {
    // Always resolve collection for each logo based on current collection name
    let currentCollection = collection;
    if (typeof window !== 'undefined' && window.appData && window.appData.collection) {
      currentCollection = collections.find(c => c.name === window.appData.collection) || collections[0];
    }
    return `/${currentCollection.baseDir}/${logo.path}`;
  }

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
        path={getImageUrl(logo)}
        color={logo.colors ? (logo._activeColor || getLogoThemeColor(logo)) : undefined}
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
  {#if logo.colors}
    <ColorSwitcher {logo} {theme} mode="compact" onSelect={(color, setName) => {
      logo._activeColor = color;
      logo._activeSet = setName;
    }} />
  {/if}
  <div class="name">{logo.title || logo.name}</div>
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
