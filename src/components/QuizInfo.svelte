<script>
    import { createEventDispatcher } from "svelte";
    import InlineSvg from "./InlineSvg.svelte";
    import QuizHeader from "./QuizHeader.svelte";
    import QuizStats from "./QuizStats.svelte";
    import QuizWelcome from "./QuizWelcome.svelte";

    const dispatch = createEventDispatcher();

    export let gameStats = { correct: 0, wrong: 0, total: 0, skipped: 0 };
    export let sessionStats = null;
    export let showSessionResults = false;
    export let quizInfo;

    function startQuiz() {
        dispatch("startQuiz");
    }

    function handlePlayAgain() {
        dispatch("startQuiz");
    }

    function handleGoToGames() {
        window.location.hash = "#/game";
    }

    function openSettings() {
        dispatch("openSettings");
    }

    function handleCloseResults() {
        dispatch("closeResults");
    }

    $: hasPlayedBefore = gameStats.total > 0;
    $: totalQuestions = gameStats.correct + gameStats.wrong + gameStats.skipped;
    $: accuracy =
        totalQuestions > 0
            ? Math.round((gameStats.correct / totalQuestions) * 100)
            : 0;

    // Session results calculations
    $: sessionPercentage =
        sessionStats && sessionStats.total > 0
            ? Math.round((sessionStats.correct / sessionStats.total) * 100)
            : 0;
    $: sessionGrade = sessionStats ? getGrade(sessionPercentage) : null;

    $: accuracyGrade = hasPlayedBefore ? getGrade(accuracy) : null;

    function getGrade(percentage) {
        if (percentage >= 90)
            return {
                letter: "A+",
                color: "#22c55e",
                description: "Excellent!",
            };
        if (percentage >= 80)
            return { letter: "A", color: "#22c55e", description: "Great job!" };
        if (percentage >= 70)
            return { letter: "B", color: "#3b82f6", description: "Good work!" };
        if (percentage >= 60)
            return { letter: "C", color: "#f59e0b", description: "Not bad!" };
        if (percentage >= 50)
            return {
                letter: "D",
                color: "#ef4444",
                description: "Keep practicing!",
            };
        return { letter: "F", color: "#ef4444", description: "Try again!" };
    }
</script>

<div class="welcome-container">
    <QuizHeader {quizInfo} />
    {#if showSessionResults && sessionStats}
        <QuizStats
            gameStats={sessionStats}
            sessionPercentage={sessionPercentage}
            sessionGrade={sessionGrade}
            showSession={true}
        />
    {:else if hasPlayedBefore}
        <QuizStats
            gameStats={gameStats}
            accuracy={accuracy}
            accuracyGrade={accuracyGrade}
            totalQuestions={totalQuestions}
            showSession={false}
        />
    {:else}
        <QuizWelcome {quizInfo} />
    {/if}
</div>

<style>
    .welcome-container {
        max-width: 600px;
        margin: 0 auto;
        padding: 2rem;
        text-align: center;
    }

    @media (max-width: 480px) {
        .welcome-container {
            padding: 1rem;
        }
    }
</style>
