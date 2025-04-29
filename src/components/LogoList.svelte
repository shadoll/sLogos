<script>
  import LogoModal from './LogoModal.svelte';
  import LogoActions from './LogoActions.svelte';
  import InlineSvg from './InlineSvg.svelte';

  export let logos = [];
  export let onCopy;
  export let onDownload;

  let showModal = false;
  let selectedLogo = null;

  function openPreview(logo) {
    selectedLogo = logo;
    showModal = true;
  }

  function closeModal() {
    showModal = false;
  }

  function isSvgLogo(logo) {
    return logo.format && logo.format.toLowerCase() === 'svg';
  }

</script>

<LogoModal show={showModal} logo={selectedLogo} on:close={closeModal} />

<div class="logo-list">
  {#each logos as logo}
    <div class="logo-item">
      <div class="logo-preview"
        role="button"
        tabindex="0"
        aria-label="Preview {logo.name}"
        on:click={() => openPreview(logo)}
        on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && openPreview(logo)}
        style="cursor:pointer;"
      >
      >
        {#if isSvgLogo(logo) && logo.colors}
          <InlineSvg path={logo.path} color={logo._activeColor || logo.colors[0].value} colorConfig={logo.colorConfig} alt={logo.name} />
        {:else}
          <img src={logo.path} alt={logo.name} />
        {/if}
      </div>
      <div class="logo-info">
        <h3>{logo.name}</h3>
        <div class="format-row">
          <span><strong>Format:</strong> {logo.format}</span>
        </div>
        {#if isSvgLogo(logo) && logo.colors}
          <div class="color-switcher-under">
            {#each logo.colors as colorObj}
              <span
                class="color-circle"
                title={colorObj.label}
                style="background:{colorObj.value}"
                tabindex="0"
                role="button"
                aria-label={"Set color " + colorObj.label}
                on:click|stopPropagation={() => logo._activeColor = colorObj.value}
                on:keydown|stopPropagation={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    logo._activeColor = colorObj.value;
                    e.preventDefault();
                  }
                }}
              ></span>
            {/each}
          </div>
        {/if}
      </div>
      <div class="logo-actions">
        <LogoActions {logo} {onCopy} {onDownload} />
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
    transition: background 0.2s, color 0.2s;
  }
  .logo-preview {
    height: 100px;
    width: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-card);
    color: var(--color-text);
    border-radius: 4px;
    overflow: hidden;
    cursor: pointer;
    transition: background 0.2s, color 0.2s;
  }
  .logo-preview img {
    max-width: 80%;
    max-height: 80%;
    width: auto !important;
    height: auto !important;
    object-fit: contain;
    object-position: center;
  }
  .color-switcher {
    display: flex;
    gap: 0.4em;
    margin: 0.5em 0 0.5em 0;
    align-items: center;
  }
  .color-circle {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 2px solid #eee;
    box-shadow: 0 1px 2px rgba(0,0,0,0.08);
    cursor: pointer;
    display: inline-block;
    transition: border 0.2s, box-shadow 0.2s;
  }
  .color-circle:hover {
    border: 2px solid #888;
    box-shadow: 0 2px 8px rgba(0,0,0,0.12);
  }
  .logo-info {
    background: var(--color-card);
    color: var(--color-text);
    padding: 0.5rem 1rem;
    border-radius: 4px;
    transition: background 0.2s, color 0.2s;
  }
  .logo-info h3 {
    margin-bottom: 0.5rem;
    color: var(--color-accent, #4f8cff);
  }
  /* .logo-info p { font-size: 0.9rem; color: var(--color-text); margin-bottom: 1rem; } */
  .logo-actions {
    display: flex;
    align-items: center;
    gap: 0.5em;
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

  .format-row {
    display: flex;
    align-items: center;
    gap: 1em;
  }
  /* .color-switcher-inline { display: flex; gap: 0.4em; align-items: center; margin-left: auto; } */
  .color-switcher-under {
    display: flex;
    gap: 0.4em;
    align-items: center;
    margin: 0.5em 0 0 0;
  }
</style>
