import App from './App.svelte';

new App({ target: document.getElementById('app') });

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js');
  });
}
