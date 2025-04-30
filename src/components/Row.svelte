<script>
  export let logo;
  export let onCopy;
  export let onDownload;
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

<style>
  .logo-row {
    display: flex;
    align-items: center;
    padding: 0.5em 0.5em;
    border-bottom: 1px solid #eee;
    gap: 1em;
  }
  .logo-row.grid {
    flex-direction: column;
    align-items: stretch;
    border-bottom: none;
    border-radius: 10px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.04);
    margin-bottom: 1em;
    padding: 1em;
  }
  .logo-row.list {
    flex-direction: row;
    align-items: center;
    border-radius: 0;
    box-shadow: none;
    margin-bottom: 0;
    padding: 0.5em 0.5em;
  }
  .logo-img {
    flex-shrink: 0;
    width: 64px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.04);
    cursor: pointer;
  }
  .logo-info {
    flex: 1 1 auto;
    min-width: 0;
  }
  .logo-actions {
    display: flex;
    align-items: center;
    gap: 0.5em;
  }
  .color-switcher-preview {
    display: flex;
    align-items: center;
    gap: 0.4em;
  }
  .color-switcher-preview.align-right {
    justify-content: flex-end;
  }
  .color-switcher-preview.align-left {
    justify-content: flex-start;
  }
  .color-circle {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-right: 4px;
    cursor: pointer;
    box-sizing: border-box;
    padding: 0;
  }
  .color-circle.color-reset {
    background: none !important;
  }
  .logo-tag {
    display: inline-block;
    background: var(--color-accent, #4f8cff);
    color: #fff;
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
  .logo-card {
    background: var(--color-card);
    color: var(--color-text);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    transition: background 0.2s, color 0.2s, transform 0.2s, box-shadow 0.2s;
    min-width: 320px;
  }
</style>
