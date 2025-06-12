<script>
  import { onMount } from "svelte";

  export let searchQuery;
  export let setSearchQuery;

  let searchInput; // Reference to the search input element

  onMount(() => {
    // Add global keydown listener for the / hotkey
    function handleKeydown(event) {
      // Check if the / key is pressed and no input/textarea is focused
      if (
        event.key === "/" &&
        !["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)
      ) {
        event.preventDefault(); // Prevent the / character from being typed
        searchInput?.focus(); // Focus the search input
      }
    }

    document.addEventListener("keydown", handleKeydown);

    // Cleanup listener on component destroy
    return () => {
      document.removeEventListener("keydown", handleKeydown);
    };
  });

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

    console.log("SearchBar: Search query set to:", searchQuery);
  }

  function clearSearch() {
    searchQuery = "";
    setSearchQuery("");
    const params = new URLSearchParams(window.location.search);
    params.delete("search");
    const newUrl =
      window.location.pathname +
      (params.toString() ? "?" + params.toString() : "");
    history.replaceState(null, "", newUrl);
    console.log("SearchBar: Search query cleared");
  }
</script>

<div class="search-bar">
  <input
    type="text"
    placeholder="Search logos..."
    bind:value={searchQuery}
    bind:this={searchInput}
    on:input={onInput}
    aria-label="Search logos"
  />
  {#if searchQuery}
    <button
      class="clear-btn"
      on:click={clearSearch}
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
  <div class="hotkey-hint">
    <kbd>/</kbd>
  </div>
</div>

<style>
  .search-bar {
    margin-bottom: 0;
    width: 100%;
    max-width: 500px;
    position: relative;
    display: flex;
    align-items: center;
  }

  .search-bar input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    font-size: 1rem;
    background: var(--color-card);
    color: var(--color-text);
    padding-right: 4em;
  }

  .clear-btn {
    position: absolute;
    right: 2.5em; /* Positioned to leave space for hotkey hint */
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

  .hotkey-hint {
    position: absolute;
    right: 0.5em;
    display: flex;
    align-items: center;
    pointer-events: none;
  }

  .hotkey-hint kbd {
    background: var(--color-border);
    color: var(--color-text);
    border: 1px solid var(--color-border);
    border-radius: 3px;
    padding: 0.2em 0.4em;
    font-size: 0.75em;
    font-family: monospace;
    font-weight: bold;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }
</style>
