<script>
  import { generateColorSetCircle, getNoColorCircle } from '../utils/colorCircles.js';
  import ColorsVariants from './ColorsVariants.svelte';
  export let logo;
  export let mode = 'standard'; // 'standard' or 'compact'
  export let onSelect = (color, setName) => {};

  let showDropdown = false;
  let colorDropdownRef;

  function handleCircleClick(color, setName = undefined, event) {
    event?.stopPropagation();
    onSelect(color, setName);
    showDropdown = false;
  }

  function handleDropdownBlur(event) {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      showDropdown = false;
    }
  }

  // Returns the SVG for the current color set for the chooser button in compact mode
  function getCurrentColorCircle() {
    if (logo.sets && logo._activeSet && logo.sets[logo._activeSet]) {
      return generateColorSetCircle(logo.colors, logo.sets[logo._activeSet], 24);
    }
    return getNoColorCircle();
  }

  // Helper to check if a color/set is active
  function isActive(color, setName) {
    if (logo.sets && setName) {
      return logo._activeSet === setName;
    } else if (!logo.sets && color) {
      return logo._activeColor === color;
    } else if (!color && !setName) {
      // Only active if both are strictly undefined, null, or empty
      return (!logo._activeColor && !logo._activeSet) || (logo._activeColor === undefined && logo._activeSet === undefined);
    }
    return false;
  }
</script>

{#if logo.colors}
  {#if mode === 'compact'}
    <div class="color-chooser-wrapper">
      <span
        class="color-circle {logo._activeSet ? '' : 'color-reset'}"
        title="Choose color"
        tabindex="0"
        role="button"
        aria-label="Choose logo color"
        on:click|stopPropagation={() => (showDropdown = !showDropdown)}
        on:keydown|stopPropagation={(e) => (e.key === 'Enter' || e.key === ' ') && (showDropdown = !showDropdown)}
      >
        {@html logo._activeSet && logo.sets && logo.sets[logo._activeSet]
          ? generateColorSetCircle(logo.colors, logo.sets[logo._activeSet], 24)
          : getNoColorCircle()}
      </span>
      {#if showDropdown}
        <div
          class="color-dropdown"
          tabindex="-1"
          bind:this={colorDropdownRef}
          on:blur={handleDropdownBlur}
        >
          <div class="color-switcher-preview">
            {#if logo.sets}
              <ColorsVariants sets={logo.sets} colors={logo.colors} activeSet={logo._activeSet} showNoColor={true} onSelect={(setName) => handleCircleClick(setName ? Object.values(logo.colors)[Object.keys(logo.sets).indexOf(setName) % Object.keys(logo.colors).length] : undefined, setName)} />
            {/if}
          </div>
        </div>
      {/if}
    </div>
  {:else}
    <div class="color-switcher-preview">
      {#if logo.sets}
        <ColorsVariants sets={logo.sets} colors={logo.colors} activeSet={logo._activeSet} showNoColor={true} onSelect={(setName) => handleCircleClick(setName ? Object.values(logo.colors)[Object.keys(logo.sets).indexOf(setName) % Object.keys(logo.colors).length] : undefined, setName)} />
      {/if}
    </div>
  {/if}
{/if}

<style>
  .color-chooser-wrapper {
    position: absolute;
    right: 8px;
    bottom: 8px;
    z-index: 10;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    pointer-events: auto;
  }
  .color-circle {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 1px solid var(--color-border, #ddd);
    cursor: pointer;
    transition: transform 0.2s;
    box-sizing: border-box;
    display: inline-block;
  }
  .color-circle:hover {
    transform: scale(1.1);
  }
  .color-dropdown {
    position: absolute;
    bottom: 32px;
    right: 0;
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    padding: 8px 10px 6px 10px;
    display: flex;
    flex-direction: row;
    gap: 6px;
    z-index: 100;
    min-width: 120px;
    flex-wrap: wrap;
  }

  .color-reset {
    background: none !important;
    width: 24px;
    height: 24px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    margin: 0;
    border: none;
  }
</style>
