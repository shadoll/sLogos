// Utility to pick the logo color for the current theme using the "theme" key only
export function getDefaultLogoColor(colors, theme = 'light') {
  if (!colors || colors.length === 0) return undefined;
  // Use the color with the matching theme key if present
  const match = colors.find(c => c.theme === theme);
  if (match) return match.value;
  // Fallback: do not colorize (undefined)
  return undefined;
}

// Utility to select the color with the matching theme key from the colors array
export function getThemeColor(colors, theme = 'light') {
  if (!colors || colors.length === 0) return undefined;
  // Try to find a color with the matching theme key
  const match = colors.find(c => c.theme === theme);
  if (match) return match.value;
  // Fallback: pick the first color
  return colors[0].value;
}
