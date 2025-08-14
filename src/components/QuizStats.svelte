<script>
    import InlineSvg from "./InlineSvg.svelte";
    export let gameStats;
    export let accuracy;
    export let accuracyGrade;
    export let totalQuestions;
    export let sessionPercentage = null;
    export let sessionGrade = null;
    export let showSession = false;
</script>

<div class="stats-section">
    <h2>{showSession ? "Session Statistics" : "Your Statistics"}</h2>
    <div class="grade-display">
        {#if showSession}
            <div class="grade-circle" style="border-color: {sessionGrade?.color}">
                {sessionGrade?.letter}
            </div>
            <div class="grade-text">
                <div class="percentage">{sessionPercentage}%</div>
                <div class="description">{sessionGrade?.description}</div>
            </div>
        {:else}
            <div class="accuracy-icon" style="color: {accuracyGrade?.color}">
                <InlineSvg path="/icons/medal-star.svg" alt="Accuracy" />
            </div>
            <div class="grade-text">
                <div class="percentage">{accuracy}%</div>
                <div class="description">Accuracy</div>
            </div>
        {/if}
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
    {#if showSession}
        <div class="progress-bar">
            <div
                class="progress-fill"
                style="width: {sessionPercentage}%; background-color: {sessionGrade?.color}"
            ></div>
        </div>
        <div class="progress-summary">
            <h3>
                You answered {gameStats.correct} out of {gameStats.total}
                questions correctly
                {#if gameStats.skipped > 0}
                    and skipped {gameStats.skipped} question{gameStats.skipped > 1 ? "s" : ""}
                {/if}.
            </h3>
        </div>
    {:else}
        <div class="progress-summary">
            <h3>Total Questions Answered: {totalQuestions}</h3>
        </div>
    {/if}
</div>

<style>
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
        color: var(--color-text-primary);
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
    @media (max-width: 480px) {
        .stats-grid {
            grid-template-columns: repeat(2, 1fr);
        }
        .grade-display {
            flex-direction: column;
            text-align: center;
            gap: 1rem;
        }
        .grade-text {
            text-align: center;
        }
    }
</style>
