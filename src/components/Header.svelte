<script>
  export let logos = [];
  export let theme;
  export let setTheme;
  export let viewMode;
  export let setGridView;
  export let setListView;
  export let searchQuery;
  export let allTags = [];
  export let selectedTags = [];
  export let tagDropdownOpen;
  export let toggleDropdown;
  export let addTag;
  export let removeTag;
  export let getTagObj;
</script>

<header class="main-header">
  <div class="header-row">
    <h1>Logo Gallery</h1>
    <span class="logo-count">{logos.length} images in gallery</span>
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
      />
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
