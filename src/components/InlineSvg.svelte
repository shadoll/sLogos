<script>
  import { onMount } from "svelte";
  export let path;
  export let color;
  export let colorConfig = { target: "path", attribute: "fill" };
  export let targets = null;
  export let sets = null;
  export let activeSet = null;
  export let colors = null;
  export let alt = "";
  let svgHtml = "";

  async function fetchAndColorSvg() {
    const res = await fetch(path);
    let text = await res.text();
    if (!color) {
      // No user-selected color, add currentColor to ensure theme colors are applied
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, "image/svg+xml");
      const svg = doc.documentElement;

      // Set currentColor on SVG element if no fill is specified
      if (!svg.hasAttribute("fill")) {
        svg.setAttribute("fill", "currentColor");
      }

      svgHtml = doc.documentElement.outerHTML;
      return;
    }
    // Parse and update color only if user selected
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "image/svg+xml");
    // 1. Parse <style> rules and apply as inline attributes before removing <style>
    const styleEls = Array.from(doc.querySelectorAll("style"));
    styleEls.forEach((styleEl) => {
      const css = styleEl.textContent;
      // Only handle simple .class { ... } rules
      const regex = /\.([\w-]+)\s*{([^}]*)}/g;
      let match;
      while ((match = regex.exec(css))) {
        const className = match[1];
        const rules = match[2];
        // Find all elements with this class
        doc.querySelectorAll("." + className).forEach((el) => {
          rules.split(";").forEach((rule) => {
            const [prop, value] = rule.split(":").map((s) => s && s.trim());
            if (prop && value) {
              // Apply all style properties, not just fill/stroke
              el.setAttribute(
                prop.replace(/-([a-z])/g, (g) => g[1].toUpperCase()),
                value,
              );
            }
          });
        });
      }
    });
    // Remove all <style> elements
    styleEls.forEach((styleEl) => styleEl.remove());
    // Handle the new format with targets and sets if available
    if (targets && sets && activeSet && sets[activeSet]) {
      // Get the color assignments from the active set
      const colorAssignments = sets[activeSet];

      // Apply each target-color pair
      for (const [targetName, colorName] of Object.entries(colorAssignments)) {
        if (targets[targetName] && colors && colors[colorName]) {
          // Get the selector for this target
          const selector = targets[targetName];
          const targetElements = doc.querySelectorAll(selector);
          // Get the actual color value for this target
          const targetColor = colors[colorName];

          // Apply the color to all elements matching this selector
          targetElements.forEach(el => {
            // Always override fill and stroke unless they are 'none'
            if (el.hasAttribute("fill") && el.getAttribute("fill") !== "none") {
              el.setAttribute("fill", targetColor);
            }
            if (el.hasAttribute("stroke") && el.getAttribute("stroke") !== "none") {
              el.setAttribute("stroke", targetColor);
            }
            if (!el.hasAttribute("fill") && !el.hasAttribute("stroke")) {
              // If neither, prefer fill
              el.setAttribute("fill", targetColor);
            }
          });
        }
      }
    }
    svgHtml = doc.documentElement.outerHTML;
  }

  $: path, color, colorConfig, targets, sets, activeSet, colors, fetchAndColorSvg();
</script>

<div class="svg-wrapper" role="img" aria-label={alt || "SVG image"}>
  {@html svgHtml}
</div>

<style>
  .svg-wrapper {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .svg-wrapper :global(svg) {
    width: 100%;
    height: 100%;
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }
</style>
