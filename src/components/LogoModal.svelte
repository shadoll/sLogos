<script>
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import InlineSvg from './InlineSvg.svelte';

  export let show = false;
  export let logo = null;

  const dispatch = createEventDispatcher();

  function close() {
    dispatch('close');
  }

  function handleKeydown(event) {
    if (event.key === 'Escape') {
      close();
    }
  }

  function isSvgLogo(logo) {
    return logo && logo.format && logo.format.toLowerCase() === 'svg';
  }

  onMount(() => {
    document.addEventListener('keydown', handleKeydown);
  });

  onDestroy(() => {
    document.removeEventListener('keydown', handleKeydown);
  });
</script>

{#if show && logo}
  <div class="modal-backdrop"
    role="dialog"
    aria-modal="true"
  >
    <div class="modal-content">
      <div class="modal-header">
        <h2>{logo.name}</h2>
        <button class="close-btn" on:click={close} aria-label="Close preview">×</button>
      </div>
      <div class="modal-body">
        <div class="preview-container"
          role="button"
          tabindex="0"
          aria-label="Close preview"
          on:click={close}
          on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && close()}
          style="cursor:pointer;"
        >
          {#if isSvgLogo(logo)}
            <InlineSvg
              path={logo.path}
              color={logo.colors ? (logo._activeColor || logo.colors[0].value) : undefined}
              colorConfig={logo.colors ? logo.colorConfig : undefined}
              alt={logo.name}
            />
          {:else}
            <img src={logo.path} alt={logo.name} />
          {/if}
        </div>
        <div class="logo-details">
          {#if isSvgLogo(logo) && logo.colors}
            <div class="color-switcher-preview">
              {#each logo.colors as colorObj}
                <span
                  class="color-circle"
                  title={colorObj.label}
                  style="background:{colorObj.value}"
                  tabindex="0"
                  role="button"
                  on:click|stopPropagation={() => logo._activeColor = colorObj.value}
                  on:keydown|stopPropagation={(e) => (e.key === 'Enter' || e.key === ' ') && (logo._activeColor = colorObj.value)}
                ></span>
              {/each}
            </div>
          {/if}
          <p><strong>Format:</strong> <span>{logo.format}</span></p>
          <p><strong>Path:</strong> {logo.path}</p>
          {#if logo.tags && logo.tags.length}
            <div class="logo-tags">
              {#each logo.tags as tagObj}
                <span class="logo-tag" style={tagObj.color ? `background:${tagObj.color}` : ''}>{tagObj.text || tagObj}</span>
              {/each}
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  :global(.modal-backdrop) {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  :global(.modal-content) {
    background: var(--color-card);
    color: var(--color-text);
    border-radius: 8px;
    padding: 1rem;
    max-width: 500px;
    width: 90%;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    border: 1px solid var(--color-border);
    transition: background 0.2s, color 0.2s;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .modal-header h2 {
    margin: 0;
    font-size: 1.5rem;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
  }

  .modal-body img {
    max-width: 100%;
    margin-bottom: 1rem;
  }

  .preview-container {
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: var(--color-card);
    border-radius: 4px;
    padding: 2rem;
    min-height: 200px;
    max-height: 60vh;
    max-width: 100%;
    transition: background 0.2s, color 0.2s;
    overflow: auto;
  }

  .preview-container img {
    max-width: 100%;
    max-height: 60vh;
    object-fit: contain;
  }

  .logo-details {
    padding: 1rem;
    background-color: var(--color-card);
    color: var(--color-text);
    border-radius: 4px;
    transition: background 0.2s, color 0.2s;
  }

  .logo-details p {
    margin-bottom: 0.5rem;
  }

  .logo-tags {
    margin-top: 1rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

</style>
