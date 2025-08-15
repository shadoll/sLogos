<script>
  import { applyTheme, setTheme, themeStore } from "../utils/theme.js";
  import { updateAchievementCount } from "../quizLogic/quizAchievements.js";
  import { saveSettings } from "../quizLogic/quizSettings.js";
  import {
    loadGlobalStats,
    updateGlobalStats,
  } from "../quizLogic/quizGlobalStats.js";
  import { playCorrectSound, playWrongSound } from "../quizLogic/quizSound.js";
  import {
    saveSessionState,
    clearSessionState,
    createNewSessionState,
  } from "../quizLogic/quizSession.js";
  import { restoreSessionState } from "../quizLogic/quizSession.js";
  import { createAdvanceTimer } from "../quizLogic/advanceTimer.js";

  import { quizInfo } from "../quizInfo/FlagQuizInfo.js";
  import { onMount, onDestroy } from "svelte";
  import { loadFlags as loadFlagsShared, getCountryName, getFlagImage, pickWeightedFlag } from "../quizLogic/flags.js";
  import Header from "../components/Header.svelte";
  import Footer from "../components/Footer.svelte";
  import InlineSvg from "../components/InlineSvg.svelte";
  import Achievements from "../components/Achievements.svelte";
  import QuizSettings from "../components/QuizSettings.svelte";
  import QuizInfo from "../components/QuizInfo.svelte";
  import ActionButtons from "../components/ActionButtons.svelte";

  // Game data
  let flags = [];
  let currentQuestion = null;
  let questionType = "flag-to-country"; // 'flag-to-country' or 'country-to-flag'

  // Question and answer arrays
  let correctAnswer = "";

  // Game states
  let gameState = "welcome"; // 'welcome', 'loading', 'question', 'answered', 'session-complete'
  let quizSubpage = "welcome"; // 'welcome' or 'quiz'
  let selectedAnswer = null;
  let answered = false;
  let showResult = false;
  let showCountryInfo = false;
  let showResultCountryInfo = false;

  // advance timer (shared)
  let advanceTimer;
  let timerProgress = 0;
  let timerDuration = 2000; // 2 seconds

  // Force component re-render key to prevent button state persistence
  let questionKey = 0;

  // Scoring
  let score = { correct: 0, total: 0, skipped: 0 };
  let gameStats = { correct: 0, wrong: 0, total: 0, skipped: 0 };
  let wrongAnswers = new Map();
  let correctAnswers = new Map();

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
  let sessionStats = {
    correct: 0,
    wrong: 0,
    skipped: 0,
    total: 0,
    sessionLength: 10,
  };
  let showSessionResults = false;
  let sessionInProgress = false;
  let sessionStartTime = null;
  let sessionRestoredFromReload = false;

  // Update achievement count when achievements component is available
  $: if (achievementsComponent) {
    achievementCount = updateAchievementCount(achievementsComponent);
  }

  // Save settings when they change (after initial load)
  $: if (settingsLoaded && typeof reduceCorrectAnswers !== "undefined") {
    saveSettings("flagQuizSettings", {
      autoAdvance,
      focusWrongAnswers,
      reduceCorrectAnswers,
      soundEnabled,
      sessionLength,
    });
  }

  // Load game stats from localStorage
  onMount(async () => {
    applyTheme($themeStore);

    // Set window.appData for header compatibility
    if (typeof window !== "undefined") {
      window.appData = {
        ...window.appData,
        collection: "flags",
        setCollection: () => {},
        theme: $themeStore,
        setTheme: setTheme,
      };

      // Load saved game stats
      const savedStats = localStorage.getItem("flagQuizStats");
      if (savedStats) {
        try {
          const loadedStats = JSON.parse(savedStats);
          // Ensure backward compatibility for skipped field
          gameStats = {
            correct: loadedStats.correct || 0,
            wrong: loadedStats.wrong || 0,
            total: loadedStats.total || 0,
            skipped: loadedStats.skipped || 0,
          };
        } catch (e) {
          console.error("Error loading game stats:", e);
        }
      }

      // Load wrong answers tracking
      const savedWrongAnswers = localStorage.getItem("flagQuizWrongAnswers");
      if (savedWrongAnswers) {
        try {
          const loadedWrongAnswers = JSON.parse(savedWrongAnswers);
          wrongAnswers = new Map(Object.entries(loadedWrongAnswers));
        } catch (e) {
          console.error("Error loading wrong answers:", e);
        }
      }

      // Load correct answers tracking
      const savedCorrectAnswers = localStorage.getItem(
        "flagQuizCorrectAnswers",
      );
      if (savedCorrectAnswers) {
        try {
          const loadedCorrectAnswers = JSON.parse(savedCorrectAnswers);
          correctAnswers = new Map(Object.entries(loadedCorrectAnswers));
        } catch (e) {
          console.error("Error loading correct answers:", e);
        }
      }

      // Load settings
      const savedSettings = localStorage.getItem("flagQuizSettings");
      if (savedSettings) {
        try {
          const settings = JSON.parse(savedSettings);
          autoAdvance =
            settings.autoAdvance !== undefined ? settings.autoAdvance : true;
          focusWrongAnswers =
            settings.focusWrongAnswers !== undefined
              ? settings.focusWrongAnswers
              : false;
          reduceCorrectAnswers =
            settings.reduceCorrectAnswers !== undefined
              ? settings.reduceCorrectAnswers
              : false;
          soundEnabled =
            settings.soundEnabled !== undefined ? settings.soundEnabled : true;
          sessionLength =
            settings.sessionLength !== undefined ? settings.sessionLength : 10;
        } catch (e) {
          console.error("Error loading settings:", e);
        }
      }

      // Load global stats and update them
      loadGlobalStats("globalQuizStats");
    }

    await loadFlags();
    settingsLoaded = true;

    // Load or initialize session (centralized)
    const restored = restoreSessionState("flagQuizSessionState");
    if (restored && restored.sessionInProgress) {
      sessionInProgress = restored.sessionInProgress;
      currentSessionQuestions = restored.currentSessionQuestions;
      sessionStats = restored.sessionStats;
      score = restored.score;
      currentQuestion = restored.currentQuestion;
      selectedAnswer = restored.selectedAnswer;
      showResult = restored.showResult;
      gameState = restored.gameState;
      quizSubpage = restored.quizSubpage;
      sessionStartTime = restored.sessionStartTime;
      questionKey = restored.questionKey || 0;
      sessionRestoredFromReload = restored.sessionRestoredFromReload;

      if (!currentQuestion) {
        generateQuestion();
      }
    } else {
      quizSubpage = "welcome";
      gameState = "welcome";
    }
  });

  // Cleanup on component destroy: cancel any running advance timer
  onDestroy(() => {
    if (advanceTimer) advanceTimer.cancel();
  });

  // use shared applyTheme from ../utils/theme.js

  async function loadFlags() {
  flags = await loadFlagsShared();
  console.log(`Loaded ${flags.length} unique country flags for quiz`);
  }

  function generateQuestion() {
    if (flags.length < 4) {
      console.error("Not enough flags to generate question");
      return;
    }

    gameState = "question";
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
    if (typeof document !== "undefined") {
      // Use setTimeout to ensure DOM updates are complete
      setTimeout(() => {
        const activeElement = document.activeElement;
        if (activeElement && activeElement.tagName === "BUTTON") {
          activeElement.blur();
        }
        // Force removal of any residual button states
        const buttons = document.querySelectorAll(".option, .flag-option");
        buttons.forEach((button) => {
          button.blur();
          button.classList.remove("selected", "correct", "wrong");
        });
      }, 0);
    }

    // Randomly choose question type
    questionType = Math.random() < 0.5 ? "flag-to-country" : "country-to-flag";

  // Pick correct answer with shared helper (handles adaptive settings)
  const pick = pickWeightedFlag(flags, { focusWrongAnswers, reduceCorrectAnswers }, wrongAnswers, correctAnswers);
  const correctFlag = pick || flags[Math.floor(Math.random() * flags.length)];

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
  const allOptions = [correctFlag, ...wrongOptions].sort(() => Math.random() - 0.5);
    currentQuestion = {
      type: questionType,
      correct: correctFlag,
      options: allOptions,
      correctIndex: allOptions.indexOf(correctFlag),
    };

    console.log("Generated question:", currentQuestion);

    // Save session state
    saveSessionState("flagQuizSessionState", {
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
      questionKey,
    });
  }
  function selectAnswer(index) {
    if (gameState !== "question") return;

    selectedAnswer = index;
    correctAnswer = currentQuestion.correctIndex;
    showResult = true;
    gameState = "answered";
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
      playCorrectSound(soundEnabled);

      // Track correct answer for this flag
      if (currentQuestion.correct?.name) {
        const flagName = currentQuestion.correct.name;
        correctAnswers.set(flagName, (correctAnswers.get(flagName) || 0) + 1);
        // Save correct answers to localStorage
        localStorage.setItem(
          "flagQuizCorrectAnswers",
          JSON.stringify(Object.fromEntries(correctAnswers)),
        );
      }

      // Track continent progress for correct answers
      if (achievementsComponent && currentQuestion.correct?.tags) {
        const continent = currentQuestion.correct.tags.find((tag) =>
          [
            "Europe",
            "Asia",
            "Africa",
            "North America",
            "South America",
            "Oceania",
          ].includes(tag),
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
      playWrongSound(soundEnabled);

      // Track wrong answer for this flag
      if (currentQuestion.correct?.name) {
        const flagName = currentQuestion.correct.name;
        wrongAnswers.set(flagName, (wrongAnswers.get(flagName) || 0) + 1);
        // Save wrong answers to localStorage
        localStorage.setItem(
          "flagQuizWrongAnswers",
          JSON.stringify(Object.fromEntries(wrongAnswers)),
        );
      }

      if (achievementsComponent) {
        achievementsComponent.resetConsecutiveSkips();
      }
    }
    gameStats.total++;

    // Save stats to localStorage
    localStorage.setItem("flagQuizStats", JSON.stringify(gameStats));

    // Update global stats
    updateGlobalStats("globalQuizStats", "flagQuiz", isCorrect);

    // Check for new achievements
    if (achievementsComponent) {
      achievementsComponent.checkAchievements();
    }

    // Save session state
    saveSessionState("flagQuizSessionState", {
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
      questionKey,
    });

    // Check if session is complete
    if (currentSessionQuestions >= sessionLength) {
      // Session complete - show results and return to welcome page
      gameState = "session-complete";
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
  }
  function skipQuestion() {
    if (gameState !== "question") return;

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
    localStorage.setItem("flagQuizStats", JSON.stringify(gameStats));

    // Update global stats (skipped question)
    updateGlobalStats("globalQuizStats", "flagQuiz", null, true);

    // Save session state
    saveSessionState("flagQuizSessionState", {
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
      questionKey,
    });

    // Check if session is complete
    if (currentSessionQuestions >= sessionLength) {
      gameState = "session-complete";
      sessionStats.sessionLength = sessionLength;
      endSession();
      return;
    }

    // Move to next question immediately
    generateQuestion();
  }

  function startAutoAdvanceTimer(duration) {
    timerDuration = duration;
    if (!advanceTimer) {
      advanceTimer = createAdvanceTimer(
        (p) => (timerProgress = p),
        () => generateQuestion(),
      );
    }
    advanceTimer.start(duration);
  }

  function cancelAutoAdvanceTimer() {
    if (advanceTimer) advanceTimer.cancel();
    timerProgress = 0;
  }

  function startNewSession() {
    // Create a canonical new session state and apply it to component state
    const s = createNewSessionState(sessionLength);
    score = s.score;
    currentSessionQuestions = s.currentSessionQuestions;
    sessionStats = s.sessionStats;
    sessionInProgress = s.sessionInProgress;
    sessionStartTime = s.sessionStartTime;
    showSessionResults = s.showSessionResults;
    sessionRestoredFromReload = s.sessionRestoredFromReload;

    quizSubpage = "quiz";
    gameState = "loading";
    generateQuestion();
  }

  function endSession() {
    // Clear session state
    sessionInProgress = false;
    clearSessionState("flagQuizSessionState");

    // Switch to welcome/stats page
    quizSubpage = "welcome";
    gameState = "welcome";
    showSessionResults = true; // Show results on welcome page
  }

  function handleSettingsChange(event) {
    const {
      autoAdvance: newAutoAdvance,
      focusWrongAnswers: newFocusWrong,
      reduceCorrectAnswers: newReduceCorrect,
      soundEnabled: newSoundEnabled,
      sessionLength: newSessionLength,
    } = event.detail;
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

  function nextQuestion() {
    sessionRestoredFromReload = false; // Clear reload flag when user manually continues
    generateQuestion();
  }

  function handleActionButtonClick(event) {
    const { action } = event.detail;

    switch (action) {
      case "startQuiz":
        startNewSession();
        break;
      case "playAgain":
        startNewSession();
        break;
      case "goToGames":
        window.location.hash = "#/game";
        break;
      case "openSettings":
        showSettings = true;
        break;
      case "endSession":
        endSession();
        break;
      default:
        console.warn("Unknown action:", action);
    }
  }

  // use shared getCountryName from ../quizLogic/flags.js

  function handleAchievementsUnlocked() {
    achievementCount = updateAchievementCount(achievementsComponent);
  }
</script>

<svelte:head>
  <title>Flag Quiz</title>
</svelte:head>

<Header
  theme={$themeStore}
  {setTheme}
  {gameStats}
  {achievementCount}
  {sessionStats}
  isQuizActive={sessionInProgress && quizSubpage === "quiz"}
  onAchievementClick={() => (showAchievements = true)}
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
    />

    <!-- Achievements Component -->
    <Achievements
      bind:this={achievementsComponent}
      {gameStats}
      {currentStreak}
      show={showAchievements}
      on:close={() => (showAchievements = false)}
      on:achievementsUnlocked={handleAchievementsUnlocked}
    />

    {#if quizSubpage === "welcome"}
      <!-- Welcome/Stats Subpage -->
      <QuizInfo
        {gameStats}
        {sessionStats}
        {sessionLength}
        {showSessionResults}
        {quizInfo}
        on:startQuiz={startNewSession}
        on:openSettings={() => (showSettings = true)}
        on:closeResults={() => (showSessionResults = false)}
      />

      <ActionButtons
        mode={showSessionResults ? "results" : "welcome"}
        sessionInfo={showSessionResults
          ? ""
          : `${sessionLength} questions per quiz`}
        hasPlayedBefore={gameStats.total > 0}
        on:action={handleActionButtonClick}
      />
    {:else if quizSubpage === "quiz"}
      <!-- Quiz Subpage -->
      {#if gameState === "loading"}
        <div class="loading">Loading flags...</div>
      {:else if currentQuestion}
        <div class="question-container">
          <div class="question-header">
            <div class="question-number">
              Question {currentSessionQuestions + 1} from {sessionLength}
            </div>
            <div class="question-type">
              {currentQuestion.type === "flag-to-country"
                ? "Which country does this flag belong to?"
                : "Which flag belongs to this country?"}
            </div>
          </div>

          <!-- Fixed height result area -->
          <div class="result-area">
            {#if showResult}
              <div class="result">
                {#if selectedAnswer === correctAnswer}
                  <div class="correct-result">
                    <span class="result-icon smile-icon"
                      ><InlineSvg
                        path="/icons/smile-squre.svg"
                        alt="Correct"
                      /></span
                    > Correct!
                  </div>
                {:else}
                  <div class="wrong-result">
                    <span class="result-icon sad-icon"
                      ><InlineSvg
                        path="/icons/sad-square.svg"
                        alt="Wrong"
                      /></span
                    >
                    Wrong!
                    {#if currentQuestion.type === "flag-to-country"}
                      <span class="result-country-info">
                        The correct answer is: {getCountryName(
                          currentQuestion.correct,
                        )}.
                        <button
                          class="info-icon result-info-btn"
                          aria-label="Show country info"
                          aria-expanded={showResultCountryInfo}
                          on:click={() =>
                            (showResultCountryInfo = !showResultCountryInfo)}
                          on:keydown={(e) => {
                            if (e.key === "Escape")
                              showResultCountryInfo = false;
                          }}
                        >
                          <InlineSvg
                            path="/icons/info-square.svg"
                            alt="Country info"
                          />
                        </button>
                        {#if showResultCountryInfo}
                          <div
                            class="info-tooltip result-info-tooltip"
                            role="dialog"
                            aria-live="polite"
                          >
                            {currentQuestion.correct.meta.description}
                          </div>
                        {/if}
                      </span>
                    {:else}
                      You selected the {getCountryName(
                        currentQuestion.options[selectedAnswer],
                      )} flag.
                    {/if}
                  </div>
                {/if}
              </div>
            {/if}
          </div>

          {#if currentQuestion.type === "flag-to-country"}
            <div class="flag-display">
              <img
                src={getFlagImage(currentQuestion.correct)}
                alt="Flag"
                class="quiz-flag"
              />
            </div>

            <div class="options" key={questionKey}>
              {#each currentQuestion.options as option, index}
                <button
                  class="option"
                  class:selected={selectedAnswer === index}
                  class:correct={showResult && index === correctAnswer}
                  class:wrong={showResult &&
                    selectedAnswer === index &&
                    index !== correctAnswer}
                  on:click={() => selectAnswer(index)}
                  disabled={gameState === "answered"}
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
                    on:keydown={(e) => {
                      if (e.key === "Escape") showCountryInfo = false;
                    }}
                  >
                    <InlineSvg
                      path="/icons/info-square.svg"
                      alt="Country info"
                    />
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
                  class:wrong={showResult &&
                    selectedAnswer === index &&
                    index !== correctAnswer}
                  on:click={() => selectAnswer(index)}
                  disabled={gameState === "answered"}
                >
                  <img
                    src={getFlagImage(option)}
                    alt={getCountryName(option)}
                    class="option-flag"
                  />
                </button>
              {/each}
            </div>
          {/if}

          {#if gameState === "question"}
            <button class="btn btn-skip btn-next-full" on:click={skipQuestion}
              >Skip Question</button
            >
          {:else if (!autoAdvance && gameState === "answered") || (autoAdvance && gameState === "answered" && sessionRestoredFromReload)}
            <button
              class="btn btn-primary btn-next-full"
              on:click={nextQuestion}>Next Question →</button
            >
          {/if}

          <!-- Auto-advance timer display -->
          {#if autoAdvance && gameState === "answered" && timerProgress > 0 && !sessionRestoredFromReload}
            <div class="auto-advance-timer">
              <div class="timer-bar">
                <div
                  class="timer-progress"
                  style="width: {timerProgress}%"
                ></div>
              </div>
              <span class="timer-text"
                >Next question in {Math.ceil(
                  (timerDuration - (timerProgress / 100) * timerDuration) /
                    1000,
                )}s</span
              >
            </div>
          {/if}
        </div>
      {/if}

      <ActionButtons
        mode="quiz"
        sessionInfo="Question {currentSessionQuestions +
          1} from {sessionLength}"
        on:action={handleActionButtonClick}
      />
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
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
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
  }
</style>
