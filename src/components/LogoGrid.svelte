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

  function downloadPng(logo) {
    // Only for SVG
    if (logo.format !== 'SVG') return;
    fetch(logo.path)
      .then(res => res.text())
      .then(svgText => {
        const svg = new Blob([svgText], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(svg);
        const img = new window.Image();
        img.onload = function () {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          canvas.toBlob(blob => {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = logo.name.replace(/\s+/g, '_').toLowerCase() + '.png';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }, 'image/png');
        };
        img.onerror = function () {
          alert('Failed to convert SVG to PNG.');
        };
        img.src = url;
      });
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
          <span class="download-group">
            <button class="download-btn" on:click={() => onDownload(logo.path, logo.name)}>
              Download
            </button>
            {#if logo.format === 'SVG'}
              <button class="download-btn png-btn" on:click={() => downloadPng(logo)}>
                PNG
              </button>
            {/if}
          </span>
        </div>
      </div>
    </div>
  {:else}
    <p class="no-results">No logos found matching your search criteria.</p>
  {/each}
</div>

<style>
  :global(.logo-card) {
    background: var(--color-card);
    color: var(--color-text);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    overflow: hidden;
    transition: background 0.2s, color 0.2s, transform 0.2s, box-shadow 0.2s;
    min-width: 320px;
  }
  :global(.logo-card:hover) {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  }
  .logo-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1.5rem;
  }
  .logo-image {
    height: 260px;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    background: var(--color-card);
    color: var(--color-text);
    position: relative;
    overflow: hidden;
    cursor: pointer;
    transition: background 0.2s, color 0.2s;
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
    background: var(--color-card);
    color: var(--color-text);
    border-top: 1px solid var(--color-border);
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
    align-items: center;
    gap: 0.5em;
    flex-wrap: nowrap;
  }
  .download-group {
    display: inline-flex;
    border-radius: 6px;
    overflow: hidden;
    box-shadow: 0 1px 2px rgba(0,0,0,0.03);
  }
  .download-group .download-btn {
    background: #27ae60;
    color: #fff;
    font-weight: 500;
    letter-spacing: 0.02em;
    min-width: 4em;
    border-right: 1px solid var(--color-border);
    border-radius: 0;
    margin: 0;
    padding: 0.4em 1em;
    font-size: 0.95em;
    transition: background 0.2s, color 0.2s;
  }
  .download-group .download-btn:focus,
  .download-group .download-btn:hover {
    background: #219150;
    color: #fff;
    outline: none;
  }
  .download-group .png-btn {
    background: #27ae60;
    color: #fff;
    font-weight: 500;
    letter-spacing: 0.02em;
    min-width: 2.5em;
    border-radius: 0;
    margin: 0;
    padding: 0.4em 1em;
    font-size: 0.95em;
    border-right: none;
    transition: background 0.2s, color 0.2s;
  }
  .download-group .png-btn:focus,
  .download-group .png-btn:hover {
    background: #219150;
    color: #fff;
    outline: none;
  }
  .no-results {
    grid-column: 1 / -1;
    text-align: center;
    padding: 2rem;
    color: #666;
  }
</style>
