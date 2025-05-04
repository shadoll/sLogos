<script>
  import { onMount } from "svelte";

  export let logos = [];
  export let displayLogos = [];
  export let theme;
  export let setTheme;
  export let viewMode;
  export let setGridView;
  export let setListView;
  export let searchQuery;
  export let setSearchQuery;
  export let allTags = [];
  export let selectedTags = [];
  export let tagDropdownOpen;
  export let toggleDropdown;
  export let addTag;
  export let removeTag;
  export let getTagObj;
  export let compactMode = false;
  export let setCompactMode = () => {};

  function onInput(event) {
    searchQuery = event.target.value;
    setSearchQuery(searchQuery);
    // Update URL with search param
    const params = new URLSearchParams(window.location.search);
    if (searchQuery) {
      params.set("search", searchQuery);
    } else {
      params.delete("search");
    }
    const newUrl =
      window.location.pathname +
      (params.toString() ? "?" + params.toString() : "");
    history.replaceState(null, "", newUrl);
  }
</script>

<header class="main-header">
  <div class="header-row">
    <h1>Logo Gallery</h1>
    <span class="logo-count">
      {#if displayLogos && logos && displayLogos.length === logos.length}
        {logos.length} images in gallery
      {:else}
        {displayLogos ? displayLogos.length : 0} of {logos ? logos.length : 0} images displayed
      {/if}
    </span>
    <div class="theme-switcher">
      <div class="theme-switch-group">
        <button
          on:click={() => setTheme("system")}
          class:active={theme === "system"}
          aria-label="System theme"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            ><circle
              cx="10"
              cy="10"
              r="8"
              stroke="currentColor"
              stroke-width="2"
            /><path
              d="M10 2a8 8 0 0 1 8 8"
              stroke="currentColor"
              stroke-width="2"
            /></svg
          >
        </button>
        <button
          on:click={() => setTheme("light")}
          class:active={theme === "light"}
          aria-label="Light mode"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            ><circle
              cx="10"
              cy="10"
              r="5"
              stroke="currentColor"
              stroke-width="2"
            /><path
              d="M10 1v2M10 17v2M3.22 3.22l1.42 1.42M15.36 15.36l1.42 1.42M1 10h2M17 10h2M3.22 16.78l1.42-1.42M15.36 4.64l1.42-1.42"
              stroke="currentColor"
              stroke-width="2"
            /></svg
          >
        </button>
        <button
          on:click={() => setTheme("dark")}
          class:active={theme === "dark"}
          aria-label="Dark mode"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            ><path
              d="M15.5 13A7 7 0 0 1 7 4.5a7 7 0 1 0 8.5 8.5z"
              stroke="currentColor"
              stroke-width="2"
            /></svg
          >
        </button>
      </div>
    </div>
  </div>
  <div class="header-row header-controls">
    <div class="search-bar">
      <input
        type="text"
        placeholder="Search logos..."
        bind:value={searchQuery}
        on:input={onInput}
        aria-label="Search logos"
      />
      {#if searchQuery}
        <button
          class="clear-btn"
          on:click={() => {
            searchQuery = "";
            setSearchQuery("");
            const params = new URLSearchParams(window.location.search);
            params.delete("search");
            const newUrl =
              window.location.pathname +
              (params.toString() ? "?" + params.toString() : "");
            history.replaceState(null, "", newUrl);
          }}
          aria-label="Clear search"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M4 4L12 12M12 4L4 12"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
        </button>
      {/if}
    </div>
    <div class="tag-filter">
      {#each selectedTags as tagText}
        <button
          class="selected-tag"
          aria-label={`Remove tag: ${getTagObj(tagText).text}`}
          on:click={() => removeTag(getTagObj(tagText).text)}
        >
          {getTagObj(tagText).text}
          <span class="close">&times;</span>
        </button>
      {/each}
      <div class="tag-dropdown">
        <button
          class="dropdown-toggle"
          on:click={toggleDropdown}
          aria-label="Add tag filter"
        >
          + Tag{selectedTags.length ? "" : "s"}
        </button>
        {#if tagDropdownOpen}
          <div class="dropdown-list">
            {#each allTags.filter((t) => !selectedTags.includes(t.text)) as tagObj}
              <button
                class="dropdown-tag"
                style={tagObj.color
                  ? `background: ${tagObj.color}; color: #fff;`
                  : ""}
                on:click={() => addTag(tagObj.text)}
                aria-label={`Add tag: ${tagObj.text}`}>{tagObj.text}</button
              >
            {/each}
            {#if allTags.filter((t) => !selectedTags.includes(t.text)).length === 0}
              <span class="no-tags">No more tags</span>
            {/if}
          </div>
        {/if}
      </div>
    </div>
    <div class="view-toggle">
      <button
        class="compact-switch-btn"
        aria-label="Toggle compact mode"
        class:active={compactMode}
        on:click={() => setCompactMode(!compactMode)}
        title="Show only one logo per brand (compact mode)"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10 11L3 11"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
          />
          <path
            d="M10 16H3"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
          />
          <path
            d="M14 13.5L16.1 16L20 11"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M3 6L13.5 6M20 6L17.75 6"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
          />
        </svg>
      </button>
      <button
        class:active={viewMode === "grid"}
        on:click={setGridView}
        aria-label="Grid view"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          ><rect x="3" y="3" width="6" height="6" fill="currentColor" /><rect
            x="11"
            y="3"
            width="6"
            height="6"
            fill="currentColor"
          /><rect x="3" y="11" width="6" height="6" fill="currentColor" /><rect
            x="11"
            y="11"
            width="6"
            height="6"
            fill="currentColor"
          /></svg
        >
      </button>
      <button
        class:active={viewMode === "list"}
        on:click={setListView}
        aria-label="List view"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          ><rect x="4" y="5" width="12" height="2" fill="currentColor" /><rect
            x="4"
            y="9"
            width="12"
            height="2"
            fill="currentColor"
          /><rect x="4" y="13" width="12" height="2" fill="currentColor" /></svg
        >
      </button>
    </div>
  </div>
</header>

<style>
  .search-bar {
    position: relative;
    display: flex;
    align-items: center;
  }
  .search-bar input {
    padding-right: 2em;
  }
  .clear-btn {
    position: absolute;
    right: 0.5em;
    background: none;
    border: none;
    padding: 0;
    margin: 0;
    cursor: pointer;
    color: #888;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
  }
  .clear-btn:hover {
    color: #f44336;
  }
  .compact-switch-btn {
    background: none;
    border: none;
    color: var(--color-text);
    cursor: pointer;
    padding: 0.3em 0.6em;
    border-radius: 6px;
    margin-right: 0.5em;
    font-size: 1.1em;
    display: inline-flex;
    align-items: center;
    transition:
      background 0.2s,
      color 0.2s;
  }
  .compact-switch-btn.active,
  .compact-switch-btn:hover {
    background: var(--color-accent, #4f8cff);
    color: #fff;
  }
</style>
