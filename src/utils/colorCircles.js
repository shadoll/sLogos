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
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="${colorValue}" />
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

/**
 * Returns SVG markup for the default (no-color/reset) circle
 * @returns {string} SVG markup
 */
export function getNoColorCircle() {
  return `<svg width="100%" height="100%" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M400,0c220.766,0 400,179.234 400,400c0,220.766 -179.234,400 -400,400c-220.766,0 -400,-179.234 -400,-400c0,-220.766 179.234,-400 400,-400Zm-251.006,583.082l434.088,-434.088c-51.359,-37.541 -114.652,-59.71 -183.082,-59.71c-171.489,0 -310.716,139.227 -310.716,310.716c0,68.43 22.169,131.723 59.71,183.082Zm502.495,-365.501l-433.908,433.908c51.241,37.248 114.283,59.227 182.419,59.227c171.489,-0 310.716,-139.227 310.716,-310.716c-0,-68.136 -21.979,-131.178 -59.227,-182.419Z"
              fill="#33363f"
            />
          </svg>`;
}
