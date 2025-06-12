<script>
  export let theme = "system";
  export let setTheme = () => {};
</script>

<div class="theme-switcher">
  <div class="theme-switch-group button-group">
    <button
      on:click={() => setTheme("system")}
      class:active={theme === "system"}
      aria-label="System theme"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        ><circle
          cx="10"
          cy="10"
          r="8"
          stroke="currentColor"
          stroke-width="2"
        /><path
          d="M10 2a8 8 0 0 1 8 8"
          stroke="currentColor"
          stroke-width="2"
        /></svg
      >
    </button>
    <button
      on:click={() => setTheme("light")}
      class:active={theme === "light"}
      aria-label="Light mode"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        ><circle
          cx="10"
          cy="10"
          r="5"
          stroke="currentColor"
          stroke-width="2"
        /><path
          d="M10 1v2M10 17v2M3.22 3.22l1.42 1.42M15.36 15.36l1.42 1.42M1 10h2M17 10h2M3.22 16.78l1.42-1.42M15.36 4.64l1.42-1.42"
          stroke="currentColor"
          stroke-width="2"
        /></svg
      >
    </button>
    <button
      on:click={() => setTheme("dark")}
      class:active={theme === "dark"}
      aria-label="Dark mode"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        ><path
          d="M15.5 13A7 7 0 0 1 7 4.5a7 7 0 1 0 8.5 8.5z"
          stroke="currentColor"
          stroke-width="2"
        /></svg
      >
    </button>
  </div>
</div>

<style>
  .theme-switcher {
    display: flex;
    align-items: center;
    gap: 0.2rem;
    margin-left: auto;
  }
</style>
