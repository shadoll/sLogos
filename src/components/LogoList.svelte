<script>
  import LogoModal from './LogoModal.svelte';

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
        <img src={logo.path} alt={logo.name} />
      </div>
      <div class="logo-info">
        <h3>{logo.name}</h3>
        <p>Format: {logo.format}</p>
      </div>
      <div class="logo-actions">
        <button class="copy-btn" on:click={() => onCopy(logo.path)}>
          Copy URL
        </button>
        <button class="download-btn" on:click={() => onDownload(logo.path, logo.name)}>
          Download
        </button>
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
  .logo-info p {
    font-size: 0.9rem;
    color: var(--color-text);
    margin-bottom: 1rem;
  }
  .logo-actions {
    display: flex;
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
</style>
