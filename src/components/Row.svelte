<script>
  export let logo;
  export let view = 'grid'; // or 'list'
  export let showActions = true;
  export let onPreview = null;
  import InlineSvg from './InlineSvg.svelte';
  import { getDefaultLogoColor } from '../utils/colorTheme.js';
  import tagsData from '../../public/data/tags.json';
  function getTagObj(text) {
    return tagsData[text] ? { text, ...tagsData[text] } : { text };
  }
</script>

<div class="logo-row {view}">
  <div
    class="logo-img"
    on:click={onPreview}
    on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && onPreview && onPreview(e)}
    tabindex="0"
    role="button"
    aria-label="Preview logo"
  >
    {#if logo.format && logo.format.toLowerCase() === 'svg'}
      <InlineSvg path={logo.path} color={logo.colors ? (logo._activeColor || getDefaultLogoColor(logo.colors)) : undefined} colorConfig={logo.colors ? logo.colorConfig : undefined} alt={logo.name} />
    {:else}
      <img src={logo.path} alt={logo.name} />
    {/if}
  </div>
  <div class="logo-info">
    <h3>{logo.name}</h3>
    <div class="format-row">
      <span><strong>Format:</strong> {logo.format}</span>
      {#if logo.colors}
        <div class="color-switcher-preview {view === 'grid' ? 'align-right' : 'align-left'}">
          <span class="color-circle color-reset" title="Reset to theme color" tabindex="0" role="button" aria-label="Reset to theme color" style="background: none; width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; padding: 0; margin: 0; border: none;"
            on:click|stopPropagation={() => logo._activeColor = undefined}
            on:keydown|stopPropagation={(e) => (e.key === 'Enter' || e.key === ' ') && (logo._activeColor = undefined)}>
            <svg width="100%" height="100%" viewBox="0 0 800 800" version="1.1" xmlns="http://www.w3.org/2000/svg" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">
              <circle cx="400" cy="400" r="400" style="fill:#d6d6d6;"/>
              <path d="M682.843,117.843l-565.686,565.685c-156.209,-156.21 -156.209,-409.476 0,-565.685c156.21,-156.21 409.476,-156.21 565.686,-0Z" style="fill:#33363f;"/>
            </svg>
          </span>
          {#each logo.colors as colorObj}
            <span class="color-circle" title={colorObj.label} style={`background:${colorObj.value}`} tabindex="0" role="button"
              on:click|stopPropagation={() => logo._activeColor = colorObj.value}
              on:keydown|stopPropagation={(e) => (e.key === 'Enter' || e.key === ' ') && (logo._activeColor = colorObj.value)}></span>
          {/each}
        </div>
      {/if}
    </div>
    {#if logo.tags && logo.tags.length}
      <div class="logo-tags">
        {#each logo.tags as tag}
          {#if getTagObj(tag).color}
            <span class="logo-tag" style={`background:${getTagObj(tag).color}`}>{getTagObj(tag).text}</span>
          {:else}
            <span class="logo-tag">{getTagObj(tag).text}</span>
          {/if}
        {/each}
      </div>
    {/if}
    <slot name="extra" />
  </div>
  {#if showActions}
    <div class="logo-actions">
      <slot name="actions" />
    </div>
  {/if}
</div>
