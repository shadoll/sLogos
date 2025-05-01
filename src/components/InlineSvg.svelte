<script>
  import { onMount } from "svelte";
  export let path;
  export let color;
  export let colorConfig = { target: "path", attribute: "fill" };
  export const alt = "";

  let svgHtml = "";

  async function fetchAndColorSvg() {
    const res = await fetch(path);
    let text = await res.text();
    if (!color) {
      // No user-selected color, render as-is (SVG uses fill="currentColor")
      svgHtml = text;
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
    let targets;
    if (colorConfig.selector) {
      targets = doc.querySelectorAll(colorConfig.selector);
    } else if (colorConfig.target) {
      targets = doc.querySelectorAll(colorConfig.target);
    } else {
      targets = [];
    }
    targets.forEach((el) => {
      if (colorConfig.attribute) {
        // Legacy: force a single attribute
        el.setAttribute(colorConfig.attribute, color);
      } else {
        // Always override fill and stroke unless they are 'none'
        if (el.hasAttribute("fill") && el.getAttribute("fill") !== "none") {
          el.setAttribute("fill", color);
        }
        if (el.hasAttribute("stroke") && el.getAttribute("stroke") !== "none") {
          el.setAttribute("stroke", color);
        }
        if (!el.hasAttribute("fill") && !el.hasAttribute("stroke")) {
          // If neither, prefer fill
          el.setAttribute("fill", color);
        }
      }
    });
    svgHtml = doc.documentElement.outerHTML;
  }

  $: path, color, colorConfig, fetchAndColorSvg();
</script>

{@html svgHtml}
