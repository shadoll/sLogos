<script>
  import { onMount } from 'svelte';

  export let text = '';
  export let type = 'success'; // 'success' or 'error'
  export let duration = 3000;
  export let show = false;
  export let onClose = () => {};

  let timeoutId;

  $: if (show) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      onClose();
    }, duration);
  }

  onMount(() => {
    return () => {
      clearTimeout(timeoutId);
    };
  });
</script>

{#if show}
  <div class="notification {type}" role="alert">
    {text}
  </div>
{/if}

<style>
  .notification {
    position: fixed;
    top: 2.5rem;
    right: 2.5rem;
    color: #fff;
    padding: 0.9em 2em;
    border-radius: 2em;
    font-size: 1.1em;
    font-weight: 600;
    box-shadow: 0 2px 16px 4px rgba(0,0,0,0.18);
    z-index: 99999;
    opacity: 0.97;
    pointer-events: none;
    transition: opacity 0.3s, background 0.3s;
    animation: fadeInOut 3s ease-in-out;
  }
  .notification.success {
    background: #27ae60;
  }
  .notification.error {
    background: #e74c3c;
  }
  @keyframes fadeInOut {
    0%, 90% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
  }
</style>
