<script>
    import {
        generateColorSetCircle,
        getNoColorCircle,
    } from "../utils/colorCircles.js";
    export let sets = {};
    export let colors = {};
    export let activeSet = undefined;
    export let onSelect = (setName) => {};
    export let showNoColor = true;
</script>

{#if sets && Object.keys(sets).length}
    <div class="colors-variants-list">
        {#if showNoColor}
            <span
                class="color-circle color-reset"
                title="Reset to theme color"
                tabindex="0"
                role="button"
                aria-label="Reset to theme color"
                on:click|stopPropagation={() => onSelect(undefined)}
                on:keydown|stopPropagation={(e) =>
                    (e.key === "Enter" || e.key === " ") && onSelect(undefined)}
            >
                {@html getNoColorCircle()}
            </span>
        {/if}
        {#each Object.entries(sets) as [setName, setConfig], i}
            <span
                class="color-circle set-circle"
                class:active={activeSet === setName}
                title={`Color Set ${i + 1}: ${setName}`}
                tabindex="0"
                role="button"
                on:click|stopPropagation={() => onSelect(setName)}
                on:keydown|stopPropagation={(e) =>
                    (e.key === "Enter" || e.key === " ") && onSelect(setName)}
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
        box-shadow: 0 0 10px 5px var(--color-accent);
    }
</style>
