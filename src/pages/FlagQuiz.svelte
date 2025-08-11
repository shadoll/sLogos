<script>
  import { onMount } from 'svelte';
  import Header from '../components/Header.svelte';

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

  // Scoring
  let score = { correct: 0, total: 0, skipped: 0 };
  let gameStats = { correct: 0, wrong: 0, total: 0, skipped: 0 };

  // Settings
  let autoAdvance = true;
  let showSettings = false;
  let settingsLoaded = false;

  // Theme
  let theme = 'system';

  function setTheme(t) {
    localStorage.setItem('theme', t);
    applyTheme(t);
    theme = t;
  }

  // Save settings when they change (after initial load)
  $: if (settingsLoaded) {
    localStorage.setItem('flagQuizSettings', JSON.stringify({ autoAdvance }));
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

      // Load settings
      const savedSettings = localStorage.getItem('flagQuizSettings');
      if (savedSettings) {
        try {
          const settings = JSON.parse(savedSettings);
          autoAdvance = settings.autoAdvance !== undefined ? settings.autoAdvance : true;
        } catch (e) {
          console.error('Error loading settings:', e);
        }
      }
    }

  await loadFlags();
  generateQuestion();
  settingsLoaded = true;
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

    // Randomly choose question type
    questionType = Math.random() < 0.5 ? 'flag-to-country' : 'country-to-flag';

    // Pick a random correct answer
    const correctFlag = flags[Math.floor(Math.random() * flags.length)];
    const correctCountry = getCountryName(correctFlag).toLowerCase();

    // Generate 3 wrong answers ensuring no duplicate country names
    const wrongAnswers = [];
    const usedCountries = new Set([correctCountry]);

    while (wrongAnswers.length < 3 && wrongAnswers.length < flags.length - 1) {
      const randomFlag = flags[Math.floor(Math.random() * flags.length)];
      const randomCountry = getCountryName(randomFlag).toLowerCase();

      if (randomFlag !== correctFlag &&
          !wrongAnswers.includes(randomFlag) &&
          !usedCountries.has(randomCountry)) {
        wrongAnswers.push(randomFlag);
        usedCountries.add(randomCountry);
      }
    }

    // Ensure we have enough options
    if (wrongAnswers.length < 3) {
      console.warn(`Only found ${wrongAnswers.length + 1} unique countries, regenerating...`);
      // Try again
      generateQuestion();
      return;
    }

    // Shuffle all options
    const allOptions = [correctFlag, ...wrongAnswers].sort(() => Math.random() - 0.5);

    currentQuestion = {
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
    } else {
      gameStats.wrong++;
    }
    gameStats.total++;

    // Save stats to localStorage
    localStorage.setItem('flagQuizStats', JSON.stringify(gameStats));

    // Auto-advance to next question with different delays if auto mode is on
    if (autoAdvance) {
      const delay = isCorrect ? 2000 : 4000; // Double delay for wrong answers
      setTimeout(() => {
        generateQuestion();
      }, delay);
    }
  }

  function skipQuestion() {
    if (gameState !== 'question') return;

    // Update skip counters
    score.skipped++;
    gameStats.skipped++;
    gameStats.total++;

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
    gameStats = { correct: 0, wrong: 0, skipped: 0 };
    score = { correct: 0, total: 0, skipped: 0 };
    localStorage.setItem('flagQuizStats', JSON.stringify(gameStats));
    showSettings = false;
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
</script>

<Header {theme} {setTheme} {score} {gameStats} />

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
          <h2 id="settings-title">⚙️ Game Settings</h2>
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

          <div class="setting-actions">
            <button class="reset-stats-btn" on:click={resetAllStats}>
              Reset All Statistics
            </button>
          </div>
        </div>
      </div>
    </div>
  {/if}
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
                <div class="correct-result">✅ Correct!</div>
              {:else}
                <div class="wrong-result">
                  ❌ Wrong!
                  {#if currentQuestion.type === 'flag-to-country'}
                    The correct answer is: {getCountryName(currentQuestion.correct)}.
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
            <h2 class="country-name">{getCountryName(currentQuestion.correct)}</h2>
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
      <button class="btn btn-secondary" on:click={resetGame}>New Session</button>
      <button class="btn btn-secondary" on:click={toggleSettings} title="Settings">Settings</button>
      <a href="#/game" class="btn btn-primary">Back to Games</a>
    </div>
</main>

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
  }

  .country-name {
    font-size: 2rem;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0;
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

    .controls {
      flex-direction: row;
      flex-wrap: nowrap;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      justify-content: center;
    }
  }
</style>
