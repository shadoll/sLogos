/**
 * Generates an SVG pie chart representing the colors in a set
 * @param {Object} colors - The colors object from the logo
 * @param {Object} setConfig - The specific set configuration (mapping targets to colors)
 * @param {Number} size - The size of the circle in pixels
 * @return {String} SVG markup for the color circle
 */
export function generateColorSetCircle(colors, setConfig, size = 24) {
  // Get unique colors from the set (values in the setConfig)
  const colorNames = [...new Set(Object.values(setConfig))];

  // Limit to max 4 colors
  const limitedColorNames = colorNames.slice(0, 4);

  // If we have only one color, create a simple circle
  if (limitedColorNames.length === 1) {
    const colorValue = colors[limitedColorNames[0]];
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="${colorValue}" />
    </svg>`;
  }

  // For multiple colors, create pie segments
  const segments = [];
  const totalColors = limitedColorNames.length;
  const radius = size / 2;
  const center = { x: radius, y: radius };

  // Calculate segments for each color
  limitedColorNames.forEach((colorName, index) => {
    const colorValue = colors[colorName];
    const startAngle = (index / totalColors) * 2 * Math.PI;
    const endAngle = ((index + 1) / totalColors) * 2 * Math.PI;

    // Calculate points
    const startX = center.x + radius * Math.cos(startAngle);
    const startY = center.y + radius * Math.sin(startAngle);
    const endX = center.x + radius * Math.cos(endAngle);
    const endY = center.y + radius * Math.sin(endAngle);

    // Create path for the segment
    const largeArcFlag = endAngle - startAngle <= Math.PI ? 0 : 1;
    const path = `M${center.x},${center.y} L${startX},${startY} A${radius},${radius} 0 ${largeArcFlag},1 ${endX},${endY} Z`;

    segments.push(`<path d="${path}" fill="${colorValue}" />`);
  });

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    ${segments.join('\n    ')}
  </svg>`;
}
