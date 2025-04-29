<script>
  import { onMount } from 'svelte';
  export let path;
  export let color;
  export let colorConfig = { target: 'path', attribute: 'fill' };

  let svgHtml = '';

  async function fetchAndColorSvg() {
    const res = await fetch(path);
    let text = await res.text();
    // Parse and update color
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'image/svg+xml');
    const targets = doc.querySelectorAll(colorConfig.selector || colorConfig.target);
    targets.forEach(el => {
      el.setAttribute(colorConfig.attribute, color);
    });
    svgHtml = doc.documentElement.outerHTML;
  }

  $: path, color, colorConfig, fetchAndColorSvg();
</script>

{@html svgHtml}
