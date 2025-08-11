<script>
  import { onMount } from 'svelte';
  import Header from '../components/Header.svelte';
  import Footer from '../components/Footer.svelte';
  import InlineSvg from '../components/InlineSvg.svelte';
  import Achievements from '../components/Achievements.svelte';
  import QuizSettings from '../components/QuizSettings.svelte';
  import WelcomeStats from '../components/WelcomeStats.svelte';

  // Game data
  let flags = [];
  let currentQuestion = null;
  let questionType = 'flag-to-country'; // 'flag-to-country' or 'country-to-flag'

  // Question and answer arrays
  let currentCountryOptions = [];
  let currentFlagOptions = [];
  let correctAnswer = '';

  // Game states
  let gameState = 'welcome'; // 'welcome', 'loading', 'question', 'answered', 'session-complete'
  let quizSubpage = 'welcome'; // 'welcome' or 'quiz'
  let selectedAnswer = null;
  let answered = false;
  let isAnswered = false;
  let resultMessage = '';
  let showResult = false;
  let timeoutId = null;
  let showCountryInfo = false;
  let showResultCountryInfo = false;

  // Auto-advance timer variables
  let autoAdvanceTimer = null;
  let timerProgress = 0;
  let timerDuration = 2000; // 2 seconds
  let timerStartTime = 0;

  // Force component re-render key to prevent button state persistence
  let questionKey = 0;

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
  let soundEnabled = true;
  let sessionLength = 10;

  // Session management
  let currentSessionQuestions = 0;
  let sessionStats = { correct: 0, wrong: 0, skipped: 0, total: 0, sessionLength: 10 };
  let showSessionResults = false;
  let sessionInProgress = false;
  let sessionStartTime = null;
  let sessionRestoredFromReload = false; // Track if session was restored from page reload

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
    localStorage.setItem('flagQuizSettings', JSON.stringify({ autoAdvance, focusWrongAnswers, reduceCorrectAnswers, soundEnabled, sessionLength }));
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
          soundEnabled = settings.soundEnabled !== undefined ? settings.soundEnabled : true;
          sessionLength = settings.sessionLength !== undefined ? settings.sessionLength : 10;
        } catch (e) {
          console.error('Error loading settings:', e);
        }
      }
    }

  await loadFlags();
  settingsLoaded = true;

  // Load or initialize session
  loadSessionState();
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

  function saveSessionState() {
    const sessionState = {
      sessionInProgress,
      currentSessionQuestions,
      sessionStats,
      score,
      currentQuestion,
      selectedAnswer,
      showResult,
      gameState,
      quizSubpage,
      sessionStartTime,
      questionKey
    };
    localStorage.setItem('flagQuizSessionState', JSON.stringify(sessionState));
  }

  function loadSessionState() {
    const savedState = localStorage.getItem('flagQuizSessionState');
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        if (state.sessionInProgress) {
          // Restore session
          sessionInProgress = state.sessionInProgress;
          currentSessionQuestions = state.currentSessionQuestions || 0;
          sessionStats = state.sessionStats || { correct: 0, wrong: 0, skipped: 0, total: 0, sessionLength };
          score = state.score || { correct: 0, total: 0, skipped: 0 };
          currentQuestion = state.currentQuestion;
          selectedAnswer = state.selectedAnswer;
          showResult = state.showResult || false;
          gameState = state.gameState || 'question';
          quizSubpage = 'quiz';
          sessionStartTime = state.sessionStartTime;
          questionKey = state.questionKey || 0;

          // Mark that session was restored from reload
          sessionRestoredFromReload = true;

          // If we don't have a current question, generate one
          if (!currentQuestion) {
            generateQuestion();
          }
        } else {
          // No active session, show welcome page
          quizSubpage = 'welcome';
          gameState = 'welcome';
        }
      } catch (e) {
        console.error('Error loading session state:', e);
        quizSubpage = 'welcome';
        gameState = 'welcome';
      }
    } else {
      // No saved state, show welcome page
      quizSubpage = 'welcome';
      gameState = 'welcome';
    }
  }

  function clearSessionState() {
    localStorage.removeItem('flagQuizSessionState');
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

    // Cancel any active auto-advance timer
    cancelAutoAdvanceTimer();

    // Increment question key to force complete re-render and clear button states
    questionKey++;

    // Remove focus from any previously focused buttons and ensure clean state
    if (typeof document !== 'undefined') {
      // Use setTimeout to ensure DOM updates are complete
      setTimeout(() => {
        const activeElement = document.activeElement;
        if (activeElement && activeElement.tagName === 'BUTTON') {
          activeElement.blur();
        }
        // Force removal of any residual button states
        const buttons = document.querySelectorAll('.option, .flag-option');
        buttons.forEach(button => {
          button.blur();
          button.classList.remove('selected', 'correct', 'wrong');
        });
      }, 0);
    }

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

    // Save session state
    saveSessionState();
  }  function selectAnswer(index) {
    if (gameState !== 'question') return;

    selectedAnswer = index;
    correctAnswer = currentQuestion.correctIndex;
  showResult = true;
  gameState = 'answered';
  answered = true;

    // Update score
    score.total++;
    currentSessionQuestions++;
    sessionStats.total++;

    const isCorrect = index === correctAnswer;
    if (isCorrect) {
      score.correct++;
      gameStats.correct++;
      sessionStats.correct++;
      currentStreak++;

      // Play correct sound
      playCorrectSound();

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
      sessionStats.wrong++;
      currentStreak = 0; // Reset streak on wrong answer

      // Play wrong sound
      playWrongSound();

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

    // Save session state
    saveSessionState();

    // Check if session is complete
    if (currentSessionQuestions >= sessionLength) {
      // Session complete - show results and return to welcome page
      gameState = 'session-complete';
      sessionStats.sessionLength = sessionLength;

      if (autoAdvance) {
        const delay = isCorrect ? 2000 : 4000;
        setTimeout(() => {
          endSession();
        }, delay);
      } else {
        // Show session complete state immediately
        endSession();
      }
      return;
    }

    // Auto-advance to next question with different delays if auto mode is on
    if (autoAdvance) {
      const delay = isCorrect ? 2000 : 4000; // Double delay for wrong answers
      startAutoAdvanceTimer(delay);
    }
  }  function skipQuestion() {
    if (gameState !== 'question') return;

    // Update skip counters
    score.skipped++;
    gameStats.skipped++;
    gameStats.total++;
    currentSessionQuestions++;
    sessionStats.skipped++;
    sessionStats.total++;

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

    // Save session state
    saveSessionState();

    // Check if session is complete
    if (currentSessionQuestions >= sessionLength) {
      gameState = 'session-complete';
      sessionStats.sessionLength = sessionLength;
      endSession();
      return;
    }

    // Move to next question immediately
    generateQuestion();
  }

  function startAutoAdvanceTimer(duration) {
    timerDuration = duration;
    timerProgress = 0;
    timerStartTime = Date.now();

    // Clear any existing timer
    if (autoAdvanceTimer) {
      clearInterval(autoAdvanceTimer);
    }

    // Update progress every 50ms for smooth animation
    autoAdvanceTimer = setInterval(() => {
      const elapsed = Date.now() - timerStartTime;
      timerProgress = Math.min((elapsed / duration) * 100, 100);

      if (timerProgress >= 100) {
        clearInterval(autoAdvanceTimer);
        autoAdvanceTimer = null;
        timerProgress = 0;
        generateQuestion();
      }
    }, 50);
  }

  function cancelAutoAdvanceTimer() {
    if (autoAdvanceTimer) {
      clearInterval(autoAdvanceTimer);
      autoAdvanceTimer = null;
      timerProgress = 0;
    }
  }

  function startNewSession() {
    // Reset session data
    score = { correct: 0, total: 0, skipped: 0 };
    currentSessionQuestions = 0;
    sessionStats = { correct: 0, wrong: 0, skipped: 0, total: 0, sessionLength };
    sessionInProgress = true;
    sessionStartTime = Date.now();
    showSessionResults = false;
    sessionRestoredFromReload = false; // Reset reload flag for new sessions

    // Switch to quiz subpage
    quizSubpage = 'quiz';
    gameState = 'loading';

    // Generate first question
    generateQuestion();
  }

  function endSession() {
    // Clear session state
    sessionInProgress = false;
    clearSessionState();

    // Switch to welcome/stats page
    quizSubpage = 'welcome';
    gameState = 'welcome';
    showSessionResults = true; // Show results on welcome page
  }

  function resetGame() {
    endSession();
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

  function handleSettingsChange(event) {
    const { autoAdvance: newAutoAdvance, focusWrongAnswers: newFocusWrong, reduceCorrectAnswers: newReduceCorrect, soundEnabled: newSoundEnabled, sessionLength: newSessionLength } = event.detail;
    autoAdvance = newAutoAdvance;
    focusWrongAnswers = newFocusWrong;
    reduceCorrectAnswers = newReduceCorrect;
    soundEnabled = newSoundEnabled;
    sessionLength = newSessionLength;

    // Update current session stats with new session length
    sessionStats.sessionLength = newSessionLength;
  }

  function handleSettingsToggle(event) {
    showSettings = event.detail;
  }

  function handleResetConfirmation(event) {
    showResetConfirmation = event.detail;
  }

  function handleResetStats() {
    // Reset game statistics
    gameStats = { correct: 0, wrong: 0, total: 0, skipped: 0 };
    score = { correct: 0, total: 0, skipped: 0 };
    currentStreak = 0;
    currentSessionQuestions = 0;
    sessionStats = { correct: 0, wrong: 0, skipped: 0, total: 0, sessionLength };
    localStorage.setItem('flagQuizStats', JSON.stringify(gameStats));

    // Reset wrong answers tracking
    wrongAnswers = new Map();
    localStorage.removeItem('flagQuizWrongAnswers');

    // Reset correct answers tracking
    correctAnswers = new Map();
    localStorage.removeItem('flagQuizCorrectAnswers');

    // Reset achievements if component is available
    if (achievementsComponent) {
      achievementsComponent.resetAllAchievements();
    }

    showResetConfirmation = false;
  }

  function handleSessionPlayAgain() {
    resetGame();
  }

  function handleSessionGoToGames() {
    window.location.hash = '#/game';
  }

  function handleSessionClose() {
    showSessionResults = false;
  }

  function cancelReset() {
    showResetConfirmation = false;
  }

  function nextQuestion() {
    sessionRestoredFromReload = false; // Clear reload flag when user manually continues
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

  // Sound functions
  function playCorrectSound() {
    if (!soundEnabled) return;

    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Pleasant ascending tone for correct answer
      oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
      oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
      oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.4);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.4);
    } catch (e) {
      console.log('Audio not supported:', e);
    }
  }

  function playWrongSound() {
    if (!soundEnabled) return;

    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Descending tone for wrong answer
      oscillator.frequency.setValueAtTime(400, audioContext.currentTime); // Lower frequency
      oscillator.frequency.setValueAtTime(300, audioContext.currentTime + 0.15);

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {
      console.log('Audio not supported:', e);
    }
  }
</script>

<svelte:head>
  <title>Flag Quiz</title>
</svelte:head>

<Header
  {theme}
  {setTheme}
  {gameStats}
  {achievementCount}
  sessionStats={sessionStats}
  isQuizActive={sessionInProgress && quizSubpage === 'quiz'}
  onAchievementClick={() => showAchievements = true}
/>

<main class="flag-quiz">
  <div class="container">
    <!-- Quiz Settings Component -->
    <QuizSettings
      bind:autoAdvance
      bind:focusWrongAnswers
      bind:reduceCorrectAnswers
      bind:soundEnabled
      bind:sessionLength
      bind:showSettings
      bind:showResetConfirmation
      focusWrongLabel="Focus on previously answered incorrectly flags"
      reduceCorrectLabel="Show correctly answered flags less frequently"
      on:settingsChange={handleSettingsChange}
      on:settingsToggle={handleSettingsToggle}
      on:resetConfirmation={handleResetConfirmation}
      on:resetStats={handleResetStats}
    />

    <!-- Achievements Component -->
    <Achievements
      bind:this={achievementsComponent}
      {gameStats}
      {currentStreak}
      show={showAchievements}
      on:close={() => showAchievements = false}
      on:achievementsUnlocked={handleAchievementsUnlocked}
    />

    {#if quizSubpage === 'welcome'}
      <!-- Welcome/Stats Subpage -->
      <WelcomeStats
        {gameStats}
        {sessionStats}
        {sessionLength}
        showSessionResults={showSessionResults}
        on:startQuiz={startNewSession}
        on:openSettings={() => showSettings = true}
        on:closeResults={() => showSessionResults = false}
      />
    {:else if quizSubpage === 'quiz'}
      <!-- Quiz Subpage -->
      {#if gameState === 'loading'}
        <div class="loading">Loading flags...</div>
      {:else if currentQuestion}
        <div class="question-container">
          <div class="question-header">
            <div class="question-number">Question {currentSessionQuestions + 1} from {sessionLength}</div>
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

            <div class="options" key={questionKey}>
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

            <div class="flag-options" key={questionKey}>
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
          {:else if (!autoAdvance && gameState === 'answered') || (autoAdvance && gameState === 'answered' && sessionRestoredFromReload)}
            <button class="btn btn-primary btn-next-full" on:click={nextQuestion}>Next Question →</button>
          {/if}

          <!-- Auto-advance timer display -->
          {#if autoAdvance && gameState === 'answered' && timerProgress > 0 && !sessionRestoredFromReload}
            <div class="auto-advance-timer">
              <div class="timer-bar">
                <div class="timer-progress" style="width: {timerProgress}%"></div>
              </div>
              <span class="timer-text">Next question in {Math.ceil((timerDuration - (timerProgress / 100 * timerDuration)) / 1000)}s</span>
            </div>
          {/if}
        </div>
      {/if}

      <div class="controls">
        <button class="btn btn-secondary" on:click={endSession}>End Quiz</button>
        <button class="btn btn-secondary" on:click={toggleSettings} title="Settings">Settings</button>
      </div>
    {/if}
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

  /* Prevent residual hover states on new questions */
  .option:not(:hover):not(.selected):not(.correct):not(.wrong) {
    border-color: var(--color-border);
    background: var(--color-bg-primary);
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

  /* Prevent residual hover states on new questions for flag options */
  .flag-option:not(:hover):not(.selected):not(.correct):not(.wrong) {
    border-color: var(--color-border);
    background: var(--color-bg-primary);
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

  /* Auto-advance timer styles */
  .auto-advance-timer {
    margin-top: 1rem;
    text-align: center;
  }

  .timer-bar {
    width: 100%;
    height: 6px;
    background: var(--color-bg-tertiary);
    border-radius: 3px;
    overflow: hidden;
    margin-bottom: 0.5rem;
    border: 1px solid var(--color-border);
  }

  .timer-progress {
    height: 100%;
    background: var(--color-primary);
    transition: width 0.05s linear;
    border-radius: 2px;
  }

  .timer-text {
    font-size: 0.8rem;
    color: var(--color-text-secondary);
    font-weight: 500;
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
