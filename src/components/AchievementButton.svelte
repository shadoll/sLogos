<script>
  import InlineSvg from './InlineSvg.svelte';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  export let achievementCount = { unlocked: 0, total: 0 };

  function handleClick() {
    dispatch('click');
  }
</script>

<button
  class="achievement-button"
  on:click={handleClick}
  title="View achievements"
>
  <span class="qh-value">
    <div class="achievement-icon">
      <InlineSvg path="/icons/medal-ribbon.svg" alt="Achievements" />
    </div>
    <span class="achievement-count">{achievementCount.unlocked}/{achievementCount.total}</span>
  </span>
</button>

<style>
  .achievement-button {
    background: transparent;
    border: none;
    border-radius: 0;
    padding: 0;
    display: flex;
    align-items: center;
    cursor: pointer;
    color: var(--color-text);
    font-size: 0.9rem;
    transition: all 0.2s ease;
    min-height: 23px;
  }

  .achievement-button:hover {
    color: var(--color-primary);
  }

  .achievement-button .qh-label {
    color: var(--color-text-secondary);
    margin-right: 0.35rem;
  }

  .achievement-button .qh-value {
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }

  .achievement-icon {
    width: 1rem;
    height: 1rem;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .achievement-count {
    color: inherit;
  }
</style>
