<script>
    import InlineSvg from "./InlineSvg.svelte";
    export let quizInfo;
</script>

<div class="welcome-header">
    {#if quizInfo.icon}
        <div class="welcome-icon">
            <InlineSvg path={quizInfo.icon} alt={quizInfo.title} />
        </div>
    {/if}
    {#if quizInfo.title}
        <h1>{quizInfo.title}</h1>
    {/if}
    {#if quizInfo.description}
        <p class="welcome-subtitle">{quizInfo.description}</p>
    {/if}
</div>

<style>
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
</style>
