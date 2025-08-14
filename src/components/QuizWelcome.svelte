<script>
    import InlineSvg from "./InlineSvg.svelte";
    export let quizInfo;
</script>

<div class="welcome-message">
    {#if quizInfo.title}
        <h2>Welcome to {quizInfo.title}!</h2>
    {/if}
    {#if quizInfo.description}
        <p>{quizInfo.description}</p>
    {/if}
    {#if quizInfo.features}
        <div class="features">
            {#each quizInfo.features as feature}
                <div class="feature">
                    {#if feature.icon}
                        <InlineSvg path={feature.icon} alt={feature.text} />
                    {/if}
                    <span>{feature.text}</span>
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
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
    @media (max-width: 480px) {
        .features {
            align-items: center;
            text-align: center;
        }
    }
</style>
