<script>
  import { createEventDispatcher } from 'svelte';
  import InlineSvg from './InlineSvg.svelte';

  const dispatch = createEventDispatcher();

  // Props - settings values
  export let autoAdvance = true;
  export let focusWrongAnswers = false;
  export let reduceCorrectAnswers = false;
  export let soundEnabled = true;
  export let sessionLength = 10;
  export let showSettings = false;
  export let showResetConfirmation = false;

  // Customizable labels for different quiz types
  export let focusWrongLabel = 'Focus on previously answered incorrectly items';
  export let reduceCorrectLabel = 'Show correctly answered items less frequently';

  function toggleSettings() {
    showSettings = !showSettings;
    dispatch('settingsToggle', showSettings);
  }

  function handleOverlayKeydown(event) {
    if (event.key === 'Escape') {
      toggleSettings();
    }
  }

  function handleOverlayClick(event) {
    if (event.target === event.currentTarget) {
      toggleSettings();
    }
  }

  function resetAllStats() {
    showResetConfirmation = true;
    dispatch('resetConfirmation', true);
  }

  function handleResetStats() {
    // Perform a full reset here so individual quizzes don't need to implement reset handlers
    const keysToRemove = [
      // Flag quiz
      'flagQuizStats',
      'flagQuizWrongAnswers',
      'flagQuizCorrectAnswers',
      'flagQuizAchievements',
      'flagQuizSessionState',
      // Capitals quiz
      'capitalsQuizStats',
      'capitalsQuizWrongAnswers',
      'capitalsQuizCorrectAnswers',
      'capitalsQuizAchievements',
      'capitalsQuizSessionState',
      // Shared/global
      'globalQuizStats'
    ];

    try {
      for (const k of keysToRemove) {
        localStorage.removeItem(k);
      }
    } catch (e) {
      console.error('Error clearing quiz data during reset:', e);
    }

    // Close confirmation modal and settings overlay, notify parent
    showResetConfirmation = false;
    if (showSettings) {
      showSettings = false;
      dispatch('settingsToggle', false);
    }

    // Give a moment for UI to close, then reload so components pick up cleared state
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    }, 150);
  }

  // Reactive statements to dispatch settings changes
  $: dispatch('settingsChange', {
    autoAdvance,
    focusWrongAnswers,
    reduceCorrectAnswers,
    soundEnabled,
    sessionLength
  });
</script>

{#if showSettings}
  <div class="settings-overlay" on:click={handleOverlayClick} on:keydown={handleOverlayKeydown} role="button" tabindex="0" aria-label="Close settings">
    <div class="settings-modal" role="dialog" aria-modal="true">
      <div class="settings-header">
        <InlineSvg path="/icons/settings.svg" alt="Settings" />
        <h3>Game Settings</h3>
        <button class="close-btn" on:click={toggleSettings} aria-label="Close settings">
          <span class="close-icon"></span>
        </button>
      </div>

      <div class="settings-content">
        <div class="setting-item">
          <label>
            <input
              type="checkbox"
              bind:checked={autoAdvance}
            />
            Auto-advance to next question after answering
          </label>
        </div>

        <div class="setting-item">
          <label>
            <input
              type="checkbox"
              bind:checked={focusWrongAnswers}
            />
            {focusWrongLabel}
          </label>
        </div>

        <div class="setting-item">
          <label>
            <input
              type="checkbox"
              bind:checked={reduceCorrectAnswers}
            />
            {reduceCorrectLabel}
          </label>
        </div>

        <div class="setting-item">
          <label>
            <input
              type="checkbox"
              bind:checked={soundEnabled}
            />
            Enable sound effects for answers
          </label>
        </div>

        <div class="setting-item">
          <label for="sessionLength">
            Quiz length (number of questions):
            <select id="sessionLength" bind:value={sessionLength}>
              <option value={5}>5 questions</option>
              <option value={10}>10 questions</option>
              <option value={15}>15 questions</option>
              <option value={20}>20 questions</option>
              <option value={25}>25 questions</option>
              <option value={50}>50 questions</option>
            </select>
          </label>
        </div>

        <div class="setting-actions">
          <button class="reset-stats-btn" on:click={resetAllStats}>
            Reset All Statistics
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

{#if showResetConfirmation}
  <div class="confirmation-overlay" role="dialog" aria-modal="true">
    <div class="confirmation-modal">
      <div class="confirmation-header">
        <InlineSvg path="/icons/danger-triangle.svg" alt="Warning" />
        <h3>Reset All Data</h3>
      </div>
      <div class="confirmation-content">
        <p>This action will permanently delete:</p>
        <ul>
          <li>✗ All game statistics (correct, wrong, skipped answers)</li>
          <li>✗ Current quiz score</li>
          <li>✗ All unlocked achievements</li>
          <li>✗ Achievement progress</li>
          <li>✗ Wrong answer tracking data</li>
          <li>✗ Correct answer tracking data</li>
        </ul>
        <p><strong>This cannot be undone!</strong></p>
      </div>
      <div class="confirmation-actions">
        <button class="cancel-btn" on:click={() => showResetConfirmation = false}>Cancel</button>
        <button class="confirm-btn" on:click={handleResetStats}>Reset Everything</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .settings-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .settings-modal {
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: 0;
    max-width: 500px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  }

  .settings-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 2px solid var(--color-border);
    background: var(--color-bg-secondary);
  }

  .settings-header :global(.svg-wrapper) {
    width: 24px;
    height: 24px;
    display: inline-flex;
    flex-shrink: 0;
  }

  .settings-header h3 {
    margin: 0;
    color: var(--color-text-primary);
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

  .settings-content {
    padding: 1.5rem;
  }

  .setting-item {
    margin-bottom: 1rem;
  }

  .setting-item label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    color: var(--color-text-primary);
    font-size: 0.9rem;
  }

  .setting-item label[for="sessionLength"] {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
    cursor: default;
  }

  .setting-item input[type="checkbox"] {
    width: 1rem;
    height: 1rem;
    cursor: pointer;
  }

  .setting-item select {
    background: var(--color-bg-secondary);
    color: var(--color-text-primary);
    border: 2px solid var(--color-border);
    border-radius: 6px;
    padding: 0.75rem 1rem;
    font-size: 0.9rem;
    cursor: pointer;
    width: 100%;
    appearance: none;
    background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e");
    background-repeat: no-repeat;
    background-position: right 0.75rem center;
    background-size: 1rem;
    padding-right: 2.5rem;
    transition: all 0.2s ease;
    font-family: inherit;
  }

  .setting-item select:hover {
    border-color: var(--color-primary);
    background-color: var(--color-bg-hover, var(--color-bg-secondary));
  }

  .setting-item select:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(70, 25, 194, 0.1);
  }

  .setting-item select option {
    background: var(--color-bg-secondary);
    color: var(--color-text-primary);
    padding: 0.5rem;
  }

  .setting-actions {
    margin-top: 2rem;
    padding-top: 1rem;
    border-top: 2px solid var(--color-border);
  }

  .reset-stats-btn {
    background: #e74c3c;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    cursor: pointer;
    font-weight: 500;
    transition: background-color 0.2s;
    width: 100%;
    font-size: 0.9rem;
  }

  .reset-stats-btn:hover {
    background: #cc3333;
  }

  .confirmation-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1001;
  }

  .confirmation-modal {
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: 0;
    max-width: 450px;
    width: 90%;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
  }

  .confirmation-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1.5rem;
    border-bottom: 1px solid var(--color-border);
  }

  .confirmation-header :global(.svg-wrapper) {
    width: 24px;
    height: 24px;
    color: #e74c3c;
  }

  .confirmation-header h3 {
    margin: 0;
    color: #e74c3c;
    font-size: 1.2rem;
  }

  .confirmation-content {
    padding: 1.5rem;
  }

  .confirmation-content p {
    margin: 0 0 1rem 0;
    color: var(--color-text-primary);
    line-height: 1.4;
  }

  .confirmation-content ul {
    margin: 1rem 0;
    padding-left: 0;
    list-style: none;
  }

  .confirmation-content li {
    padding: 0.25rem 0;
    color: var(--color-text-secondary);
    font-size: 0.9rem;
  }

  .confirmation-actions {
    display: flex;
    gap: 1rem;
    padding: 1.5rem;
    border-top: 1px solid var(--color-border);
  }

  .cancel-btn, .confirm-btn {
    flex: 1;
    padding: 0.75rem 1rem;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    font-weight: 500;
    transition: background-color 0.2s;
    font-size: 0.9rem;
  }

  .cancel-btn {
    background: var(--color-bg-tertiary);
    color: var(--color-text-primary);
    border: 2px solid var(--color-border);
  }

  .cancel-btn:hover {
    background: var(--color-bg-quaternary);
  }

  .confirm-btn {
    background: #e74c3c;
    color: white;
  }

  .confirm-btn:hover {
    background: #cc3333;
  }
</style>
