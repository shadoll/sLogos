<script>
  export let viewMode;
  export let setGridView;
  export let setListView;
  export let setCompactView;
</script>

<div class="view-toggle">
  <div class="view-mode-group button-group">
    <button
      class:active={viewMode === "compact"}
      on:click={setCompactView}
      aria-label="Compact view"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="2" y="2" width="4" height="4" fill="currentColor" />
        <rect x="8" y="2" width="4" height="4" fill="currentColor" />
        <rect x="14" y="2" width="4" height="4" fill="currentColor" />
        <rect x="2" y="8" width="4" height="4" fill="currentColor" />
        <rect x="8" y="8" width="4" height="4" fill="currentColor" />
        <rect x="14" y="8" width="4" height="4" fill="currentColor" />
        <rect x="2" y="14" width="4" height="4" fill="currentColor" />
        <rect x="8" y="14" width="4" height="4" fill="currentColor" />
        <rect x="14" y="14" width="4" height="4" fill="currentColor" />
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
        /><rect
          x="3"
          y="11"
          width="6"
          height="6"
          fill="currentColor"
        /><rect
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
        /><rect
          x="4"
          y="13"
          width="12" height="2" fill="currentColor" /></svg
      >
    </button>
  </div>
</div>

<style>
  .view-toggle {
    display: flex;
    gap: 0.2rem;
  }

  .view-mode-group {
    display: inline-flex;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    overflow: hidden;
    background: var(--color-card);
  }

  .view-mode-group button {
    background: none;
    border: none;
    color: var(--color-text);
    cursor: pointer;
    padding: 0.5em 0.7em;
    transition: background 0.2s, color 0.2s, border-color 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    border-right: 1px solid var(--color-border);
    border-radius: 0;
    position: relative;
  }

  .view-mode-group button:last-child {
    border-right: none;
  }

  .view-mode-group button:hover:not(.active) {
    background: var(--color-border);
    color: var(--color-text);
  }

  .view-mode-group button.active {
    background: var(--color-accent);
    color: #fff;
    border-right-color: var(--color-accent);
  }

  .view-mode-group button.active:hover {
    background: var(--color-accent-hover, #2980b9);
    border-right-color: var(--color-accent-hover, #2980b9);
  }

  .view-mode-group button.active:last-child {
    border-right: none;
  }
</style>
