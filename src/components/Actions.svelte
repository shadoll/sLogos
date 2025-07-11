<script>
  import { copySvgSource } from '../utils/svgSource.js';
  import Notification from './Notification.svelte';
  import { getContext } from 'svelte';
  import { collections } from '../collections.js';

  export let logo;
  export let onDownload;
  export let onCopySource = undefined;
  export let inPreview = false;

  // Download menu state
  let showDownloadMenu = false;
  let downloadMenuAnchor;

  // Copy menu state
  let showCopyMenu = false;
  let copyMenuAnchor;

  // Notification state
  let showNotification = false;
  let notificationText = '';
  let notificationType = 'success';

  function showCopyNotification(text, type = 'success') {
    notificationText = text;
    notificationType = type;
    showNotification = true;

    // Force the notification to be visible in the preview
    setTimeout(() => {
      showNotification = true;
    }, 50);
  }

  function hideNotification() {
    showNotification = false;
  }

  function toggleDownloadMenu() {
    showDownloadMenu = !showDownloadMenu;
    if (showDownloadMenu) {
      showCopyMenu = false;
      // Position the dropdown menu
      setTimeout(() => {
        const anchor = downloadMenuAnchor;
        const dropdown = document.querySelector('.download-group .dropdown-menu');
        if (anchor && dropdown) {
          const rect = anchor.getBoundingClientRect();
          dropdown.style.top = rect.bottom + 5 + 'px';
          dropdown.style.left = rect.left + 'px';
        }
      }, 10);
    }
  }
  function closeDownloadMenu() {
    showDownloadMenu = false;
  }
  function toggleCopyMenu() {
    showCopyMenu = !showCopyMenu;
    if (showCopyMenu) {
      showDownloadMenu = false;
      // Position the dropdown menu
      setTimeout(() => {
        const anchor = copyMenuAnchor;
        const dropdown = document.querySelector('.dropdown-menu');
        if (anchor && dropdown) {
          const rect = anchor.getBoundingClientRect();
          dropdown.style.top = rect.bottom + 5 + 'px';
          dropdown.style.left = rect.left + 'px';
        }
      }, 10);
    }
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

  let collection = getContext('collection');
  if (!collection) {
    if (typeof window !== 'undefined' && window.appData && window.appData.collection) {
      collection = collections.find(c => c.name === window.appData.collection) || collections[0];
    } else {
      collection = collections[0];
    }
  }

  function getImageUrl(logo) {
    return `/${collection.baseDir}/${logo.path}`;
  }

  function getSvgPath(logo) {
    if (logo._activeSet) {
      return `/${collection.varDir}/${getBaseName(logo.path)}__${logo._activeSet}.svg`;
    }
    return `/${collection.baseDir}/${logo.path}`;
  }

  function getPngUrl(logo) {
    return `/${collection.varDir}/${logo.path.replace(/\.svg$/, '.png')}`;
  }

  function getJpgUrl(logo) {
    return `/${collection.varDir}/${logo.path.replace(/\.svg$/, '.jpg')}`;
  }

  function getPngLink(logo) {
    return `${window.location.origin}/${collection.varDir}/${logo.path.replace(/\.svg$/, '.png')}`;
  }

  function getJpgLink(logo) {
    return `${window.location.origin}/${collection.varDir}/${logo.path.replace(/\.svg$/, '.jpg')}`;
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
    const svgPath = getSvgPath(logo);
    const url = window.location.origin + '/' + svgPath;
    navigator.clipboard.writeText(url)
      .then(() => showCopyNotification('SVG URL copied!', 'success'))
      .catch(() => showCopyNotification('Failed to copy SVG URL', 'error'));
    closeCopyMenu();
  }

  // Download PNG using the same logic as JPG
  async function handleDownloadPngClick(e) {
    e.stopPropagation();
    const pngUrl = `/${collection.varDir}/${getBaseName(logo.path)}.png`;
    try {
      const res = await fetch(pngUrl, { method: 'HEAD' });
      if (res.ok) {
        const a = document.createElement('a');
        a.href = pngUrl;
        a.download = getBaseName(logo.path) + '.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        showCopyNotification('PNG file does not exist.', 'error');
        alert('PNG file does not exist: ' + pngUrl);
      }
    } catch (err) {
      showCopyNotification('Error checking PNG file.', 'error');
      alert('Error checking PNG file: ' + err);
    }
    closeDownloadMenu();
  }

  function handleDownloadJpgClick(e) {
    e.stopPropagation();
    try {
      downloadJpg(logo);
    } catch (err) {
      console.error('downloadJpg error:', err);
    }
    closeDownloadMenu();
  }

  async function downloadJpg(logo) {
    const jpgUrl = `/${collection.varDir}/${getBaseName(logo.path)}.jpg`;
    try {
      const res = await fetch(jpgUrl, { method: 'HEAD' });
      if (res.ok) {
        const a = document.createElement('a');
        a.href = jpgUrl;
        a.download = getBaseName(logo.path) + '.jpg';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        showCopyNotification('JPG file does not exist.', 'error');
        alert('JPG file does not exist: ' + jpgUrl);
      }
    } catch (err) {
      showCopyNotification('Error checking JPG file.', 'error');
      alert('Error checking JPG file: ' + err);
    }
  }

  // Handler for the source button click
  async function handleSourceClick(e) {
    e.stopPropagation();
    if (logo.format !== 'SVG') return;

    try {
      // Check if we're in preview mode and have a custom handler
      if (inPreview && typeof onCopySource === 'function') {
        const success = onCopySource();
        if (success) {
          showCopyNotification('SVG source copied!', 'success');
        } else {
          showCopyNotification('Failed to copy SVG source', 'error');
        }
      } else {
        // Use the correct SVG path (original or generated variant)
        const svgPath = getSvgPath(logo);
        const success = await copySvgSource(svgPath);
        if (success) {
          showCopyNotification('SVG source copied!', 'success');
        } else {
          showCopyNotification('Failed to copy SVG source', 'error');
        }
      }
    } catch (err) {
      showCopyNotification('Error copying SVG source', 'error');
      console.error('Error copying SVG source:', err);
    }
  }

  function getBaseName(filename) {
    return filename.replace(/^.*[\\/]/, '').replace(/\.[^/.]+$/, '');
  }
</script>

<span class="action-group">
  <button class="copy-btn" on:click={handleCopyUrlClick}>
    Copy Link
  </button>
  {#if logo.format === 'SVG'}
    <button class="menu-btn copy-menu" bind:this={copyMenuAnchor} aria-label="More copy options" on:click={toggleCopyMenu}>
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="4" r="1.5" fill="currentColor"/><circle cx="10" cy="10" r="1.5" fill="currentColor"/><circle cx="10" cy="16" r="1.5" fill="currentColor"/></svg>
    </button>
    {#if showCopyMenu}
    <div class="dropdown-menu" style="position: fixed">
        <button class="dropdown-item" on:click={handleSourceClick}>
          <span class="icon-wrapper">
            <svg style="margin-right: 5px;" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M14.5 4H17a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-5m2-7L4 7l2 2"/><path d="m10 9l2-2l-2-2"/></g></svg>
          </span>
          <span class="dropdown-text">Copy SVG Source</span>
        </button>
        <button class="dropdown-item" on:click={handleCopyPngLinkClick}>
          <span class="icon-wrapper"></span>
          <span class="dropdown-text">Copy PNG Link</span>
        </button>
        <button class="dropdown-item" on:click={handleCopyJpgLinkClick}>
          <span class="icon-wrapper"></span>
          <span class="dropdown-text">Copy JPG Link</span>
        </button>
      </div>
    {/if}
  {/if}
</span>

<span class="action-group download-group">
  <button class="download-btn" on:click={() => {
    const svgPath = getSvgPath(logo);
    const filename = logo._activeSet ?
      `${getBaseName(logo.path)}__${logo._activeSet}.svg` :
      logo.name;
    onDownload(svgPath, filename);
  }}>
    Download
  </button>
  {#if logo.format === 'SVG'}
    <button class="menu-btn download-menu" bind:this={downloadMenuAnchor} aria-label="More download options" on:click={toggleDownloadMenu}>
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="4" r="1.5" fill="currentColor"/><circle cx="10" cy="10" r="1.5" fill="currentColor"/><circle cx="10" cy="16" r="1.5" fill="currentColor"/></svg>
    </button>
    {#if showDownloadMenu}
      <div class="dropdown-menu" style="position: fixed">
        <button class="dropdown-item" on:click={handleDownloadPngClick}>
          <span class="icon-wrapper"></span>
          <span class="dropdown-text">Download PNG</span>
        </button>
        <button class="dropdown-item" on:click={handleDownloadJpgClick}>
          <span class="icon-wrapper"></span>
          <span class="dropdown-text">Download JPG</span>
        </button>
      </div>
    {/if}
  {/if}
</span>

<div class="notification-overlay">
  <Notification
    text={notificationText}
    type={notificationType}
    show={showNotification}
    onClose={hideNotification}
    duration={3000}
  />
</div>

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
    right: auto;
    left: 0;
    min-width: 200px;
    background: var(--color-card, #fff);
    color: var(--color-text, #222);
    border: 1px solid var(--color-border, #ddd);
    border-radius: 8px;
    box-shadow: 0 2px 16px 4px rgba(0,0,0,0.18);
    z-index: 10;
    padding: 0.3em 0;
    display: flex;
    flex-direction: column;
    gap: 0.1em;
    pointer-events: auto;
  }

  .dropdown-item {
    background: none;
    color: var(--color-text, #222);
    border: none;
    text-align: left;
    padding: 0.6em 1em;
    font-size: 0.98em;
    cursor: pointer;
    transition: background 0.2s, color 0.2s;
    border-radius: 4px;
    pointer-events: auto;
    display: flex;
    align-items: center;
  }
  .dropdown-item:focus,
  .dropdown-item:hover {
    background: var(--color-accent, #4f8cff);
    color: #fff;
    outline: none;
  }
  .icon-wrapper {
    width: 20px;
    min-width: 20px;
    display: inline-flex;
    justify-content: center;
    align-items: center;
  }
  .dropdown-text {
    padding-left: 5px;
    white-space: nowrap;
  }

  .notification-overlay {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 1000;
    pointer-events: none;
  }
</style>
