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
  let svgSource = ""; // Store the updated SVG source code

  async function fetchAndColorSvg() {
    try {
      const res = await fetch(path);
      if (!res.ok) {
        svgHtml = `<svg width='100%' height='100%' viewBox='0 0 64 64' fill='none' xmlns='http://www.w3.org/2000/svg'><rect width='64' height='64' fill='#eee'/><line x1='16' y1='16' x2='48' y2='48' stroke='#888' stroke-width='4'/><line x1='48' y1='16' x2='16' y2='48' stroke='#888' stroke-width='4'/></svg>`;
        svgSource = svgHtml;
        return;
      }
      let text = await res.text();
      if (!color) {
        // No user-selected color, add currentColor to ensure theme colors are applied
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, "image/svg+xml");
        const svg = doc.documentElement;

        // Fix SVG dimensions here too
        const viewBox = svg.getAttribute('viewBox');
        if (viewBox) {
          // Remove any existing style and dimension attributes
          svg.removeAttribute('style');
          svg.removeAttribute('width');
          svg.removeAttribute('height');

          // Set percentage dimensions to allow scaling
          svg.setAttribute('width', '100%');
          svg.setAttribute('height', '100%');
          // svg.setAttribute('preserveAspectRatio', 'none');

          // Ensure viewBox is preserved for proper clipping
          svg.setAttribute('viewBox', viewBox);
        } else {
          svg.removeAttribute('style');
          svg.setAttribute('width', '100%');
          svg.setAttribute('height', '100%');
        }

        // Set currentColor on SVG element if no fill is specified
        if (!svg.hasAttribute("fill")) {
          svg.setAttribute("fill", "currentColor");
        }

        svgHtml = doc.documentElement.outerHTML;
        svgSource = svgHtml;
        return;
      }
      // Parse and update color only if user selected
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, "image/svg+xml");

      // Add proper SVG clipping first (before color processing)
      const svg = doc.documentElement;

      // Fix SVG dimensions based on viewBox
      const viewBox = svg.getAttribute('viewBox');
      if (viewBox) {
        // Remove any existing style attribute and fixed dimensions
        svg.removeAttribute('style');
        svg.removeAttribute('width');
        svg.removeAttribute('height');

        // Set percentage dimensions to allow scaling
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');

        // Ensure viewBox is preserved for proper clipping
        svg.setAttribute('viewBox', viewBox);

        // Add preserveAspectRatio to ensure proper scaling
        if (!svg.hasAttribute('preserveAspectRatio')) {
          svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        }
      } else {
        // If no viewBox, remove style and set percentage dimensions
        svg.removeAttribute('style');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
      }

      // Ensure proper overflow handling
      svg.setAttribute('overflow', 'visible'); // Let CSS handle the clipping

      // Now process color changes
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
      if (targets && sets && activeSet && typeof activeSet === 'string' && sets[activeSet]) {
        try {
          // Get the color assignments from the active set
          const colorAssignments = sets[activeSet];

          // Apply each target-color pair
          for (const [targetName, colorName] of Object.entries(colorAssignments)) {
            if (targets[targetName] && colors && colors[colorName]) {
              // Get the selector and determine if it's for fill or stroke
              const targetInfo = targets[targetName];

              // Parse the selector to extract the target and attribute (fill/stroke)
              let selector, attribute;

              if (typeof targetInfo === 'string') {
                if (targetInfo.includes('&stroke')) {
                  // Format: "#element&stroke" - target stroke attribute
                  selector = targetInfo.split('&stroke')[0];
                  attribute = 'stroke';
                } else if (targetInfo.includes('&fill')) {
                  // Format: "#element&fill" - target fill attribute
                  selector = targetInfo.split('&fill')[0];
                  attribute = 'fill';
                } else {
                  // Default is fill if not specified
                  selector = targetInfo;
                  attribute = 'fill';
                }
              } else {
                // Fallback for older format
                selector = targetInfo;
                attribute = 'fill';
              }

              // Proceed with selecting elements and applying colors
              const targetElements = doc.querySelectorAll(selector);
              const targetColor = colors[colorName];

              // Apply the color to all elements matching this selector
              targetElements.forEach(el => {
                if (colorName === "none") {
                  // Special case for 'none' value
                  el.setAttribute(attribute, "none");
                } else if (attribute === 'fill') {
                  el.setAttribute("fill", targetColor);
                } else if (attribute === 'stroke') {
                  el.setAttribute("stroke", targetColor);
                }
              });
            }
          }
        } catch (err) {
          console.error("Error applying color set:", err);
        }
      }
      svgHtml = doc.documentElement.outerHTML;
      // Update the svgSource property to store the modified SVG code
      svgSource = doc.documentElement.outerHTML;
    } catch (error) {
      console.error("Error fetching or processing SVG:", error);
      svgHtml = `<svg width='100%' height='100%' viewBox='0 0 64 64' fill='none' xmlns='http://www.w3.org/2000/svg'><rect width='64' height='64' fill='#eee'/><line x1='16' y1='16' x2='48' y2='48' stroke='#888' stroke-width='4'/><line x1='48' y1='16' x2='16' y2='48' stroke='#888' stroke-width='4'/></svg>`;
      svgSource = svgHtml;
    }
  }

  // Export the svgSource so it can be accessed from outside
  export function getSvgSource() {
    return svgSource;
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
    overflow: hidden;
    isolation: isolate;
    contain: layout style paint;
    position: relative;
  }

  .svg-wrapper :global(svg) {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
    transform-origin: center;
  }
</style>
