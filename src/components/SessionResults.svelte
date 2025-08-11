<script>
  import { createEventDispatcher } from 'svelte';
  import InlineSvg from './InlineSvg.svelte';

  const dispatch = createEventDispatcher();

  export let show = false;
  export let sessionStats = {
    correct: 0,
    wrong: 0,
    skipped: 0,
    total: 0,
    sessionLength: 10
  };

  function playAgain() {
    dispatch('playAgain');
  }

  function goToGames() {
    dispatch('goToGames');
  }

  function closeResults() {
    dispatch('close');
  }

  $: percentage = sessionStats.total > 0 ? Math.round((sessionStats.correct / sessionStats.total) * 100) : 0;
  $: grade = getGrade(percentage);

  function getGrade(percentage) {
    if (percentage >= 90) return { letter: 'A+', color: '#22c55e', description: 'Excellent!' };
    if (percentage >= 80) return { letter: 'A', color: '#22c55e', description: 'Great job!' };
    if (percentage >= 70) return { letter: 'B', color: '#3b82f6', description: 'Good work!' };
    if (percentage >= 60) return { letter: 'C', color: '#f59e0b', description: 'Not bad!' };
    if (percentage >= 50) return { letter: 'D', color: '#ef4444', description: 'Keep practicing!' };
    return { letter: 'F', color: '#ef4444', description: 'Try again!' };
  }
</script>

{#if show}
  <div class="results-overlay" role="dialog" aria-modal="true">
    <div class="results-modal">
      <div class="results-header">
        <div class="header-content">
          <div class="trophy-icon">
            <InlineSvg path="/icons/cup.svg" alt="Quiz Complete" />
          </div>
          <h2>Quiz Complete!</h2>
        </div>
        <button class="close-btn" on:click={closeResults} aria-label="Close results">
          <span class="close-icon"></span>
        </button>
      </div>

      <div class="results-content">
        <div class="grade-display">
          <div class="grade-circle" style="border-color: {grade.color}; color: {grade.color}">
            {grade.letter}
          </div>
          <div class="grade-text">
            <div class="percentage">{percentage}%</div>
            <div class="description">{grade.description}</div>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-item correct">
            <div class="stat-icon">
              <InlineSvg path="/icons/check-square.svg" alt="Correct" />
            </div>
            <div class="stat-value">{sessionStats.correct}</div>
            <div class="stat-label">Correct</div>
          </div>

          <div class="stat-item wrong">
            <div class="stat-icon">
              <InlineSvg path="/icons/close-square.svg" alt="Wrong" />
            </div>
            <div class="stat-value">{sessionStats.wrong}</div>
            <div class="stat-label">Wrong</div>
          </div>

          {#if sessionStats.skipped > 0}
            <div class="stat-item skipped">
              <div class="stat-icon">
                <InlineSvg path="/icons/unread.svg" alt="Skipped" />
              </div>
              <div class="stat-value">{sessionStats.skipped}</div>
              <div class="stat-label">Skipped</div>
            </div>
          {/if}
        </div>

        <div class="progress-bar">
          <div class="progress-fill" style="width: {percentage}%; background-color: {grade.color}"></div>
        </div>

        <div class="summary-text">
          You answered {sessionStats.correct} out of {sessionStats.total} questions correctly
          {#if sessionStats.skipped > 0}
            and skipped {sessionStats.skipped} question{sessionStats.skipped > 1 ? 's' : ''}
          {/if}.
        </div>
      </div>

      <div class="results-actions">
        <button class="btn btn-secondary" on:click={goToGames}>
          Back to Games
        </button>
        <button class="btn btn-primary" on:click={playAgain}>
          Play Again
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .results-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    animation: fadeIn 0.3s ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .results-modal {
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    padding: 0;
    max-width: 500px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    animation: slideUp 0.3s ease-out;
  }

  @keyframes slideUp {
    from {
      transform: translateY(30px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .results-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 2px solid var(--color-border);
    background: var(--color-bg-secondary);
    border-radius: 12px 12px 0 0;
  }

  .header-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .trophy-icon {
    width: 32px;
    height: 32px;
    color: #f59e0b;
  }

  .trophy-icon :global(.svg-wrapper) {
    width: 100%;
    height: 100%;
  }

  .results-header h2 {
    margin: 0;
    color: var(--color-text-primary);
    font-size: 1.5rem;
  }

  .close-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .close-icon {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #ff5f57;
    position: relative;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .close-icon::before {
    content: '×';
    color: #8b0000;
    font-size: 12px;
    font-weight: bold;
    opacity: 0;
    transition: opacity 0.2s ease;
    line-height: 1;
  }

  .close-btn:hover .close-icon {
    background: #ff3b30;
  }

  .close-btn:hover .close-icon::before {
    opacity: 1;
  }

  .results-content {
    padding: 2rem 1.5rem;
  }

  .grade-display {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    margin-bottom: 2rem;
    justify-content: center;
  }

  .grade-circle {
    width: 80px;
    height: 80px;
    border: 4px solid;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    font-weight: bold;
    background: var(--color-bg-secondary);
  }

  .grade-text {
    text-align: left;
  }

  .percentage {
    font-size: 2rem;
    font-weight: bold;
    color: var(--color-text-primary);
    line-height: 1;
  }

  .description {
    font-size: 1.1rem;
    color: var(--color-text-secondary);
    margin-top: 0.25rem;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .stat-item {
    text-align: center;
    padding: 1rem;
    background: var(--color-bg-secondary);
    border-radius: 8px;
    border: 1px solid var(--color-border);
  }

  .stat-icon {
    width: 24px;
    height: 24px;
    margin: 0 auto 0.5rem;
  }

  .stat-item.correct .stat-icon {
    color: #22c55e;
  }

  .stat-item.wrong .stat-icon {
    color: #ef4444;
  }

  .stat-item.skipped .stat-icon {
    color: #6b7280;
  }

  .stat-value {
    font-size: 1.5rem;
    font-weight: bold;
    color: var(--color-text-primary);
    margin-bottom: 0.25rem;
  }

  .stat-label {
    font-size: 0.9rem;
    color: var(--color-text-secondary);
  }

  .progress-bar {
    width: 100%;
    height: 8px;
    background: var(--color-bg-tertiary);
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 1.5rem;
    border: 1px solid var(--color-border);
  }

  .progress-fill {
    height: 100%;
    transition: width 0.8s ease-out;
    border-radius: 3px;
  }

  .summary-text {
    text-align: center;
    color: var(--color-text-secondary);
    font-size: 0.95rem;
    line-height: 1.4;
  }

  .results-actions {
    display: flex;
    gap: 1rem;
    padding: 1.5rem;
    border-top: 1px solid var(--color-border);
    background: var(--color-bg-secondary);
    border-radius: 0 0 12px 12px;
  }

  .btn {
    flex: 1;
    padding: 0.75rem 1rem;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.95rem;
    transition: all 0.2s ease;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .btn-primary {
    background: var(--color-primary);
    color: white;
  }

  .btn-primary:hover {
    background: var(--color-primary-dark, #0056b3);
  }

  .btn-secondary {
    background: var(--color-bg-tertiary);
    color: var(--color-text-primary);
    border: 2px solid var(--color-border);
  }

  .btn-secondary:hover {
    background: var(--color-bg-hover);
    border-color: var(--color-primary);
  }

  @media (max-width: 480px) {
    .grade-display {
      flex-direction: column;
      text-align: center;
      gap: 1rem;
    }

    .grade-text {
      text-align: center;
    }

    .stats-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .results-actions {
      flex-direction: column;
    }
  }
</style>
