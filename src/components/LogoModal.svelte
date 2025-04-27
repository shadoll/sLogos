<script>
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';

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
          <img src={logo.path} alt={logo.name} />
        </div>
        <div class="logo-details">
          <p><strong>Format:</strong> {logo.format}</p>
          <p><strong>Path:</strong> {logo.path}</p>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    backdrop-filter: blur(3px);
  }

  .modal-content {
    background-color: white;
    border-radius: 8px;
    width: 90%;
    max-width: 900px;
    max-height: 90vh;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border-bottom: 1px solid #eee;
  }

  .modal-header h2 {
    margin: 0;
    color: var(--secondary-color);
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #666;
  }

  .close-btn:hover {
    color: #333;
  }

  .modal-body {
    padding: 1rem;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .preview-container {
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #f5f5f5;
    border-radius: 4px;
    padding: 2rem;
    min-height: 300px;
  }

  .preview-container img {
    max-width: 100%;
    max-height: 60vh;
    object-fit: contain;
  }

  .logo-details {
    padding: 1rem;
    background-color: #f9f9f9;
    border-radius: 4px;
  }

  .logo-details p {
    margin-bottom: 0.5rem;
  }
</style>
