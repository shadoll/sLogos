
<script>
import { quizInfo } from '../quizInfo/GeographyQuizInfo.js';
  import { onMount } from "svelte";
  import Header from "../components/Header.svelte";
  import Footer from "../components/Footer.svelte";
  import CountryMap from "../components/CountryMap.svelte";
  import QuizInfo from "../components/QuizInfo.svelte";
  import ActionButtons from "../components/ActionButtons.svelte";

  // Game data
  let countries = [];
  let currentQuestion = null;
  let correctAnswer = null;
  let options = [];

  // Game states
  let gameState = "welcome"; // 'welcome', 'loading', 'question', 'answered', 'session-complete'
  let quizSubpage = "welcome";
  let selectedAnswer = null;
  let showResult = false;
  let questionKey = 0;
  let sessionLength = 10;
  let currentSessionQuestions = 0;
  let sessionStats = {
    correct: 0,
    wrong: 0,
    total: 0,
    sessionLength: 10,
  };
  let showSessionResults = false;
  let sessionInProgress = false;

  async function loadCountries() {
    const res = await fetch("/data/flags.json");
    const data = await res.json();
    countries = data.filter(
      (c) => c.tags && c.tags.includes("Country") && c.code && c.meta?.country
    );
  }

  function generateQuestion() {
    // Pick correct country
    const idx = Math.floor(Math.random() * countries.length);
    correctAnswer = countries[idx];
    // Pick 3 random other countries
    let other = countries.filter((c) => c.code !== correctAnswer.code);
    other = shuffle(other).slice(0, 3);
    options = shuffle([correctAnswer, ...other]);
    selectedAnswer = null;
    showResult = false;
    questionKey++;
    gameState = "question";
    quizSubpage = "quiz";
    currentSessionQuestions++;
  }

  function shuffle(arr) {
    return arr
      .map((v) => [Math.random(), v])
      .sort((a, b) => a[0] - b[0])
      .map((v) => v[1]);
  }

  function selectAnswer(option) {
    selectedAnswer = option;
    showResult = true;
    gameState = "answered";
    if (option === correctAnswer) {
      sessionStats.correct++;
    } else {
      sessionStats.wrong++;
    }
    sessionStats.total++;
  }

  function startNewSession() {
    sessionInProgress = true;
    quizSubpage = "quiz";
    gameState = "loading";
    currentSessionQuestions = 0;
    sessionStats = {
      correct: 0,
      wrong: 0,
      total: 0,
      sessionLength,
    };
    generateQuestion();
  }

  function endSession() {
    sessionInProgress = false;
    quizSubpage = "welcome";
    gameState = "welcome";
    showSessionResults = true;
  }

  onMount(async () => {
    await loadCountries();
  });
</script>

<Header />
<main class="map-quiz">
  {#if quizSubpage === "welcome"}
    <div class="container">
  <QuizInfo
        gameStats={sessionStats}
        {sessionStats}
        {sessionLength}
        {showSessionResults}
  quizInfo={quizInfo}
        on:startQuiz={startNewSession}
        on:openSettings={() => {}}
        on:closeResults={() => {}}
      />
      <ActionButtons
        mode={showSessionResults ? "results" : "welcome"}
        sessionInfo={showSessionResults ? "" : `${sessionLength} questions per quiz`}
        hasPlayedBefore={sessionStats.total > 0}
        on:action={startNewSession}
      />
    </div>
  {:else if quizSubpage === "quiz"}
    <div class="container">
      <h2>Question {currentSessionQuestions} of {sessionLength}</h2>
      {#if correctAnswer}
        <CountryMap
          countryCodes={[correctAnswer.code]}
          countryNames={[]}
          mapPath="/data/world.svg"
          countryScale={true}
          scalePadding={60}
        />
        <div class="options">
          {#each options as option}
            <button
              class="option-btn {selectedAnswer === option ? (option === correctAnswer ? 'correct' : 'wrong') : ''}"
              on:click={() => selectAnswer(option)}
              disabled={showResult}
            >
              {option.meta.country}
            </button>
          {/each}
        </div>
        {#if showResult}
          <div class="result">
            {selectedAnswer === correctAnswer
              ? 'Correct!'
              : `Wrong! The correct answer is ${correctAnswer.meta.country}`}
          </div>
          {#if currentSessionQuestions < sessionLength}
            <button class="next-btn" on:click={generateQuestion}>Next</button>
          {:else}
            <button class="next-btn" on:click={endSession}>Finish</button>
          {/if}
        {/if}
      {:else}
        <div>Loading...</div>
      {/if}
    </div>
  {/if}
</main>
<Footer />

<style>
/* Use the same container and layout as FlagQuiz/CapitalsQuiz for welcome page */
  .container {
    max-width: 800px;
    margin: 0 auto;
    padding: 1.25rem 1rem;
  }
</style>
