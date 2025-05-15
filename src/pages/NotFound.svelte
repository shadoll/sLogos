<script>
  import { push } from 'svelte-spa-router';
  import Footer from '../components/Footer.svelte';
</script>

<div class="not-found">
  <h1>404: Page Not Found</h1>
  <p>The page you're looking for doesn't exist.</p>
  <button on:click={() => push('/')}>Return to Home</button>

  <Footer />
</div>

<style>
  .not-found {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 80vh;
    text-align: center;
  }

  h1 {
    font-size: 2rem;
    margin-bottom: 1rem;
    color: var(--color-accent);
  }

  p {
    margin-bottom: 2rem;
    color: var(--color-text);
    opacity: 0.8;
  }

  button {
    background: var(--color-accent);
    color: white;
    border: none;
    border-radius: 4px;
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    cursor: pointer;
    transition: background 0.2s;
  }

  button:hover {
    background: var(--color-accent-hover);
  }
</style>
