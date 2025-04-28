<script>
  export let logo;
  export let onCopy;
  export let onDownload;

  // Download menu state
  let showDownloadMenu = false;
  let downloadMenuAnchor;

  // Copy menu state
  let showCopyMenu = false;
  let copyMenuAnchor;

  function toggleDownloadMenu() {
    showDownloadMenu = !showDownloadMenu;
    if (showDownloadMenu) showCopyMenu = false;
  }
  function closeDownloadMenu() {
    showDownloadMenu = false;
  }
  function toggleCopyMenu() {
    showCopyMenu = !showCopyMenu;
    if (showCopyMenu) showDownloadMenu = false;
  }
  function closeCopyMenu() {
    showCopyMenu = false;
  }

  // Native click outside handler for both menus
  function handleClick(event) {
    if (showDownloadMenu && downloadMenuAnchor && !downloadMenuAnchor.contains(event.target)) {
      closeDownloadMenu();
    }
    if (showCopyMenu && copyMenuAnchor && !copyMenuAnchor.contains(event.target)) {
      closeCopyMenu();
    }
  }

  $: if (showDownloadMenu || showCopyMenu) {
    window.addEventListener('click', handleClick);
  } else {
    window.removeEventListener('click', handleClick);
  }

  function canCopyPng() {
    return !!(navigator.clipboard && typeof window.ClipboardItem === 'function');
  }

  function getSvgSize(svgText) {
    // Try to extract width/height from SVG attributes
    const widthMatch = svgText.match(/width=["']([0-9.]+)(px)?["']/i);
    const heightMatch = svgText.match(/height=["']([0-9.]+)(px)?["']/i);
    if (widthMatch && heightMatch) {
      return { width: parseFloat(widthMatch[1]), height: parseFloat(heightMatch[1]) };
    }
    // Fallback: parse viewBox
    const viewBoxMatch = svgText.match(/viewBox=["']([0-9.\s]+)["']/i);
    if (viewBoxMatch) {
      const parts = viewBoxMatch[1].split(/\s+/);
      if (parts.length === 4) {
        return { width: parseFloat(parts[2]), height: parseFloat(parts[3]) };
      }
    }
    // Default fallback
    return { width: 256, height: 256 };
  }

  function downloadPng(logo) {
    if (logo.format !== 'SVG') return;
    fetch(logo.path)
      .then(res => res.text())
      .then(svgText => {
        const svg = new Blob([svgText], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(svg);
        const img = new window.Image();
        const { width, height } = getSvgSize(svgText);
        img.onload = function () {
          const canvas = document.createElement('canvas');
          canvas.width = width || img.width;
          canvas.height = height || img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
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

  function downloadJpg(logo) {
    if (logo.format !== 'SVG') return;
    fetch(logo.path)
      .then(res => res.text())
      .then(svgText => {
        const svg = new Blob([svgText], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(svg);
        const img = new window.Image();
        const { width, height } = getSvgSize(svgText);
        img.onload = function () {
          const canvas = document.createElement('canvas');
          canvas.width = width || img.width;
          canvas.height = height || img.height;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#fff'; // white background for JPG
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(blob => {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = logo.name.replace(/\s+/g, '_').toLowerCase() + '.jpg';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }, 'image/jpeg', 0.92);
        };
        img.onerror = function () {
          alert('Failed to convert SVG to JPG.');
        };
        img.src = url;
      });
  }

  function copyPngToClipboard(logo) {
    if (logo.format !== 'SVG') return;
    if (!canCopyPng()) {
      alert('Clipboard image copy is not supported in this browser. This feature requires HTTPS and a supported browser (Chrome 76+, Edge 79+, Safari 14+).');
      return;
    }
    fetch(logo.path)
      .then(res => res.text())
      .then(svgText => {
        const svg = new Blob([svgText], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(svg);
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        const { width, height } = getSvgSize(svgText);
        img.onload = function () {
          const canvas = document.createElement('canvas');
          canvas.width = width || img.width;
          canvas.height = height || img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(blob => {
            if (!blob || blob.size === 0) {
              alert('Failed to create PNG blob. (Blob is empty, possibly due to CORS or Safari bug)');
              URL.revokeObjectURL(url);
              return;
            }
            (async () => {
              try {
                await navigator.clipboard.write([
                  new window.ClipboardItem({ 'image/png': blob })
                ]);
                alert('PNG image copied to clipboard!');
              } catch (err) {
                if (err && err.name === 'NotAllowedError') {
                  alert('Clipboard access was denied. Please check your browser permissions, use HTTPS, and ensure you are clicking the button directly.');
                } else {
                  alert('Failed to copy PNG image. This feature requires HTTPS and a supported browser (Chrome 76+, Edge 79+, Safari 14+). If you are on Safari, check CORS and try reloading the page.');
                }
              }
              URL.revokeObjectURL(url);
            })();
          }, 'image/png');
        };
        img.onerror = function (e) {
          alert('Failed to convert SVG to PNG.');
          URL.revokeObjectURL(url);
        };
        img.src = url;
      });
  }

  function handleCopyPngClick(e) {
    e.stopPropagation();
    console.log('Copy as PNG clicked', logo);
    try {
      copyPngToClipboard(logo);
    } catch (err) {
      console.error('copyPngToClipboard error:', err);
    }
    closeCopyMenu();
  }

  function handleDownloadPngClick(e) {
    e.stopPropagation();
    console.log('Download PNG clicked', logo);
    try {
      downloadPng(logo);
    } catch (err) {
      console.error('downloadPng error:', err);
    }
    closeDownloadMenu();
  }

  function handleDownloadJpgClick(e) {
    e.stopPropagation();
    console.log('Download JPG clicked', logo);
    try {
      downloadJpg(logo);
    } catch (err) {
      console.error('downloadJpg error:', err);
    }
    closeDownloadMenu();
  }
</script>

<span class="action-group">
  <button class="copy-btn" on:click={() => onCopy(logo.path)}>
    Copy URL
  </button>
  {#if logo.format === 'SVG'}
    <button class="menu-btn" bind:this={copyMenuAnchor} aria-label="More copy options" on:click={toggleCopyMenu}>
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="4" r="1.5" fill="currentColor"/><circle cx="10" cy="10" r="1.5" fill="currentColor"/><circle cx="10" cy="16" r="1.5" fill="currentColor"/></svg>
    </button>
    {#if showCopyMenu}
      <div class="dropdown-menu">
        <button class="dropdown-item" on:click={handleCopyPngClick}>
          Copy as PNG
        </button>
      </div>
    {/if}
  {/if}
</span>

<span class="action-group download-group">
  <button class="download-btn" on:click={() => onDownload(logo.path, logo.name)}>
    Download
  </button>
  {#if logo.format === 'SVG'}
    <button class="menu-btn" bind:this={downloadMenuAnchor} aria-label="More download options" on:click={toggleDownloadMenu}>
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="4" r="1.5" fill="currentColor"/><circle cx="10" cy="10" r="1.5" fill="currentColor"/><circle cx="10" cy="16" r="1.5" fill="currentColor"/></svg>
    </button>
    {#if showDownloadMenu}
      <div class="dropdown-menu">
        <button class="dropdown-item" on:click={handleDownloadPngClick}>
          Download PNG
        </button>
        <button class="dropdown-item" on:click={handleDownloadJpgClick}>
          Download JPG
        </button>
      </div>
    {/if}
  {/if}
</span>

<style>
  .action-group {
    display: inline-flex;
    align-items: center;
    position: relative;
    border-radius: 6px;
    overflow: visible;
    box-shadow: 0 1px 2px rgba(0,0,0,0.03);
    margin-right: 0.5em;
  }
  .copy-btn {
    background: var(--secondary-color, #2c3e50);
    color: #fff;
    font-weight: 500;
    letter-spacing: 0.02em;
    min-width: 4em;
    border-radius: 6px 0 0 6px;
    margin: 0;
    padding: 0.4em 1em;
    font-size: 0.95em;
    border: none;
    transition: background 0.2s, color 0.2s;
  }
  .copy-btn:focus,
  .copy-btn:hover {
    background: #222;
    color: #fff;
    outline: none;
  }
  .download-btn {
    background: #27ae60;
    color: #fff;
    font-weight: 500;
    letter-spacing: 0.02em;
    min-width: 4em;
    border-radius: 6px 0 0 6px;
    margin: 0;
    padding: 0.4em 1em;
    font-size: 0.95em;
    border: none;
    transition: background 0.2s, color 0.2s;
  }
  .download-btn:focus,
  .download-btn:hover {
    background: #219150;
    color: #fff;
    outline: none;
  }
  /* Menu button for copy group: secondary color */
  .action-group:first-of-type .menu-btn {
    background: var(--secondary-color, #2c3e50);
    color: #fff;
  }
  .action-group:first-of-type .menu-btn:focus,
  .action-group:first-of-type .menu-btn:hover {
    background: #222;
    color: #fff;
  }
  /* Menu button for download group: green */
  .action-group:last-of-type .menu-btn {
    background: #27ae60;
    color: #fff;
  }
  .action-group:last-of-type .menu-btn:focus,
  .action-group:last-of-type .menu-btn:hover {
    background: #219150;
    color: #fff;
  }
  .menu-btn {
    border: none;
    border-left: 1px solid var(--color-border, #ddd);
    border-radius: 0 6px 6px 0;
    padding: 0.4em 0.7em;
    font-size: 0.95em;
    display: flex;
    align-items: center;
    cursor: pointer;
    margin: 0;
    height: auto;
    min-height: unset;
    line-height: 1.5;
    transition: background 0.2s, color 0.2s;
    /* Visual separator between main button and menu */
  }
  .dropdown-menu {
    position: absolute;
    top: 110%;
    right: 0;
    min-width: 160px;
    background: var(--color-card, #fff);
    color: var(--color-text, #222);
    border: 1px solid var(--color-border, #ddd);
    border-radius: 8px;
    box-shadow: 0 2px 16px 4px rgba(0,0,0,0.18);
    z-index: 9999;
    padding: 0.3em 0;
    display: flex;
    flex-direction: column;
    gap: 0.1em;
    pointer-events: auto;
  }
  .dropdown-item {
    background: none;
    color: inherit;
    border: none;
    text-align: left;
    padding: 0.6em 1em;
    font-size: 0.98em;
    cursor: pointer;
    transition: background 0.2s, color 0.2s;
    border-radius: 4px;
    pointer-events: auto;
  }
  .dropdown-item:focus,
  .dropdown-item:hover {
    background: var(--color-accent, #4f8cff);
    color: #fff;
    outline: none;
  }
</style>
