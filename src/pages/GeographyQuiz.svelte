<script>
  import { applyTheme, setTheme, themeStore } from "../utils/theme.js";
  import { updateAchievementCount } from "../quizLogic/quizAchievements.js";
  import { saveSettings, loadSettings } from "../quizLogic/quizSettings.js";
  import {
    loadGlobalStats,
    updateGlobalStats,
  } from "../quizLogic/quizGlobalStats.js";
  import {
    saveSessionState,
    loadSessionState,
    clearSessionState,
    createNewSessionState,
    restoreSessionState,
  } from "../quizLogic/quizSession.js";
  import { createAdvanceTimer } from "../quizLogic/advanceTimer.js";
  import { playCorrectSound, playWrongSound } from "../quizLogic/quizSound.js";
  import { quizInfo } from "../quizInfo/GeographyQuizInfo.js";
  import { onMount, onDestroy } from "svelte";
  import {
    loadFlags as loadFlagsShared,
    getCountryName,
    pickWeightedFlag,
  } from "../quizLogic/flags.js";
  import Header from "../components/Header.svelte";
  import Footer from "../components/Footer.svelte";
  import CountryMap from "../components/CountryMap.svelte";
  import Achievements from "../components/Achievements.svelte";
  import QuizSettings from "../components/QuizSettings.svelte";
  import QuizInfo from "../components/QuizInfo.svelte";
  import ActionButtons from "../components/ActionButtons.svelte";

  // Game data
  let flags = [];
  let currentQuestion = null;
  // Map parsing helpers - track which countries exist in the SVG
  let mapSvgText = "";
  let availableIso = new Set();
  let availableNames = new Set();
  let availableSlugs = new Set();
  let mapParsed = false;

  function normalizeNameForLookup(n) {
    if (!n) return "";
    return String(n).trim().toLowerCase();
  }

  function slugify(n) {
    return normalizeNameForLookup(n).replace(/[^a-z0-9]+/g, "-").replace(/^[-]+|[-]+$/g, "");
  }

  function isFlagOnMap(flag) {
    if (!mapParsed) return true; // allow through if we couldn't parse map
    try {
      const iso = flag?.meta?.["ISO code"] || flag?.meta?.["ISO Code"] || flag?.meta?.["ISO"] || flag?.ISO;
      if (iso && availableIso.has(String(iso).trim())) return true;
      const name = getCountryName(flag);
      const n = normalizeNameForLookup(name);
      if (n && availableNames.has(n)) return true;
      if (n && availableSlugs.has(n)) return true;
      const s = slugify(name);
      if (s && availableSlugs.has(s)) return true;
    } catch (err) {
      return true;
    }
    return false;
  }

  // Game states
  let gameState = "welcome";
  let quizSubpage = "welcome";
  let selectedAnswer = null;
  let showResult = false;

  // advance timer
  let advanceTimer;
  let timerProgress = 0;
  let timerDuration = 2000;

  let questionKey = 0;

  // Scoring
  let score = { correct: 0, total: 0, skipped: 0 };
  let gameStats = { correct: 0, wrong: 0, total: 0, skipped: 0 };
  let wrongAnswers = new Map();
  let correctAnswers = new Map();

  // Achievements
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

  // Session
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

  $: if (achievementsComponent) {
    achievementCount = updateAchievementCount(achievementsComponent);
  }

  $: if (settingsLoaded && typeof reduceCorrectAnswers !== "undefined") {
    saveSettings("geographyQuizSettings", {
      autoAdvance,
      focusWrongAnswers,
      reduceCorrectAnswers,
      soundEnabled,
      sessionLength,
    });
  }

  onMount(async () => {
    applyTheme($themeStore);

    if (typeof window !== "undefined") {
      window.appData = {
        ...window.appData,
        collection: "geography",
        setCollection: () => {},
        theme: $themeStore,
        setTheme: setTheme,
      };

      // Load saved game stats
      const savedStats = localStorage.getItem("geographyQuizStats");
      if (savedStats) {
        try {
          const loadedStats = JSON.parse(savedStats);
          gameStats = {
            correct: loadedStats.correct || 0,
            wrong: loadedStats.wrong || 0,
            total: loadedStats.total || 0,
            skipped: loadedStats.skipped || 0,
          };
        } catch (e) {
          console.error("Error loading geography game stats:", e);
        }
      }

      // Load wrong/correct answer maps
      const savedWrong = localStorage.getItem("geographyQuizWrongAnswers");
      if (savedWrong) {
        try {
          wrongAnswers = new Map(Object.entries(JSON.parse(savedWrong)));
        } catch (e) {
          console.error("Error loading wrong answers:", e);
        }
      }
      const savedCorrect = localStorage.getItem("geographyQuizCorrectAnswers");
      if (savedCorrect) {
        try {
          correctAnswers = new Map(Object.entries(JSON.parse(savedCorrect)));
        } catch (e) {
          console.error("Error loading correct answers:", e);
        }
      }

      // Load settings
      const loadedSettings = loadSettings("geographyQuizSettings", {
        autoAdvance,
        focusWrongAnswers,
        reduceCorrectAnswers,
        soundEnabled,
        sessionLength,
      });
      if (loadedSettings) {
        autoAdvance = loadedSettings.autoAdvance;
        focusWrongAnswers = loadedSettings.focusWrongAnswers;
        reduceCorrectAnswers = loadedSettings.reduceCorrectAnswers;
        soundEnabled = loadedSettings.soundEnabled;
        sessionLength = loadedSettings.sessionLength;
      }

      loadGlobalStats("globalQuizStats");
    }

    flags = await loadFlagsShared();
    // Fetch and parse the world SVG to build lookup sets for ids / names / class slugs
    try {
      const res = await fetch('/data/world.svg');
      if (res && res.ok) {
        mapSvgText = await res.text();
        try {
          const parser = new DOMParser();
          const doc = parser.parseFromString(mapSvgText, 'image/svg+xml');
          const all = Array.from(doc.querySelectorAll('*'));
          all.forEach((el) => {
            try {
              const id = el.getAttribute && el.getAttribute('id');
              if (id) availableIso.add(String(id).trim());
              const nameAttr = el.getAttribute && (el.getAttribute('name') || el.getAttribute('data-name') || el.getAttribute('inkscape:label'));
              if (nameAttr) availableNames.add(String(nameAttr).trim().toLowerCase());
              // title child
              try {
                const title = el.querySelector && el.querySelector('title');
                if (title && title.textContent) availableNames.add(String(title.textContent).trim().toLowerCase());
              } catch (e) {}
              // classes -> slugs
              const cls = el.getAttribute && el.getAttribute('class');
              if (cls) {
                cls.split(/\s+/).forEach((c) => {
                  const cc = String(c).trim();
                  if (!cc) return;
                  availableSlugs.add(cc.toLowerCase());
                });
              }
            } catch (err) {}
          });
          mapParsed = true;
        } catch (err) {
          console.warn('Error parsing world.svg', err);
        }
      }
    } catch (err) {
      console.warn('Could not fetch world.svg', err);
    }
    settingsLoaded = true;

    // Restore session if any
    const restored = restoreSessionState("geographyQuizSessionState");
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

      if (!currentQuestion) generateQuestion();
    } else {
      quizSubpage = "welcome";
      gameState = "welcome";
    }
  });

  onDestroy(() => {
    if (advanceTimer) advanceTimer.cancel();
  });

  async function loadFlags() {
    flags = await loadFlagsShared();
    console.log(`Loaded ${flags.length} countries for geography quiz`);
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
    sessionInProgress = false;
    clearSessionState("geographyQuizSessionState");

    quizSubpage = "welcome";
    gameState = "welcome";
    showSessionResults = true;
  }

  function generateQuestion() {
    if (flags.length < 4) return;

    gameState = "question";
    showResult = false;
    selectedAnswer = null;
    questionKey++;

    cancelAutoAdvanceTimer();

    // build pool of flags that exist on the map when possible
    let pool = flags;
    try {
      const onMap = flags.filter((f) => isFlagOnMap(f));
      if (mapParsed && onMap.length >= 4) pool = onMap;
    } catch (err) {}

    // Pick correct country (adaptive) from pool
    const pick = pickWeightedFlag(pool, { focusWrongAnswers, reduceCorrectAnswers }, wrongAnswers, correctAnswers);
    const correctFlag = pick || pool[Math.floor(Math.random() * pool.length)];

    const correctName = getCountryName(correctFlag);

    const wrongOptions = [];
    const used = new Set([correctName.toLowerCase()]);
    const wrongPool = pool;
    while (wrongOptions.length < 3 && wrongOptions.length < wrongPool.length - 1) {
      const r = wrongPool[Math.floor(Math.random() * wrongPool.length)];
      const rName = getCountryName(r).toLowerCase();
      if (!used.has(rName)) {
        wrongOptions.push(r);
        used.add(rName);
      }
    }
    while (wrongOptions.length < 3) {
      const r = flags[Math.floor(Math.random() * flags.length)];
      if (r !== correctFlag && !wrongOptions.includes(r)) wrongOptions.push(r);
    }

    const all = [correctFlag, ...wrongOptions].sort(() => Math.random() - 0.5);
    currentQuestion = {
      type: "map-to-country",
      correct: correctFlag,
      options: all,
      correctIndex: all.indexOf(correctFlag),
    };

    saveSessionState("geographyQuizSessionState", {
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
    showResult = true;
    gameState = "answered";

    score.total++;
    currentSessionQuestions++;
    sessionStats.total++;

    const isCorrect = index === currentQuestion.correctIndex;
    if (isCorrect) {
      score.correct++;
      gameStats.correct++;
      sessionStats.correct++;
      currentStreak++;

      playCorrectSound(soundEnabled);

      if (currentQuestion.correct?.name) {
        const name = currentQuestion.correct.name;
        correctAnswers.set(name, (correctAnswers.get(name) || 0) + 1);
        localStorage.setItem(
          "geographyQuizCorrectAnswers",
          JSON.stringify(Object.fromEntries(correctAnswers)),
        );
      }

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
        if (continent)
          achievementsComponent.incrementContinentProgress(continent);
      }

      if (achievementsComponent) achievementsComponent.resetConsecutiveSkips();
    } else {
      gameStats.wrong++;
      sessionStats.wrong++;
      currentStreak = 0;

      playWrongSound(soundEnabled);

      if (currentQuestion.correct?.name) {
        const name = currentQuestion.correct.name;
        wrongAnswers.set(name, (wrongAnswers.get(name) || 0) + 1);
        localStorage.setItem(
          "geographyQuizWrongAnswers",
          JSON.stringify(Object.fromEntries(wrongAnswers)),
        );
      }

      if (achievementsComponent) achievementsComponent.resetConsecutiveSkips();
    }

    gameStats.total++;
    localStorage.setItem("geographyQuizStats", JSON.stringify(gameStats));

    updateGlobalStats("globalQuizStats", "geographyQuiz", isCorrect);

    if (achievementsComponent) achievementsComponent.checkAchievements();

    saveSessionState("geographyQuizSessionState", {
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

    if (currentSessionQuestions >= sessionLength) {
      gameState = "session-complete";
      sessionStats.sessionLength = sessionLength;
      if (autoAdvance) setTimeout(() => endSession(), isCorrect ? 2000 : 4000);
      else endSession();
      return;
    }

    if (autoAdvance) startAutoAdvanceTimer(isCorrect ? 2000 : 4000);
  }

  function skipQuestion() {
    if (gameState !== "question") return;
    score.skipped++;
    gameStats.skipped++;
    gameStats.total++;
    currentSessionQuestions++;
    sessionStats.skipped++;
    sessionStats.total++;

    if (achievementsComponent)
      achievementsComponent.incrementConsecutiveSkips();
    if (achievementsComponent) achievementsComponent.checkAchievements();

    localStorage.setItem("geographyQuizStats", JSON.stringify(gameStats));
    updateGlobalStats("globalQuizStats", "geographyQuiz", null, true);

    saveSessionState("geographyQuizSessionState", {
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

    if (currentSessionQuestions >= sessionLength) {
      gameState = "session-complete";
      sessionStats.sessionLength = sessionLength;
      endSession();
      return;
    }
    generateQuestion();
  }

  function handleSettingsChange(event) {
    const {
      autoAdvance: a,
      focusWrongAnswers: f,
      reduceCorrectAnswers: r,
      soundEnabled: s,
      sessionLength: l,
    } = event.detail;
    autoAdvance = a;
    focusWrongAnswers = f;
    reduceCorrectAnswers = r;
    soundEnabled = s;
    sessionLength = l;
    sessionStats.sessionLength = l;
  }

  function handleSettingsToggle(event) {
    showSettings = event.detail;
  }

  function handleResetConfirmation(event) {
    showResetConfirmation = event.detail;
  }

  function nextQuestion() {
    sessionRestoredFromReload = false;
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

  function handleAchievementsUnlocked() {
    achievementCount = updateAchievementCount(achievementsComponent);
  }

  // Reactive country code array for CountryMap; recomputes when currentQuestion changes
  $: countryCodes = currentQuestion
    ? [
        currentQuestion.correct?.meta?.["ISO code"] ||
          currentQuestion.correct?.meta?.["ISO Code"] ||
          currentQuestion.correct?.meta?.["ISO"] ||
          (currentQuestion.correct?.meta &&
            currentQuestion.correct.meta["ISO code"]) ||
          currentQuestion.correct?.ISO ||
          "",
      ].filter(Boolean)
    : [];

  // Reactive country names array for CountryMap (fallback when no ISO present)
  $: countryNames = currentQuestion
    ? [
        currentQuestion.correct?.name ||
          (currentQuestion.correct?.meta && currentQuestion.correct.meta.country) ||
          currentQuestion.correct?.meta?.country ||
          "",
      ].filter(Boolean)
    : [];
</script>

<svelte:head>
  <title>Geography Quiz</title>
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

<main class="geography-quiz">
  <div class="container">
    <QuizSettings
      bind:autoAdvance
      bind:focusWrongAnswers
      bind:reduceCorrectAnswers
      bind:soundEnabled
      bind:sessionLength
      bind:showSettings
      bind:showResetConfirmation
      focusWrongLabel="Focus on previously answered incorrectly countries"
      reduceCorrectLabel="Show correctly answered countries less frequently"
      on:settingsChange={handleSettingsChange}
      on:settingsToggle={handleSettingsToggle}
      on:resetConfirmation={handleResetConfirmation}
    />

    <Achievements
      bind:this={achievementsComponent}
      {gameStats}
      {currentStreak}
      show={showAchievements}
      on:close={() => (showAchievements = false)}
      on:achievementsUnlocked={handleAchievementsUnlocked}
    />

    {#if quizSubpage === "welcome"}
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
      {#if gameState === "loading"}
        <div class="loading">Loading countries...</div>
      {:else if currentQuestion}
        <div class="question-container">
          <div class="question-header">
            <div class="question-number">
              Question {currentSessionQuestions + 1} from {sessionLength}
            </div>
            <div class="question-type">
              Which country is highlighted on the map?
            </div>
          </div>

          <div class="map-display">
            <CountryMap
              {countryCodes}
              {countryNames}
              countryScale={true}
              scalePadding={90}
              forceCenterKey={questionKey}
              key={questionKey}
            />
          </div>

          <div class="options" key={questionKey}>
            {#each currentQuestion.options as option, index}
              <button
                class="option"
                class:selected={selectedAnswer === index}
                class:correct={showResult &&
                  index === currentQuestion.correctIndex}
                class:wrong={showResult &&
                  selectedAnswer === index &&
                  index !== currentQuestion.correctIndex}
                on:click={() => selectAnswer(index)}
                disabled={gameState === "answered"}
              >
                {getCountryName(option)}
              </button>
            {/each}
          </div>

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
        sessionInfo={`Question ${currentSessionQuestions + 1} from ${sessionLength}`}
        on:action={handleActionButtonClick}
      />
    {/if}
  </div>
</main>
<Footer />

<style>
  .geography-quiz {
    min-height: 100vh;
    background: var(--color-bg-primary);
    color: var(--color-text-primary);
  }
  .container {
    max-width: 900px;
    margin: 0 auto;
    padding: 1.25rem 1rem;
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
  .map-display {
    display: flex;
    justify-content: center;
    align-items: stretch;
    margin-bottom: 1rem;
    width: 100%;
    aspect-ratio: 16 / 9;
    max-height: 520px;
    overflow: hidden;
  }
  :global(.map-display .country-map-section) {
    flex: 1 1 100%;
    width: 100%;
    height: 100%;
  }
  :global(.map-display .country-map-section > div) {
    width: 100%;
    height: 100%;
  }
  /* Force the inlined SVG to fit the .map-display box to prevent overflow */
  :global(.map-display .svg-wrapper) { width: 100%; height: 100%; }
  :global(.map-display .svg-wrapper svg) { width: 100%; height: 100%; display: block; }
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
    cursor: pointer;
    color: var(--color-text-primary);
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
  .btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
  }
  .btn-primary {
    background: var(--color-primary);
    color: white;
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
  }
  .timer-text {
    font-size: 0.8rem;
    color: var(--color-text-secondary);
  }
  @media (max-width: 768px) {
    .options {
      grid-template-columns: 1fr;
    }
    .map-display {
      height: 260px;
    }
  }
</style>
