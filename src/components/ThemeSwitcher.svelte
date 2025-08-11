<script>
  import InlineSvg from "./InlineSvg.svelte";
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
      <span class="icon"><InlineSvg path="/icons/record.svg" alt="System theme" /></span>
    </button>
    <button
      on:click={() => setTheme("light")}
      class:active={theme === "light"}
      aria-label="Light mode"
    >
      <span class="icon"><InlineSvg path="/icons/sun.svg" alt="Light mode" /></span>
    </button>
    <button
      on:click={() => setTheme("dark")}
      class:active={theme === "dark"}
      aria-label="Dark mode"
    >
      <span class="icon"><InlineSvg path="/icons/moon.svg" alt="Dark mode" /></span>
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

  .theme-switch-group .icon {
    width: 20px;
    height: 20px;
    display: inline-flex;
  }
</style>
