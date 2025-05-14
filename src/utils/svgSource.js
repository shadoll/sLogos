/**
 * Fetches the SVG source code from a file path
 *
 * @param {string} path - Path to the SVG file
 * @returns {Promise<string>} - The SVG source code
 */
export async function fetchSvgSource(path) {
  try {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Failed to fetch SVG: ${response.status}`);
    }
    return await response.text();
  } catch (error) {
    console.error('Error fetching SVG source:', error);
    throw error;
  }
}

/**
 * Copy SVG source to clipboard
 *
 * @param {string} path - Path to the SVG file
 * @returns {Promise<string>} - The SVG source code
 */
export async function copySvgSource(path) {
  try {
    return await fetchSvgSource(path);
  } catch (error) {
    console.error('Error fetching SVG source:', error);
    throw error;
  }
}
