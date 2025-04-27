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
      <div class="logo-image"
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
  .logo-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .logo-item {
    display: flex;
    align-items: center;
    background: var(--card-background);
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s, box-shadow 0.2s;
    width: 100%;
  }

  .logo-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
  }

  .logo-image {
    width: 120px;
    min-width: 120px;
    height: 100px;
    padding: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f5f5f5;
    position: relative;
    overflow: hidden;
    border-right: 1px solid #eee;
    cursor: pointer;
  }

  .logo-image img {
    max-width: 80%;
    max-height: 80%;
    width: auto !important;
    height: auto !important;
    object-fit: contain;
  }

  .logo-info {
    flex-grow: 1;
    padding: 1rem;
  }

  .logo-info h3 {
    margin-bottom: 0.5rem;
    color: var(--secondary-color);
    font-size: 1.2rem;
  }

  .logo-info p {
    font-size: 0.9rem;
    color: #666;
  }

  .logo-actions {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 1rem;
    min-width: 120px;
    border-left: 1px solid #eee;
  }

  .logo-actions button {
    padding: 0.4rem 0.8rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
    text-align: center;
    transition: background-color 0.2s;
  }

  .copy-btn {
    background-color: #f0f0f0;
    color: #333;
  }

  .download-btn {
    background-color: var(--secondary-color);
    color: white;
  }

  .no-results {
    text-align: center;
    padding: 2rem;
    color: #666;
  }
</style>
