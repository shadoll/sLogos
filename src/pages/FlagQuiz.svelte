<script>
  import { onMount } from 'svelte';
  import Header from '../components/Header.svelte';
  import Footer from '../components/Footer.svelte';
  import InlineSvg from '../components/InlineSvg.svelte';
  import Achievements from '../components/Achievements.svelte';
  import AchievementButton from '../components/AchievementButton.svelte';

  // Game data
  let flags = [];
  let currentQuestion = null;
  let questionType = 'flag-to-country'; // 'flag-to-country' or 'country-to-flag'

  // Question and answer arrays
  let currentCountryOptions = [];
  let currentFlagOptions = [];
  let correctAnswer = '';

  // Game states
  let gameState = 'loading'; // 'loading', 'question', 'answered', 'finished'
  let selectedAnswer = null;
  let answered = false;
  let isAnswered = false;
  let resultMessage = '';
  let showResult = false;
  let timeoutId = null;
  let showCountryInfo = false;
  let showResultCountryInfo = false;

  // Scoring
  let score = { correct: 0, total: 0, skipped: 0 };
  let gameStats = { correct: 0, wrong: 0, total: 0, skipped: 0 };
  let wrongAnswers = new Map(); // Track flags answered incorrectly: flag.name -> count
  let correctAnswers = new Map(); // Track flags answered correctly: flag.name -> count

  // Achievement System
  let currentStreak = 0;
  let showAchievements = false;
  let achievementsComponent;
  let achievementCount = { unlocked: 0, total: 0 };

  // Settings
  let autoAdvance = true;
  let showSettings = false;
  let settingsLoaded = false;
  let showResetConfirmation = false;
  let focusWrongAnswers = false;
  let reduceCorrectAnswers = false;

  // Theme
  let theme = 'system';

  function setTheme(t) {
    localStorage.setItem('theme', t);
    applyTheme(t);
    theme = t;
  }

  // Update achievement count when achievements component is available
  $: if (achievementsComponent) {
    updateAchievementCount();
  }

  // Save settings when they change (after initial load)
  $: if (settingsLoaded && typeof reduceCorrectAnswers !== 'undefined') {
    localStorage.setItem('flagQuizSettings', JSON.stringify({ autoAdvance, focusWrongAnswers, reduceCorrectAnswers }));
  }

  // Load game stats from localStorage
  onMount(async () => {
  // Initialize theme
  theme = localStorage.getItem('theme') || 'system';
  applyTheme(theme);

  // Set window.appData for header compatibility
    if (typeof window !== 'undefined') {
      window.appData = {
        ...window.appData,
        collection: 'flags',
        setCollection: () => {},
    theme,
    setTheme
      };

      // Load saved game stats
      const savedStats = localStorage.getItem('flagQuizStats');
      if (savedStats) {
        try {
          const loadedStats = JSON.parse(savedStats);
          // Ensure backward compatibility for skipped field
          gameStats = {
            correct: loadedStats.correct || 0,
            wrong: loadedStats.wrong || 0,
            total: loadedStats.total || 0,
            skipped: loadedStats.skipped || 0
          };
        } catch (e) {
          console.error('Error loading game stats:', e);
        }
      }

      // Load wrong answers tracking
      const savedWrongAnswers = localStorage.getItem('flagQuizWrongAnswers');
      if (savedWrongAnswers) {
        try {
          const loadedWrongAnswers = JSON.parse(savedWrongAnswers);
          wrongAnswers = new Map(Object.entries(loadedWrongAnswers));
        } catch (e) {
          console.error('Error loading wrong answers:', e);
        }
      }

      // Load correct answers tracking
      const savedCorrectAnswers = localStorage.getItem('flagQuizCorrectAnswers');
      if (savedCorrectAnswers) {
        try {
          const loadedCorrectAnswers = JSON.parse(savedCorrectAnswers);
          correctAnswers = new Map(Object.entries(loadedCorrectAnswers));
        } catch (e) {
          console.error('Error loading correct answers:', e);
        }
      }

      // Load settings
      const savedSettings = localStorage.getItem('flagQuizSettings');
      if (savedSettings) {
        try {
          const settings = JSON.parse(savedSettings);
          autoAdvance = settings.autoAdvance !== undefined ? settings.autoAdvance : true;
          focusWrongAnswers = settings.focusWrongAnswers !== undefined ? settings.focusWrongAnswers : false;
          reduceCorrectAnswers = settings.reduceCorrectAnswers !== undefined ? settings.reduceCorrectAnswers : false;
        } catch (e) {
          console.error('Error loading settings:', e);
        }
      }
    }

  await loadFlags();
  settingsLoaded = true;
  generateQuestion();
  });

  function applyTheme(theme) {
    let effectiveTheme = theme;
    if (theme === 'system') {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', effectiveTheme);
    document.documentElement.className = effectiveTheme;
  }

  async function loadFlags() {
    try {
      const response = await fetch('/data/flags.json');
      const data = await response.json();
      // Filter for only country flags (has "Country" tag) and ensure we have country name
      flags = data.filter(flag =>
        !flag.disable &&
        flag.meta?.country &&
        flag.tags &&
        flag.tags.includes('Country')
      );

      // Remove duplicates based on country name
      const uniqueFlags = [];
      const seenCountries = new Set();

      for (const flag of flags) {
        const countryName = flag.meta.country.toLowerCase().trim();
        if (!seenCountries.has(countryName)) {
          seenCountries.add(countryName);
          uniqueFlags.push(flag);
        }
      }

      flags = uniqueFlags;
      console.log(`Loaded ${flags.length} unique country flags for quiz`);
    } catch (error) {
      console.error('Error loading flags:', error);
      flags = [];
    }
  }

  function generateQuestion() {
    if (flags.length < 4) {
      console.error('Not enough flags to generate question');
      return;
    }

  gameState = 'question';
  showResult = false;
  selectedAnswer = null;
  correctAnswer = null;
  answered = false;
  showCountryInfo = false;
  showResultCountryInfo = false;

    // Randomly choose question type
    questionType = Math.random() < 0.5 ? 'flag-to-country' : 'country-to-flag';

    // Pick correct answer with adaptive learning settings
    let correctFlag;

    // Simple fallback to avoid uninitialized variable errors
    if (settingsLoaded && (focusWrongAnswers || reduceCorrectAnswers)) { // Re-enable adaptive learning
      // Create weighted array based on learning settings
      const weightedFlags = [];
      for (const flag of flags) {
        const wrongCount = wrongAnswers.get(flag.name) || 0;
        const correctCount = correctAnswers.get(flag.name) || 0;

        let weight = 1; // Base weight

        // Increase weight for flags with wrong answers (if setting enabled)
        if (focusWrongAnswers && wrongCount > 0) {
          weight = Math.min(wrongCount + 1, 4); // Max 4x weight for wrong answers
        }

        // Decrease weight for flags with correct answers (if setting enabled)
        if (reduceCorrectAnswers && correctCount > 0) {
          weight = weight / Math.min(correctCount + 1, 4); // Reduce weight, min 0.25x
        }

        // Add flag to weighted array based on calculated weight
        const finalWeight = Math.max(0.25, weight); // Minimum weight to ensure variety
        const timesToAdd = Math.ceil(finalWeight);
        for (let i = 0; i < timesToAdd; i++) {
          weightedFlags.push(flag);
        }
      }

      if (weightedFlags.length > 0) {
        correctFlag = weightedFlags[Math.floor(Math.random() * weightedFlags.length)];
      } else {
        correctFlag = flags[Math.floor(Math.random() * flags.length)];
      }
    } else {
      // Normal random selection
      correctFlag = flags[Math.floor(Math.random() * flags.length)];
    }

    const correctCountry = getCountryName(correctFlag).toLowerCase();

    // Generate 3 wrong answers ensuring no duplicate country names
    const wrongOptions = [];
    const usedCountries = new Set([correctCountry]);

    while (wrongOptions.length < 3 && wrongOptions.length < flags.length - 1) {
      const randomFlag = flags[Math.floor(Math.random() * flags.length)];
      const randomCountry = getCountryName(randomFlag).toLowerCase();

      if (!usedCountries.has(randomCountry)) {
        wrongOptions.push(randomFlag);
        usedCountries.add(randomCountry);
      }
    }

    // If we couldn't find 3 unique countries, fill with random flags
    while (wrongOptions.length < 3) {
      const randomFlag = flags[Math.floor(Math.random() * flags.length)];
      if (randomFlag !== correctFlag && !wrongOptions.includes(randomFlag)) {
        wrongOptions.push(randomFlag);
      }
    }

    // Combine correct and wrong answers
    const allOptions = [correctFlag, ...wrongOptions].sort(() => Math.random() - 0.5);    currentQuestion = {
      type: questionType,
      correct: correctFlag,
      options: allOptions,
      correctIndex: allOptions.indexOf(correctFlag)
    };

    console.log('Generated question:', currentQuestion);
  }  function selectAnswer(index) {
    if (gameState !== 'question') return;

    selectedAnswer = index;
    correctAnswer = currentQuestion.correctIndex;
  showResult = true;
  gameState = 'answered';
  answered = true;

    // Update score
    score.total++;
    const isCorrect = index === correctAnswer;
    if (isCorrect) {
      score.correct++;
      gameStats.correct++;
      currentStreak++;

      // Track correct answer for this flag
      if (currentQuestion.correct?.name) {
        const flagName = currentQuestion.correct.name;
        correctAnswers.set(flagName, (correctAnswers.get(flagName) || 0) + 1);
        // Save correct answers to localStorage
        localStorage.setItem('flagQuizCorrectAnswers', JSON.stringify(Object.fromEntries(correctAnswers)));
      }

      // Track continent progress for correct answers
      if (achievementsComponent && currentQuestion.correct?.tags) {
        const continent = currentQuestion.correct.tags.find(tag =>
          ['Europe', 'Asia', 'Africa', 'North America', 'South America', 'Oceania'].includes(tag)
        );
        if (continent) {
          achievementsComponent.incrementContinentProgress(continent);
        }
      }

      // Reset consecutive skips on correct answer
      if (achievementsComponent) {
        achievementsComponent.resetConsecutiveSkips();
      }
    } else {
      gameStats.wrong++;
      currentStreak = 0; // Reset streak on wrong answer

      // Track wrong answer for this flag
      if (currentQuestion.correct?.name) {
        const flagName = currentQuestion.correct.name;
        wrongAnswers.set(flagName, (wrongAnswers.get(flagName) || 0) + 1);
        // Save wrong answers to localStorage
        localStorage.setItem('flagQuizWrongAnswers', JSON.stringify(Object.fromEntries(wrongAnswers)));
      }

      if (achievementsComponent) {
        achievementsComponent.resetConsecutiveSkips();
      }
    }
    gameStats.total++;

    // Save stats to localStorage
    localStorage.setItem('flagQuizStats', JSON.stringify(gameStats));

    // Check for new achievements
    if (achievementsComponent) {
      achievementsComponent.checkAchievements();
    }

    // Auto-advance to next question with different delays if auto mode is on
    if (autoAdvance) {
      const delay = isCorrect ? 2000 : 4000; // Double delay for wrong answers
      setTimeout(() => {
        generateQuestion();
      }, delay);
    }
  }  function skipQuestion() {
    if (gameState !== 'question') return;

    // Update skip counters
    score.skipped++;
    gameStats.skipped++;
    gameStats.total++;

    // Track consecutive skips for Speed Runner achievement
    if (achievementsComponent) {
      achievementsComponent.incrementConsecutiveSkips();
    }

    // Check for achievements
    if (achievementsComponent) {
      achievementsComponent.checkAchievements();
    }

    // Save stats to localStorage
    localStorage.setItem('flagQuizStats', JSON.stringify(gameStats));

    // Move to next question immediately
    generateQuestion();
  }

  function resetGame() {
    score = { correct: 0, total: 0, skipped: 0 };
    generateQuestion();
  }

  function resetStats() {
    gameStats = { correct: 0, wrong: 0, total: 0, skipped: 0 };
    localStorage.setItem('flagQuizStats', JSON.stringify(gameStats));
  }

  function saveSettings() {
    const settings = { autoAdvance };
    localStorage.setItem('flagQuizSettings', JSON.stringify(settings));
  }

  function toggleSettings() {
    showSettings = !showSettings;
  }

  function handleOverlayClick(event) {
    if (event.target === event.currentTarget) {
      toggleSettings();
    }
  }

  function handleOverlayKeydown(event) {
    if (event.key === 'Escape') {
      toggleSettings();
    }
  }

  function resetAllStats() {
    showResetConfirmation = true;
  }

  function confirmReset() {
    // Reset game statistics
    gameStats = { correct: 0, wrong: 0, total: 0, skipped: 0 };
    score = { correct: 0, total: 0, skipped: 0 };
    currentStreak = 0;
    localStorage.setItem('flagQuizStats', JSON.stringify(gameStats));

    // Reset wrong answers tracking
    wrongAnswers = new Map();
    localStorage.removeItem('flagQuizWrongAnswers');

    // Reset correct answers tracking
    correctAnswers = new Map();
    localStorage.removeItem('flagQuizCorrectAnswers');

    // Reset achievements
    if (achievementsComponent) {
      localStorage.removeItem('flagQuizAchievements');
      // Reinitialize achievements component
      achievementsComponent.loadAchievements();
      updateAchievementCount();
    }

    showResetConfirmation = false;
    showSettings = false;
  }

  function cancelReset() {
    showResetConfirmation = false;
  }

  function nextQuestion() {
    generateQuestion();
  }

  function getCountryName(flag) {
    return flag.meta?.country || flag.name || 'Unknown';
  }

  function getFlagImage(flag) {
    return `/images/flags/${flag.path}`;
  }

  function updateAchievementCount() {
    if (achievementsComponent) {
      achievementCount = achievementsComponent.getAchievementCount();
    }
  }

  function handleAchievementsUnlocked() {
    updateAchievementCount();
  }
</script>

<svelte:head>
  <title>Flag Quiz</title>
</svelte:head>

<Header
  {theme}
  {setTheme}
  {score}
  {gameStats}
  {achievementCount}
  onAchievementClick={() => showAchievements = true}
/>

<main class="flag-quiz">
  <div class="container">


  <!-- Settings Popup -->
  {#if showSettings}
    <div
      class="settings-overlay"
      on:click={handleOverlayClick}
      tabindex="0"
      role="button"
      aria-label="Close settings (click background or press Escape)"
      on:keydown={handleOverlayKeydown}
    >
      <div
        class="settings-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
      >
        <div class="settings-header">
          <InlineSvg path="/icons/settings.svg" alt="Settings" />
          <h2 id="settings-title">Game Settings</h2>
          <button class="close-btn" on:click={toggleSettings}>✕</button>
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
              Focus on previously answered incorrectly flags
            </label>
          </div>

          <div class="setting-item">
            <label>
              <input
                type="checkbox"
                bind:checked={reduceCorrectAnswers}
              />
              Show correctly answered flags less frequently
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

  <!-- Reset Confirmation Dialog -->
  {#if showResetConfirmation}
    <div
      class="confirmation-overlay"
      role="button"
      tabindex="0"
      aria-label="Close confirmation dialog (click background or press Escape)"
      on:click={(e) => e.target === e.currentTarget && cancelReset()}
      on:keydown={(e) => {
        if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
          cancelReset();
        }
      }}
    >
      <div class="confirmation-dialog">
        <div class="confirmation-header">
          <h3>⚠️ Reset All Data</h3>
        </div>
        <div class="confirmation-content">
          <p>This action will permanently delete:</p>
          <ul>
            <li>✗ All game statistics (correct, wrong, skipped answers)</li>
            <li>✗ Current session score</li>
            <li>✗ All unlocked achievements</li>
            <li>✗ Achievement progress</li>
            <li>✗ Wrong answer tracking data</li>
          </ul>
          <p><strong>This cannot be undone!</strong></p>
        </div>
        <div class="confirmation-actions">
          <button class="cancel-btn" on:click={cancelReset}>Cancel</button>
          <button class="confirm-btn" on:click={confirmReset}>Reset Everything</button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Achievements Component -->
  <Achievements
    bind:this={achievementsComponent}
    {gameStats}
    {currentStreak}
    show={showAchievements}
    on:close={() => showAchievements = false}
    on:achievementsUnlocked={handleAchievementsUnlocked}
  />
    {#if gameState === 'loading'}
      <div class="loading">Loading flags...</div>
    {:else if currentQuestion}
      <div class="question-container">
        <div class="question-header">
          <div class="question-number">Question {score.total + 1}</div>
          <div class="question-type">
            {currentQuestion.type === 'flag-to-country' ? 'Which country does this flag belong to?' : 'Which flag belongs to this country?'}
          </div>
        </div>

        <!-- Fixed height result area -->
        <div class="result-area">
          {#if showResult}
            <div class="result">
              {#if selectedAnswer === correctAnswer}
                <div class="correct-result"><span class="result-icon smile-icon"><InlineSvg path="/icons/smile-squre.svg" alt="Correct" /></span> Correct!</div>
              {:else}
                <div class="wrong-result">
                  <span class="result-icon sad-icon"><InlineSvg path="/icons/sad-square.svg" alt="Wrong" /></span> Wrong!
                  {#if currentQuestion.type === 'flag-to-country'}
                    <span class="result-country-info">
                      The correct answer is: {getCountryName(currentQuestion.correct)}.
                      <button
                        class="info-icon result-info-btn"
                        aria-label="Show country info"
                        aria-expanded={showResultCountryInfo}
                        on:click={() => (showResultCountryInfo = !showResultCountryInfo)}
                        on:keydown={(e) => { if (e.key === 'Escape') showResultCountryInfo = false; }}
                      >
                        <InlineSvg path="/icons/info-square.svg" alt="Country info" />
                      </button>
                      {#if showResultCountryInfo}
                        <div class="info-tooltip result-info-tooltip" role="dialog" aria-live="polite">
                          {currentQuestion.correct.meta.description}
                        </div>
                      {/if}
                    </span>
                  {:else}
                    You selected the {getCountryName(currentQuestion.options[selectedAnswer])} flag.
                  {/if}
                </div>
              {/if}
            </div>
          {/if}
        </div>

  {#if currentQuestion.type === 'flag-to-country'}
          <div class="flag-display">
            <img src={getFlagImage(currentQuestion.correct)} alt="Flag" class="quiz-flag" />
          </div>

          <div class="options">
            {#each currentQuestion.options as option, index}
              <button
                class="option"
                class:selected={selectedAnswer === index}
                class:correct={showResult && index === correctAnswer}
                class:wrong={showResult && selectedAnswer === index && index !== correctAnswer}
                on:click={() => selectAnswer(index)}
                disabled={gameState === 'answered'}
              >
                {getCountryName(option)}
              </button>
            {/each}
          </div>
  {:else}
          <div class="country-display">
            <h2 class="country-name">
              {getCountryName(currentQuestion.correct)}
              {#if currentQuestion.correct?.meta?.description}
                <button
                  class="info-icon"
                  aria-label="Show country info"
                  aria-expanded={showCountryInfo}
                  on:click={() => (showCountryInfo = !showCountryInfo)}
                  on:keydown={(e) => { if (e.key === 'Escape') showCountryInfo = false; }}
                >
                  <InlineSvg path="/icons/info-square.svg" alt="Country info" />
                </button>
                {#if showCountryInfo}
                  <div class="info-tooltip" role="dialog" aria-live="polite">
                    {currentQuestion.correct.meta.description}
                  </div>
                {/if}
              {/if}
            </h2>
          </div>

          <div class="flag-options">
            {#each currentQuestion.options as option, index}
              <button
                class="flag-option"
                class:selected={selectedAnswer === index}
                class:correct={showResult && index === correctAnswer}
                class:wrong={showResult && selectedAnswer === index && index !== correctAnswer}
                on:click={() => selectAnswer(index)}
                disabled={gameState === 'answered'}
              >
                <img src={getFlagImage(option)} alt={getCountryName(option)} class="option-flag" />
              </button>
            {/each}
          </div>
        {/if}

        {#if gameState === 'question'}
          <button class="btn btn-skip btn-next-full" on:click={skipQuestion}>Skip Question</button>
        {:else if !autoAdvance && gameState === 'answered'}
          <button class="btn btn-primary btn-next-full" on:click={nextQuestion}>Next Question →</button>
        {/if}
      </div>
    {/if}

    <div class="controls">
      <a href="#/game" class="btn btn-secondary">Back to Games</a>
      <button class="btn btn-secondary" on:click={resetGame}>New Session</button>
      <button class="btn btn-secondary" on:click={toggleSettings} title="Settings">Settings</button>
    </div>
</main>

<Footer />

<style>
  .flag-quiz {
    min-height: 100vh;
    background: var(--color-bg-primary);
    color: var(--color-text-primary);
  }

  .container {
    max-width: 800px;
    margin: 0 auto;
    padding: 1.25rem 1rem;
  }

  /* Removed header-top/settings-btn styles; settings now lives in controls */

  .settings-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .settings-modal {
    background: var(--color-bg-secondary);
    border: 2px solid var(--color-border);
    border-radius: 1rem;
    padding: 0;
    max-width: 500px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 10px 24px rgba(0,0,0,0.25);
  }

  .settings-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 2px solid var(--color-border);
  }

  .settings-header :global(.svg-wrapper) {
    width: 24px;
    height: 24px;
    display: inline-flex;
    flex-shrink: 0;
  }

  .settings-header h2 {
    margin: 0;
    color: var(--color-text-primary);
  }
  .close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--color-text-primary);
    padding: 0.25rem;
    border-radius: 0.25rem;
    transition: background-color 0.3s ease;
  }

  .close-btn:hover {
    background-color: var(--color-border);
  }

  .settings-content {
    padding: 1.5rem;
  }

  .setting-item {
    margin-bottom: 1.5rem;
  }

  .setting-item label {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 1rem;
    color: var(--color-text-primary);
    cursor: pointer;
  }

  .setting-item input[type="checkbox"] {
    width: 1.2rem;
    height: 1.2rem;
    cursor: pointer;
  }

  .setting-actions {
    border-top: 2px solid var(--border-color);
    padding-top: 1.5rem;
    text-align: center;
  }

  .reset-stats-btn {
    background: #ff4444;
    color: white;
    border: none;
    border-radius: 0.5rem;
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.3s ease;
  }

  .reset-stats-btn:hover {
    background: #cc3333;
  }

  /* Confirmation Dialog Styles */
  .confirmation-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1001;
  }

  .confirmation-dialog {
    background: var(--color-bg-primary);
    border: 2px solid var(--color-border);
    border-radius: 1rem;
    padding: 0;
    max-width: 500px;
    width: 90%;
    box-shadow: 0 10px 24px rgba(0,0,0,0.25);
  }

  .confirmation-header {
    padding: 1.5rem 1.5rem 1rem 1.5rem;
    border-bottom: 1px solid var(--color-border);
  }

  .confirmation-header h3 {
    margin: 0;
    font-size: 1.3rem;
    color: #dc2626;
  }

  .confirmation-content {
    padding: 1.5rem;
  }

  .confirmation-content p {
    margin: 0 0 1rem 0;
    color: var(--color-text-primary);
  }

  .confirmation-content ul {
    margin: 1rem 0;
    padding-left: 1.5rem;
    color: var(--color-text-secondary);
  }

  .confirmation-content li {
    margin: 0.5rem 0;
  }

  .confirmation-actions {
    display: flex;
    gap: 1rem;
    padding: 1rem 1.5rem 1.5rem 1.5rem;
    justify-content: flex-end;
    border-top: 1px solid var(--color-border);
  }

  .cancel-btn {
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    color: var(--color-text-primary);
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .cancel-btn:hover {
    background: var(--color-bg-hover);
    border-color: var(--color-primary);
  }

  .confirm-btn {
    background: #dc2626;
    border: 1px solid #dc2626;
    color: white;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .confirm-btn:hover {
    background: #b91c1c;
    border-color: #b91c1c;
  }


  .loading {
    text-align: center;
    font-size: 1.5rem;
    color: var(--color-text-secondary);
    margin: 3rem 0;
  }

  .question-container {
    background: var(--color-bg-secondary);
    border-radius: 16px;
    padding: 2rem;
    margin-bottom: 1rem;
    border: 1px solid var(--color-border);
  }

  .question-header {
    text-align: center;
    margin-bottom: 1rem;
  }

  .question-number {
    font-size: 0.9rem;
    color: var(--color-text-secondary);
    margin-bottom: 0.5rem;
  }

  .question-type {
    font-size: 1.3rem;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .result-area {
    min-height: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1rem;
  }

  .flag-display {
    text-align: center;
    margin-bottom: 2rem;
  }

  .quiz-flag {
    width: 400px;
    height: auto;
    /* max-height: 240px; */
    object-fit: contain;
    border: 2px solid var(--color-border);
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    padding: 1rem;
  }

  .country-display {
    text-align: center;
    margin-bottom: 2rem;
  position: relative;
  }

  .country-name {
    font-size: 2rem;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0;
  }

  .info-icon {
    margin-left: 0.5rem;
    width: 2rem;
    height: 2rem;
    vertical-align: middle;
    background: none;
    color: var(--color-text-primary);
    cursor: pointer;
    padding: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 5px;
  }

  .info-icon :global(.svg-wrapper) {
    width: 100%;
    height: 100%;
  }

  .info-icon:hover,
  .info-icon:focus {
    color: var(--color-text-primary);
    border-color: var(--color-border);
    outline: none;
  }

  .info-tooltip {
    position: absolute;
    left: 50%;
    top: calc(100% + 8px);
    transform: translateX(-50%);
    background: var(--color-bg-secondary);
    color: var(--color-text-primary);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: 0.75rem 1rem;
    width: min(90vw, 520px);
    max-height: 40vh;
    overflow: auto;
    box-shadow: 0 8px 20px rgba(0,0,0,0.2);
    z-index: 5;
    text-align: left;
    font-size: 0.95rem;
  }

  .options {
    display: grid;
    gap: 1rem;
    grid-template-columns: 1fr 1fr;
  }

  .option {
    background: var(--color-bg-primary);
    border: 2px solid var(--color-border);
    border-radius: 8px;
    padding: 1rem;
    font-size: 1.1rem;
    color: var(--color-text-primary);
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .option:hover:not(:disabled) {
    border-color: var(--color-primary);
    background: var(--color-bg-hover);
  }

  .option.selected {
    border-color: var(--color-primary);
    background: var(--color-primary-light);
  }

  .option.correct {
    border-color: #22c55e;
    background: #22c55e;
    color: white;
  }

  .option.wrong {
    border-color: #ef4444;
    background: #ef4444;
    color: white;
  }

  .flag-options {
    display: grid;
    gap: 1rem;
    grid-template-columns: 1fr 1fr;
  }

  .flag-option {
    background: var(--color-bg-primary);
    border: 2px solid var(--color-border);
    border-radius: 8px;
    padding: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
    /* aspect-ratio: 3/2; */
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .flag-option:hover:not(:disabled) {
    border-color: var(--color-primary);
    background: var(--color-bg-hover);
  }

  .flag-option.selected {
    border-color: var(--color-primary);
    background: var(--color-primary-light);
  }

  .flag-option.correct {
    border-color: #22c55e;
    background: #22c55e;
  }

  .flag-option.wrong {
    border-color: #ef4444;
    background: #ef4444;
  }

  .option-flag {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    border-radius: 4px;
  }

  .result {
    text-align: center;
    font-size: 1.2rem;
    font-weight: 600;
  }

  .correct-result {
    color: #22c55e;
  }

  .wrong-result {
    color: #ef4444;
  }

  .result-icon {
    display: inline-flex;
    width: 24px;
    height: 24px;
    vertical-align: middle;
    margin-right: 0.5rem;
  }

  .result-icon.smile-icon {
    color: #22c55e; /* green for correct */
    animation: correctBounce 0.6s ease-out;
  }

  .result-icon.sad-icon {
    color: #ef4444; /* red for wrong */
    animation: wrongShake 0.5s ease-in-out;
  }

  @keyframes correctBounce {
    0% {
      transform: scale(0) rotate(0deg);
      opacity: 0;
    }
    50% {
      transform: scale(1.3) rotate(5deg);
      opacity: 1;
    }
    100% {
      transform: scale(1) rotate(0deg);
      opacity: 1;
    }
  }

  @keyframes wrongShake {
    0% {
      transform: translateX(0) scale(0);
      opacity: 0;
    }
    25% {
      transform: translateX(-5px) scale(1);
      opacity: 1;
    }
    50% {
      transform: translateX(5px) scale(1);
    }
    75% {
      transform: translateX(-3px) scale(1);
    }
    100% {
      transform: translateX(0) scale(1);
      opacity: 1;
    }
  }

  .result-country-info {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }

  .result-info-btn {
    margin-left: 0.25rem;
    width: 2rem;
    height: 2rem;
    vertical-align: middle;
    background: none;
    border: none;
    color: var(--color-text-primary);
    cursor: pointer;
    padding: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    opacity: 0.7;
    transition: opacity 0.2s;
  }

  .result-info-btn:hover,
  .result-info-btn:focus {
    opacity: 1;
    outline: none;
  }

  .result-info-tooltip {
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    margin-top: 0.5rem;
    min-width: 200px;
    max-width: 300px;
  }

  .controls {
    display: flex;
    justify-content: center;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    text-decoration: none;
    display: inline-block;
    transition: all 0.3s ease;
  }

  .btn-primary {
    background: var(--color-primary);
    color: white;
  }

  .btn-primary:hover {
    background: var(--color-primary-dark);
  }

  .btn-next-full {
    display: block;
    width: 100%;
    margin-top: 1rem;
    text-align: center;
  }

  .btn-secondary {
    background: var(--color-bg-secondary);
    color: var(--color-text-primary);
    border: 1px solid var(--color-border);
  }

  .btn-secondary:hover {
    background: var(--color-bg-hover);
  }

  .btn-skip {
    background: var(--color-text-secondary);
    color: var(--color-bg-primary);
    opacity: 0.8;
  }

  .btn-skip:hover {
    opacity: 1;
    background: var(--color-text-primary);
  }

  @media (max-width: 768px) {
    .container {
      padding: 0.75rem;
      padding-top: 0.75rem;
    }

    .options {
      grid-template-columns: 1fr;
    }

    /* Keep 2x2 grid for Country-to-Flag on mobile */
    .flag-options {
      grid-template-columns: 1fr 1fr;
    }

    .quiz-flag {
      width: 300px;
      max-height: 180px;
    }

    .info-tooltip {
      width: 92vw;
      left: 50%;
      transform: translateX(-50%);
    }

    .controls {
      flex-direction: row;
      flex-wrap: nowrap;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      justify-content: center;
    }
  }
</style>
