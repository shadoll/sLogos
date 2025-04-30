<script>
  import { onMount } from 'svelte';
  import LogoGrid from './components/Grid.svelte';
  import LogoList from './components/List.svelte';
  import Header from './components/Header.svelte';

  let viewMode = 'grid'; // 'grid' or 'list'
  let searchQuery = '';
  let logos = [];
  let filteredLogos = [];
  let theme = 'system';
  let mq;
  let allTags = [];
  let selectedTags = [];
  let tagDropdownOpen = false;

  // Load logos from JSON file with cache busting
  onMount(async () => {
    try {
      // Add timestamp as cache-busting query parameter
      const timestamp = new Date().getTime();
      const response = await fetch(`data/logos.json?t=${timestamp}`, {
        // Force reload from server, don't use cache
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (response.ok) {
        logos = await response.json();
        filteredLogos = logos;
        console.log('Loaded logos:', logos.length, 'at', new Date().toLocaleTimeString());
      } else {
        console.error('Failed to load logos data', response.status);
      }
    } catch (error) {
      console.error('Error loading logos:', error);
    }

    const stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      theme = stored;
    }
    applyTheme();

    // Listen for system theme changes if using system
    mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', () => {
      if (theme === 'system') applyTheme();
    });
  });

  $: {
    applyTheme();
  }

  // Compute all unique tags as objects with text and optional color
  $: allTags = Array.from(
    new Map(
      logos.flatMap(logo => (logo.tags || []).map(tag => {
        if (typeof tag === 'string') return [tag, { text: tag }];
        return [tag.text, tag];
      }))
    ).values()
  ).sort((a, b) => a.text.localeCompare(b.text));

  $: filteredLogos = logos.filter(logo => {
    const matchesSearch = logo.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTags = !selectedTags.length || (logo.tags && logo.tags.some(tag => selectedTags.includes(typeof tag === 'string' ? tag : tag.text)));
    return matchesSearch && matchesTags;
  });

  // Compute the effective theme for children
  $: effectiveTheme = theme === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : theme;

  function setGridView() {
    console.log('Setting view mode to: grid');
    viewMode = 'grid';
  }

  function setListView() {
    console.log('Setting view mode to: list');
    viewMode = 'list';
  }

  function copyUrl(logoPath) {
    const url = `${window.location.origin}/${logoPath}`;
    // Try modern clipboard API first
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(url)
        .then(() => {
          alert('URL copied to clipboard!');
        })
        .catch(err => {
          // Fallback: use execCommand for legacy support
          try {
            const input = document.createElement('input');
            input.value = url;
            document.body.appendChild(input);
            input.select();
            document.execCommand('copy');
            document.body.removeChild(input);
            alert('URL copied to clipboard!');
          } catch (fallbackErr) {
            // Final fallback: show prompt for manual copy
            window.prompt('Copy this URL:', url);
          }
        });
    } else {
      // Fallback for non-secure context or missing clipboard API
      try {
        const input = document.createElement('input');
        input.value = url;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        alert('URL copied to clipboard!');
      } catch (fallbackErr) {
        window.prompt('Copy this URL:', url);
      }
    }
  }

  function downloadLogo(logoPath, logoName) {
    const link = document.createElement('a');
    link.href = logoPath;
    link.download = logoName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function applyTheme() {
    let effectiveTheme = theme;
    if (theme === 'system') {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', effectiveTheme);
  }

  function setTheme(newTheme) {
    theme = newTheme;
    localStorage.setItem('theme', newTheme);
    console.log('[theme] setTheme:', newTheme);
    applyTheme();
  }

  function toggleTag(tag) {
    if (selectedTags.includes(tag)) {
      selectedTags = selectedTags.filter(t => t !== tag);
    } else {
      selectedTags = [...selectedTags, tag];
    }
  }

  function addTag(tag) {
    if (!selectedTags.includes(tag)) {
      selectedTags = [...selectedTags, tag];
    }
    tagDropdownOpen = false;
  }

  function removeTag(tag) {
    selectedTags = selectedTags.filter(t => t !== tag);
  }

  function toggleDropdown() {
    tagDropdownOpen = !tagDropdownOpen;
  }

  function closeDropdown(e) {
    if (!e.target.closest('.tag-dropdown')) {
      tagDropdownOpen = false;
    }
  }

  function getTagObj(text) {
    return allTags.find(t => t.text === text);
  }

  // Listen for outside click to close dropdown
  $: if (tagDropdownOpen) {
    window.addEventListener('click', closeDropdown);
  } else {
    window.removeEventListener('click', closeDropdown);
  }
</script>

<main class="container">
  <Header
    {logos}
    {theme}
    {setTheme}
    {viewMode}
    {setGridView}
    {setListView}
    bind:searchQuery
    {allTags}
    {selectedTags}
    {tagDropdownOpen}
    {toggleDropdown}
    {addTag}
    {removeTag}
    {toggleTag}
    {getTagObj}
    {closeDropdown}
    {filteredLogos}
  />

  <div class="logos-container">
    {#if viewMode === 'grid'}
      <LogoGrid
        logos={filteredLogos}
        onCopy={copyUrl}
        onDownload={downloadLogo}
        theme={effectiveTheme}
      />
    {:else}
      <LogoList
        logos={filteredLogos}
        onCopy={copyUrl}
        onDownload={downloadLogo}
      />
    {/if}
  </div>

  <footer>
    <p>shadoll Logo Gallery. All logos are property of their respective owners.</p>
  </footer>
</main>
