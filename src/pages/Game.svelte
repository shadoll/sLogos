<script>
  import { onMount } from 'svelte';
  import { collections } from '../collections.js';
  import Header from '../components/Header.svelte';
  import Footer from '../components/Footer.svelte';

  import { quizInfo as flagQuizInfo } from '../quizInfo/FlagQuizInfo.js';
  import { quizInfo as capitalsQuizInfo } from '../quizInfo/CapitalsQuizInfo.js';
  import { quizInfo as geographyQuizInfo } from '../quizInfo/GeographyQuizInfo.js';
  import { quizInfo as logoQuizInfo } from '../quizInfo/LogoQuizInfo.js';
  import { quizInfo as emblemQuizInfo } from '../quizInfo/EmblemQuizInfo.js';

  let availableGames = [flagQuizInfo, capitalsQuizInfo, geographyQuizInfo, logoQuizInfo, emblemQuizInfo];

  let theme = 'system';

  function setTheme(t) {
    localStorage.setItem('theme', t);
    applyTheme(t);
    theme = t;
  }

  onMount(() => {
    // Initialize theme from storage and apply
    theme = localStorage.getItem('theme') || 'system';
    applyTheme(theme);
    // Set window.appData for header compatibility
    if (typeof window !== 'undefined') {
      window.appData = {
        ...window.appData,
        collection: 'game',
        setCollection: () => {},
        collections: collections,
        theme,
        setTheme
      };
    }
  });

  function applyTheme(theme) {
    let effectiveTheme = theme;
    if (theme === 'system') {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', effectiveTheme);
    document.documentElement.className = effectiveTheme;
  }
</script>

<Header {theme} {setTheme} />

<main class="game-selection">
  <div class="container">
    <h1>🎮 Quiz Games</h1>
    <p class="subtitle">Test and study your knowledge with our interactive quiz games</p>

    <div class="game-grid">
      {#each availableGames as game}
        {#if game.state === 'released'}
          <a href={game.route} class="game-card">
            <div class="game-icon">
              {#if game.emoji}
                <span>{game.emoji}</span>
              {/if}
            </div>
            <h2>{game.title}</h2>
            <p>{game.description}</p>
            <div class="play-button">Play Now →</div>
          </a>
        {:else if game.state === 'testing'}
          <a href={game.route} class="game-card testing">
            <div class="game-icon">
              {#if game.emoji}
                <span>{game.emoji}</span>
              {/if}
            </div>
            <h2>{game.title}</h2>
            <p>{game.description}</p>
            <div class="play-button">Play Now →</div>
          </a>
        {:else if game.state === 'scheduled'}
          <div class="game-card scheduled">
            <div class="game-icon">
              {#if game.emoji}
                <span class="grayscale">{game.emoji}</span>
              {/if}
            </div>
            <h2>{game.title}</h2>
            <p>{game.description}</p>
            <div class="coming-soon-text">Coming soon</div>
          </div>
        {/if}
      {/each}
    </div>
  </div>
</main>

<Footer />

<style>
  .game-selection {
    min-height: 100vh;
    background: var(--color-bg-primary);
    color: var(--color-text-primary);
  }

  .container {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
  }

  h1 {
    text-align: center;
    font-size: 3rem;
    margin-bottom: 0.5rem;
    color: var(--color-text-primary);
  }

  .subtitle {
    text-align: center;
    font-size: 1.2rem;
    color: var(--color-text-secondary);
    margin-bottom: 3rem;
  }

  .game-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 2rem;
    margin-bottom: 4rem;
  }

  .game-card {
    display: block;
    text-decoration: none;
    background: var(--color-bg-secondary);
    border: 2px solid var(--color-border);
    border-radius: 16px;
    padding: 2rem;
    text-align: center;
    transition: all 0.3s ease;
    color: var(--color-text-primary);
  }

  .game-card.scheduled {
    border: 2px dashed var(--color-border);
    opacity: 0.7;
  }

  .game-card.testing {
    border: 2px solid #ef4444;
  }

  .game-card.scheduled .game-icon .grayscale {
    filter: grayscale(1);
    opacity: 0.5;
  }

  .game-card.scheduled .play-button {
    display: none;
  }

  .coming-soon-text {
    margin-top: 1.5rem;
    font-size: 1.1rem;
    color: var(--color-text-secondary);
    font-weight: 600;
    opacity: 0.8;
  }

  .game-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
  }

  .game-card h2 {
    font-size: 1.8rem;
    margin-bottom: 0.5rem;
    color: var(--color-text-primary);
  }

  .game-card p {
    color: var(--color-text-secondary);
    margin-bottom: 1.5rem;
    line-height: 1.6;
  }

  .play-button {
    background: var(--color-primary);
    color: white;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-weight: 600;
    display: inline-block;
    transition: background-color 0.3s ease;
  }

  .game-card:hover .play-button {
    background: var(--color-primary-dark);
  }

  .coming-soon {
    text-align: center;
    padding: 2rem;
    background: var(--color-bg-secondary);
    border-radius: 12px;
    border: 1px dashed var(--color-border);
  }

  .coming-soon h3 {
    color: var(--color-text-secondary);
    margin-bottom: 1rem;
  }

  .upcoming-games {
    display: flex;
    justify-content: center;
    gap: 2rem;
    flex-wrap: wrap;
  }

  .upcoming-game {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--color-text-secondary);
    font-size: 0.9rem;
  }

  .upcoming-game .icon {
    font-size: 1.2rem;
  }

  @media (max-width: 768px) {
    .container {
      padding: 1rem;
      padding-top: 100px;
    }

    .game-grid {
      grid-template-columns: 1fr;
    }

    h1 {
      font-size: 2.5rem;
    }

    .upcoming-games {
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }
  }
</style>
