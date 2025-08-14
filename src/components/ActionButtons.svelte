<script>
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  export let mode = 'welcome'; // 'welcome', 'quiz', 'results'
  export let sessionInfo = '';
  export let hasPlayedBefore = false;

  function handleAction(action, data = null) {
    dispatch('action', { action, data });
  }
</script>

<div class="action-container">
  {#if sessionInfo}
    <div class="session-info">
      {sessionInfo}
    </div>
  {/if}

  <div class="action-buttons">
    {#if mode === 'welcome'}
      <button class="action-btn secondary" on:click={() => handleAction('goToGames')}>
        Back to Games
      </button>
      <button class="action-btn primary" on:click={() => handleAction('startQuiz')}>
        {hasPlayedBefore ? 'Start New Quiz' : 'Start Quiz'}
      </button>
      <button class="action-btn secondary" on:click={() => handleAction('openSettings')}>
        Settings
      </button>
    {:else if mode === 'quiz'}
      <button class="action-btn secondary" on:click={() => handleAction('endSession')}>
        End Quiz
      </button>
      <button class="action-btn secondary" on:click={() => handleAction('openSettings')}>
        Settings
      </button>
    {:else if mode === 'results'}
      <button class="action-btn secondary" on:click={() => handleAction('goToGames')}>
        Back to Games
      </button>
      <button class="action-btn primary" on:click={() => handleAction('playAgain')}>
        Play Again
      </button>
      <button class="action-btn secondary" on:click={() => handleAction('openSettings')}>
        Settings
      </button>
    {/if}
  </div>
</div>

<style>
  .action-container {
    text-align: center;
  }

  .session-info {
    color: var(--color-text-secondary);
    font-size: 0.9rem;
    margin-bottom: 1rem;
    line-height: 1.4;
  }

  .action-buttons {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
  }

  .action-btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.95rem;
    transition: all 0.2s ease;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 120px;
  }

  .action-btn.primary {
    background: var(--color-primary);
    color: white;
  }

  .action-btn.primary:hover {
    background: var(--color-primary-dark, #0056b3);
    transform: translateY(-1px);
  }

  .action-btn.secondary {
    background: var(--color-bg-tertiary);
    color: var(--color-text-primary);
    border: 2px solid var(--color-border);
  }

  .action-btn.secondary:hover {
    background: var(--color-bg-hover);
    border-color: var(--color-primary);
    transform: translateY(-1px);
  }

  @media (max-width: 480px) {
    .action-buttons {
      flex-direction: column;
      align-items: stretch;
    }

    .action-btn {
      min-width: auto;
    }
  }
</style>
