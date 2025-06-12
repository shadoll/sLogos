<script>
  import { generateColorSetCircle } from '../utils/colorCircles.js';
  export let sets = {};
  export let colors = {};
  export let activeSet = undefined;
  export let onSelect = (setName) => {};
</script>

{#if sets && Object.keys(sets).length}
  <div class="colors-variants-list">
    {#each Object.entries(sets) as [setName, setConfig], i}
      <span
        class="color-circle set-circle"
        class:active={activeSet === setName}
        title={`Color Set ${i + 1}: ${setName}`}
        tabindex="0"
        role="button"
        on:click|stopPropagation={() => onSelect(setName)}
        on:keydown|stopPropagation={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect(setName)}
        style="padding: 0; overflow: hidden;"
      >
        {@html generateColorSetCircle(colors, sets[setName], 24)}
      </span>
    {/each}
  </div>
{/if}

<style>
  .colors-variants-list {
    display: flex;
    gap: 0.4em;
    align-items: center;
    justify-content: center;
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
  .color-circle.active {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
    box-shadow: 0 0 0 2px var(--color-accent), 0 1px 4px rgba(0,0,0,0.12);
    background: rgba(var(--color-accent-rgb, 70,25,194), 0.08);
  }
</style>
