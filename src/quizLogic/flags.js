// Utilities for loading and choosing flags used by quiz pages
export async function loadFlags({ requireCapital = false } = {}) {
  try {
    const response = await fetch('/data/flags.json');
    const data = await response.json();

    let flags = data.filter((flag) => {
      if (flag.disable) return false;
      if (!flag.meta?.country) return false;
      if (requireCapital && !flag.meta?.capital) return false;
      if (!flag.tags || !flag.tags.includes('Country')) return false;
      return true;
    });

    // Remove duplicates based on country name
    const uniqueFlags = [];
    const seenCountries = new Set();

    for (const flag of flags) {
      const countryName = (flag.meta.country || flag.name || '').toLowerCase().trim();
      if (!seenCountries.has(countryName)) {
        seenCountries.add(countryName);
        uniqueFlags.push(flag);
      }
    }

    return uniqueFlags;
  } catch (err) {
    console.error('flags.loadFlags error', err);
    return [];
  }
}

export function getCountryName(flag) {
  return flag?.meta?.country || flag?.name || 'Unknown';
}

export function getFlagImage(flag) {
  return `/images/flags/${flag.path}`;
}

// Pick a flag from a weighted list based on wrong/correct answer maps and settings
export function pickWeightedFlag(flags, { focusWrongAnswers = false, reduceCorrectAnswers = false } = {}, wrongAnswers = new Map(), correctAnswers = new Map()) {
  if (!Array.isArray(flags) || flags.length === 0) return null;

  // If no adaptive settings enabled, return a random flag
  if (!focusWrongAnswers && !reduceCorrectAnswers) {
    return flags[Math.floor(Math.random() * flags.length)];
  }

  const weighted = [];
  for (const flag of flags) {
    const wrongCount = wrongAnswers.get(flag.name) || 0;
    const correctCount = correctAnswers.get(flag.name) || 0;

    let weight = 1;
    if (focusWrongAnswers && wrongCount > 0) {
      weight = Math.min(wrongCount + 1, 4);
    }
    if (reduceCorrectAnswers && correctCount > 0) {
      weight = weight / Math.min(correctCount + 1, 4);
    }

    const finalWeight = Math.max(0.25, weight);
    const times = Math.ceil(finalWeight);
    for (let i = 0; i < times; i++) weighted.push(flag);
  }

  if (weighted.length > 0) {
    return weighted[Math.floor(Math.random() * weighted.length)];
  }
  return flags[Math.floor(Math.random() * flags.length)];
}
