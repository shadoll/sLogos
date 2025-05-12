// Utility to pick the logo color for the current theme using the "theme" key only
export function getDefaultLogoColor(colors, theme = 'light') {
  if (!colors || Object.keys(colors).length === 0) return undefined;

  // Look through all colors to find one with a theme property
  for (const [colorName, colorValue] of Object.entries(colors)) {
    // If color value is an object with theme property matching current theme
    if (typeof colorValue === 'object' && colorValue.theme === theme) {
      return colorValue.value;
    }
  }

  // Fallback: do not colorize (undefined)
  return undefined;
}

// Utility to select the color with the matching theme key from the colors object
export function getThemeColor(colors, theme = 'light') {
  if (!colors || Object.keys(colors).length === 0) return undefined;

  // Look through all colors to find one with a theme property
  for (const [colorName, colorValue] of Object.entries(colors)) {
    // If color value is an object with theme property matching current theme
    if (typeof colorValue === 'object' && colorValue.theme === theme) {
      return colorValue.value;
    }
  }

  // Fallback: pick the first color
  return Object.values(colors)[0];
}
