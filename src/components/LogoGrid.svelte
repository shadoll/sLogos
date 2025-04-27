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

<div class="logo-grid">
  {#each logos as logo}
    <div class="logo-card">
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
        <div class="logo-actions">
          <button class="copy-btn" on:click={() => onCopy(logo.path)}>
            Copy URL
          </button>
          <button class="download-btn" on:click={() => onDownload(logo.path, logo.name)}>
            Download
          </button>
        </div>
      </div>
    </div>
  {:else}
    <p class="no-results">No logos found matching your search criteria.</p>
  {/each}
</div>

<style>
  .logo-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1.5rem;
  }

  .logo-card {
    background: var(--card-background);
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .logo-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
  }

  .logo-image {
    height: 160px;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    background-color: #f5f5f5;
    position: relative;
    overflow: hidden;
    cursor: pointer;
  }

  .logo-image img {
    max-width: 80%;
    max-height: 80%;
    width: auto !important;
    height: auto !important;
    object-fit: contain;
    object-position: center;
  }

  .logo-info {
    padding: 1rem;
  }

  .logo-info h3 {
    margin-bottom: 0.5rem;
    color: var(--secondary-color);
  }

  .logo-info p {
    font-size: 0.9rem;
    color: #666;
    margin-bottom: 1rem;
  }

  .logo-actions {
    display: flex;
  }

  .no-results {
    grid-column: 1 / -1;
    text-align: center;
    padding: 2rem;
    color: #666;
  }
</style>
