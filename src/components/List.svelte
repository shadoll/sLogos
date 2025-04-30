<script>
  import Preview from './Preview.svelte';
  import Actions from './Actions.svelte';
  import Row from './Row.svelte';
  import { onMount, onDestroy } from 'svelte';

  export let logos = [];
  export let onCopy;
  export let onDownload;

  let showModal = false;
  let selectedLogo = null;

  export let theme;
</script>

<Preview show={showModal} logo={selectedLogo} theme={theme} on:close={() => showModal = false} />

<div class="logo-list">
  {#each logos as logo}
    <Row {logo} view="list" showActions={true} onPreview={() => { selectedLogo = logo; showModal = true; }}>
      <svelte:fragment slot="actions">
        <Actions {logo} {onCopy} {onDownload} />
      </svelte:fragment>
    </Row>
  {/each}
</div>

<style>
  .logo-list {
    display: flex;
    flex-direction: column;
    gap: 0.5em;
  }
</style>
