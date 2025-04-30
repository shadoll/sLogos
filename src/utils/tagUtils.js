// Shared tag data loading and utilities
let tagsDataPromise = null;
let tagsData = null;

// Load tags data once and cache it
export function loadTagsData() {
  if (!tagsDataPromise) {
    tagsDataPromise = fetch('/data/tags.json')
      .then(res => res.json())
      .then(data => {
        console.log('Tags data loaded successfully:', data);
        tagsData = data;
        return data;
      })
      .catch(err => {
        console.error('Failed to load tags data:', err);
        return {};
      });
  }
  return tagsDataPromise;
}

// Get tag object (with color) from tag text
export function getTagObj(text) {
  if (!tagsData) return { text };
  return tagsData[text] ? { text, ...tagsData[text] } : { text };
}
