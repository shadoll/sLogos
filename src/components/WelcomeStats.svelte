<script>
  import { createEventDispatcher } from 'svelte';
  import InlineSvg from './InlineSvg.svelte';

  const dispatch = createEventDispatcher();

  export let gameStats = { correct: 0, wrong: 0, total: 0, skipped: 0 };
  export let sessionStats = null;
  export let showSessionResults = false;
  export let sessionLength = 10;

  function startQuiz() {
    dispatch('startQuiz');
  }

  function handlePlayAgain() {
    dispatch('startQuiz');
  }

  function handleGoToGames() {
    window.location.hash = '#/game';
  }

  function openSettings() {
    dispatch('openSettings');
  }

  function handleCloseResults() {
    dispatch('closeResults');
  }

  $: hasPlayedBefore = gameStats.total > 0;
  $: totalQuestions = gameStats.correct + gameStats.wrong + gameStats.skipped;
  $: accuracy = totalQuestions > 0 ? Math.round((gameStats.correct / totalQuestions) * 100) : 0;

  // Session results calculations
  $: sessionPercentage = sessionStats && sessionStats.total > 0 ? Math.round((sessionStats.correct / sessionStats.total) * 100) : 0;
  $: sessionGrade = sessionStats ? getGrade(sessionPercentage) : null;

  // Welcome page grade display for accuracy
  $: accuracyGrade = hasPlayedBefore ? getGrade(accuracy) : null;

  function getGrade(percentage) {
    if (percentage >= 90) return { letter: 'A+', color: '#22c55e', description: 'Excellent!' };
    if (percentage >= 80) return { letter: 'A', color: '#22c55e', description: 'Great job!' };
    if (percentage >= 70) return { letter: 'B', color: '#3b82f6', description: 'Good work!' };
    if (percentage >= 60) return { letter: 'C', color: '#f59e0b', description: 'Not bad!' };
    if (percentage >= 50) return { letter: 'D', color: '#ef4444', description: 'Keep practicing!' };
    return { letter: 'F', color: '#ef4444', description: 'Try again!' };
  }
</script>

<div class="welcome-container">
  {#if showSessionResults && sessionStats}
    <!-- Session Results View -->
    <div class="welcome-header">
      <div class="welcome-icon">
        <InlineSvg path="/icons/check-circle.svg" alt="Quiz Complete" />
      </div>
      <h1>Quiz Complete!</h1>
      <p class="welcome-subtitle">Great job on completing the quiz</p>
    </div>

    <div class="stats-section">
      <div class="grade-display">
        <div class="grade-circle" style="border-color: {sessionGrade.color}; color: {sessionGrade.color}">
          {sessionGrade.letter}
        </div>
        <div class="grade-text">
          <div class="percentage">{sessionPercentage}%</div>
          <div class="description">{sessionGrade.description}</div>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon correct">
            <InlineSvg path="/icons/check-square.svg" alt="Correct" />
          </div>
          <div class="stat-value">{sessionStats.correct}</div>
          <div class="stat-label">Correct</div>
        </div>

        <div class="stat-card">
          <div class="stat-icon wrong">
            <InlineSvg path="/icons/close-square.svg" alt="Wrong" />
          </div>
          <div class="stat-value">{sessionStats.wrong}</div>
          <div class="stat-label">Wrong</div>
        </div>

        <div class="stat-card">
          <div class="stat-icon skipped">
            <InlineSvg path="/icons/skip-square.svg" alt="Skipped" />
          </div>
          <div class="stat-value">{sessionStats.skipped}</div>
          <div class="stat-label">Skipped</div>
        </div>
      </div>

      <div class="progress-bar">
        <div class="progress-fill" style="width: {sessionPercentage}%; background-color: {sessionGrade.color}"></div>
      </div>

      <div class="progress-summary">
        <h3>You answered {sessionStats.correct} out of {sessionStats.total} questions correctly
        {#if sessionStats.skipped > 0}
          and skipped {sessionStats.skipped} question{sessionStats.skipped > 1 ? 's' : ''}
        {/if}.</h3>
      </div>
    </div>

    <div class="action-buttons">
      <button class="action-btn secondary" on:click={handleGoToGames}>
        Back to Games
      </button>
      <button class="action-btn primary" on:click={handlePlayAgain}>
        Play Again
      </button>
      <button class="action-btn secondary" on:click={openSettings}>
        Settings
      </button>
    </div>
  {:else}
    <!-- Welcome/Stats View -->
    <div class="welcome-header">
      <div class="welcome-icon">
        <InlineSvg path="/icons/flag.svg" alt="Flag Quiz" />
      </div>
      <h1>Flag Quiz</h1>
      <p class="welcome-subtitle">Test your knowledge of world flags</p>
    </div>

    {#if hasPlayedBefore}
      <div class="stats-section">
        <h2>Your Statistics</h2>

        <div class="grade-display">
          <div class="accuracy-icon" style="color: {accuracyGrade.color}">
            <InlineSvg path="/icons/medal-star.svg" alt="Accuracy" />
          </div>
          <div class="grade-text">
            <div class="percentage">{accuracy}%</div>
            <div class="description">Accuracy</div>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon correct">
              <InlineSvg path="/icons/check-square.svg" alt="Correct" />
            </div>
            <div class="stat-value">{gameStats.correct}</div>
            <div class="stat-label">Correct</div>
          </div>

          <div class="stat-card">
            <div class="stat-icon wrong">
              <InlineSvg path="/icons/close-square.svg" alt="Wrong" />
            </div>
            <div class="stat-value">{gameStats.wrong}</div>
            <div class="stat-label">Wrong</div>
          </div>

          <div class="stat-card">
            <div class="stat-icon skipped">
              <InlineSvg path="/icons/skip-square.svg" alt="Skipped" />
            </div>
            <div class="stat-value">{gameStats.skipped}</div>
            <div class="stat-label">Skipped</div>
          </div>
        </div>

        <div class="progress-summary">
          <h3>Total Questions Answered: {totalQuestions}</h3>
        </div>
      </div>
    {:else}
      <div class="welcome-message">
        <h2>Welcome to Flag Quiz!</h2>
        <p>Challenge yourself to identify flags from around the world. Each quiz contains <strong>{sessionLength} questions</strong> with a mix of flag-to-country and country-to-flag challenges.</p>

        <div class="features">
          <div class="feature">
            <InlineSvg path="/icons/global.svg" alt="Global" />
            <span>Flags from every continent</span>
          </div>
          <div class="feature">
            <InlineSvg path="/icons/medal-ribbon.svg" alt="Achievements" />
            <span>Unlock achievements</span>
          </div>
          <div class="feature">
            <InlineSvg path="/icons/chart-square.svg" alt="Statistics" />
            <span>Track your progress</span>
          </div>
        </div>
      </div>
    {/if}

    <div class="start-section">
      <button class="start-quiz-btn" on:click={startQuiz}>
        {hasPlayedBefore ? 'Start New Quiz' : 'Start Quiz'}
      </button>
      <p class="session-info">{sessionLength} questions per quiz</p>
    </div>
  {/if}
</div>

<style>
  .welcome-container {
    max-width: 600px;
    margin: 0 auto;
    padding: 2rem;
    text-align: center;
  }

  .welcome-header {
    margin-bottom: 3rem;
  }

  .welcome-icon {
    width: 64px;
    height: 64px;
    margin: 0 auto 1.5rem;
    color: var(--color-primary);
  }

  .welcome-header h1 {
    font-size: 2.5rem;
    font-weight: bold;
    color: var(--color-text-primary);
    margin: 0 0 0.5rem 0;
  }

  .welcome-subtitle {
    font-size: 1.2rem;
    color: var(--color-text-secondary);
    margin: 0;
  }

  .stats-section {
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    padding: 2rem;
    margin-bottom: 2rem;
  }

  .stats-section h2 {
    margin: 0 0 1.5rem 0;
    color: var(--color-text-primary);
    font-size: 1.5rem;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .stat-card {
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: 1.5rem 1rem;
    text-align: center;
  }

  .stat-icon {
    width: 32px;
    height: 32px;
    margin: 0 auto 0.75rem;
  }

  .stat-icon.correct {
    color: #22c55e;
  }

  .stat-icon.wrong {
    color: #ef4444;
  }

  .stat-icon.skipped {
    color: #6b7280;
  }

  .stat-value {
    font-size: 1.75rem;
    font-weight: bold;
    color: var(--color-text-primary);
    margin-bottom: 0.25rem;
  }

  .stat-label {
    font-size: 0.9rem;
    color: var(--color-text-secondary);
  }

  .progress-summary {
    border-top: 1px solid var(--color-border);
    padding-top: 1.5rem;
  }

  .progress-summary h3 {
    margin: 0;
    color: var(--color-text-primary);
    font-size: 1.1rem;
    font-weight: 600;
    line-height: 1.4;
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
    background: var(--color-bg-primary);
  }

  .accuracy-icon {
    width: 80px;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .accuracy-icon :global(.svg-wrapper) {
    width: 64px;
    height: 64px;
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

  .welcome-message {
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    padding: 2rem;
    margin-bottom: 2rem;
  }

  .welcome-message h2 {
    margin: 0 0 1rem 0;
    color: var(--color-text-primary);
    font-size: 1.5rem;
  }

  .welcome-message p {
    color: var(--color-text-secondary);
    line-height: 1.6;
    margin-bottom: 1.5rem;
  }

  .features {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
    text-align: left;
  }

  .feature {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: var(--color-text-primary);
  }

  .feature :global(.svg-wrapper) {
    width: 24px;
    height: 24px;
    color: var(--color-primary);
    flex-shrink: 0;
  }

  .start-section {
    margin-top: 2rem;
  }

  .start-quiz-btn {
    background: var(--color-primary);
    color: white;
    border: none;
    border-radius: 8px;
    padding: 1rem 2rem;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-bottom: 0.75rem;
  }

  .start-quiz-btn:hover {
    background: var(--color-primary-dark);
    transform: translateY(-1px);
  }

  .session-info {
    color: var(--color-text-secondary);
    font-size: 0.9rem;
    margin: 0;
  }

  @media (max-width: 480px) {
    .welcome-container {
      padding: 1rem;
    }

    .welcome-header h1 {
      font-size: 2rem;
    }

    .stats-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .features {
      align-items: center;
      text-align: center;
    }

    .grade-display {
      flex-direction: column;
      text-align: center;
      gap: 1rem;
    }

    .grade-text {
      text-align: center;
    }

    .action-buttons {
      flex-direction: column;
      align-items: stretch;
    }

    .action-btn {
      min-width: auto;
    }
  }
</style>
