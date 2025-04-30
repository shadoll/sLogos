<script>
  export let logo;
  export let onDownload;

  // Download menu state
  let showDownloadMenu = false;
  let downloadMenuAnchor;

  // Copy menu state
  let showCopyMenu = false;
  let copyMenuAnchor;

  // Notification state
  let showNotification = false;
  let notificationText = '';
  let notificationType = 'success'; // 'success' or 'error'
  let notificationTimeout;

  function showCopyNotification(text, type = 'success') {
    notificationText = text;
    notificationType = type;
    showNotification = true;
    clearTimeout(notificationTimeout);
    notificationTimeout = setTimeout(() => {
      showNotification = false;
    }, 10000);
  }

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

  // Utility: Convert SVG to PNG Blob URL and Blob
  async function svgToPngUrl(svgPath, pngName) {
    const res = await fetch(svgPath);
    const svgText = await res.text();
    // Parse width/height from SVG or use viewBox fallback
    const widthMatch = svgText.match(/width=["']([0-9.]+)(px)?["']/i);
    const heightMatch = svgText.match(/height=["']([0-9.]+)(px)?["']/i);
    let width, height;
    if (widthMatch && heightMatch) {
      width = parseFloat(widthMatch[1]);
      height = parseFloat(heightMatch[1]);
    } else {
      const viewBoxMatch = svgText.match(/viewBox=["']([0-9.\s]+)["']/i);
      if (viewBoxMatch) {
        const parts = viewBoxMatch[1].split(/\s+/);
        if (parts.length === 4) {
          width = parseFloat(parts[2]);
          height = parseFloat(parts[3]);
        }
      }
    }
    width = width || 256;
    height = height || 256;

    const svgBlob = new Blob([svgText], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(svgBlob);
    const img = new window.Image();
    img.crossOrigin = 'anonymous';

    return new Promise((resolve, reject) => {
      img.onload = function () {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(blob => {
          if (!blob) return reject('Failed to create PNG blob');
          const pngUrl = URL.createObjectURL(blob);
          resolve({ pngUrl, blob });
          URL.revokeObjectURL(url);
        }, 'image/png');
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  function getBaseName(filename) {
    return filename.split('/').pop().replace(/\.[^.]+$/, '');
  }

  function getPngUrl(logo) {
    // Adjust this endpoint to match your backend
    return `/api/svg2png?file=${encodeURIComponent(logo.path)}`;
  }

  function getPngLink(logo) {
    return `${window.location.origin}/logos_gen/${getBaseName(logo.path)}.png`;
  }

  function getJpgLink(logo) {
    return `${window.location.origin}/logos_gen/${getBaseName(logo.path)}.jpg`;
  }

  async function handleCopyPngUrlClick(e) {
    e.stopPropagation();
    const pngUrl = getPngUrl(logo);
    const fullUrl = window.location.origin + pngUrl;
    try {
      await navigator.clipboard.writeText(fullUrl);
      showCopyNotification('PNG URL copied!', 'success');
    } catch (err) {
      showCopyNotification('Failed to copy PNG URL', 'error');
      window.prompt('Copy this PNG URL:', fullUrl);
    }
    closeCopyMenu();
  }

  async function handleCopyPngLinkClick(e) {
    e.stopPropagation();
    const url = getPngLink(logo);
    try {
      await navigator.clipboard.writeText(url);
      showCopyNotification('PNG link copied!', 'success');
    } catch (err) {
      showCopyNotification('Failed to copy PNG link', 'error');
      window.prompt('Copy this PNG link:', url);
    }
    closeCopyMenu();
  }

  async function handleCopyJpgLinkClick(e) {
    e.stopPropagation();
    const url = getJpgLink(logo);
    try {
      await navigator.clipboard.writeText(url);
      showCopyNotification('JPG link copied!', 'success');
    } catch (err) {
      showCopyNotification('Failed to copy JPG link', 'error');
      window.prompt('Copy this JPG link:', url);
    }
    closeCopyMenu();
  }

  async function handleCopyUrlClick(e) {
    e.stopPropagation();
    const url = window.location.origin + '/' + logo.path;
    navigator.clipboard.writeText(url)
      .then(() => showCopyNotification('URL copied!', 'success'))
      .catch(() => showCopyNotification('Failed to copy URL', 'error'));
    closeCopyMenu();
  }

  // Download PNG using the utility
  async function handleDownloadPngClick(e) {
    e.stopPropagation();
    try {
      const { pngUrl } = await svgToPngUrl(logo.path, logo.name);
      const a = document.createElement('a');
      a.href = pngUrl;
      a.download = logo.name.replace(/\s+/g, '_').toLowerCase() + '.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(pngUrl), 1000);
    } catch (err) {
      alert('Failed to generate PNG: ' + err);
    }
    closeDownloadMenu();
  }

  // Copy as PNG using the utility
  async function handleCopyPngClick(e) {
    e.stopPropagation();
    try {
      const { blob } = await svgToPngUrl(logo.path, logo.name);
      await navigator.clipboard.write([new window.ClipboardItem({ 'image/png': blob })]);
      showCopyNotification('PNG image copied!', 'success');
    } catch (err) {
      showCopyNotification('Failed to copy PNG image', 'error');
      alert('Failed to copy PNG image. ' + err);
    }
    closeCopyMenu();
  }

  function handleDownloadJpgClick(e) {
    e.stopPropagation();
    // ...existing code...
    try {
      downloadJpg(logo);
    } catch (err) {
      console.error('downloadJpg error:', err);
    }
    closeDownloadMenu();
  }
</script>

<span class="action-group">
  <button class="copy-btn" on:click={handleCopyUrlClick}>
    Copy URL
  </button>
  {#if logo.format === 'SVG'}
    <button class="menu-btn copy-menu" bind:this={copyMenuAnchor} aria-label="More copy options" on:click={toggleCopyMenu}>
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="4" r="1.5" fill="currentColor"/><circle cx="10" cy="10" r="1.5" fill="currentColor"/><circle cx="10" cy="16" r="1.5" fill="currentColor"/></svg>
    </button>
    {#if showCopyMenu}
      <div class="dropdown-menu">
        <button class="dropdown-item" on:click={handleCopyPngLinkClick}>
          Copy PNG Link
        </button>
        <button class="dropdown-item" on:click={handleCopyJpgLinkClick}>
          Copy JPG Link
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
    <button class="menu-btn download-menu" bind:this={downloadMenuAnchor} aria-label="More download options" on:click={toggleDownloadMenu}>
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

{#if showNotification}
  <div class="copy-notification {notificationType}">
    {notificationText}
  </div>
{/if}

{#if showNotification}
  <div class="notification-badge">
    {notificationText}
  </div>
{/if}

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
    min-width: 4em;
    border-radius: 6px 0 0 6px;
    border: none;
  }
  .download-btn {
    border-radius: 6px 0 0 6px;
    border: none;
  }
  .download-btn:focus,
  .download-btn:hover {
    background: #219150;
    color: #fff;
    outline: none;
  }
  .action-group .copy-btn:only-child,
  .action-group .download-btn:only-child {
    border-radius: 6px;
  }
  .action-group .copy-btn:not(:only-child),
  .action-group .download-btn:not(:only-child) {
    border-radius: 6px 0 0 6px;
  }
  .action-group .menu-btn:not(:only-child) {
    border-radius: 0 6px 6px 0;
  }
  .action-group .menu-btn:only-child {
    border-radius: 6px;
  }
  .action-group .menu-btn {
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
  /* Make menu button match main button color for each group */
  .action-group .copy-btn,
  .action-group .menu-btn.copy-menu {
    background: var(--secondary-color, #2c3e50);
    color: #fff;
  }
  .action-group .copy-btn:focus,
  .action-group .copy-btn:hover,
  .action-group .menu-btn.copy-menu:focus,
  .action-group .menu-btn.copy-menu:hover {
    background: #222;
    color: #fff;
  }
  .action-group .download-btn,
  .action-group .menu-btn.download-menu {
    background: #27ae60;
    color: #fff;
  }
  .action-group .download-btn:focus,
  .action-group .download-btn:hover,
  .action-group .menu-btn.download-menu:focus,
  .action-group .menu-btn.download-menu:hover {
    background: #219150;
    color: #fff;
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
  .notification-badge {
    position: fixed;
    bottom: 1em;
    right: 1em;
    background: var(--color-accent, #4f8cff);
    color: #fff;
    padding: 0.8em 1.2em;
    border-radius: 8px;
    box-shadow: 0 2px 16px 4px rgba(0,0,0,0.18);
    font-size: 0.95em;
    z-index: 9999;
    animation: fadeInOut 10s ease-in-out;
  }
  @keyframes fadeInOut {
    0%, 90% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
  }
  .copy-notification {
    position: fixed;
    top: 2.5rem;
    right: 2.5rem;
    color: #fff;
    padding: 0.9em 2em;
    border-radius: 2em;
    font-size: 1.1em;
    font-weight: 600;
    box-shadow: 0 2px 16px 4px rgba(0,0,0,0.18);
    z-index: 99999;
    opacity: 0.97;
    pointer-events: none;
    transition: opacity 0.3s, background 0.3s;
  }
  .copy-notification.success {
    background: #27ae60;
  }
  .copy-notification.error {
    background: #e74c3c;
  }
  .copy-notification.success {
    background: #27ae60;
  }
  .copy-notification.error {
    background: #e74c3c;
  }
</style>
