// quizSettings.js
// Common settings management logic for all quizzes

export function saveSettings(key, settings) {
    localStorage.setItem(key, JSON.stringify(settings));
}

export function loadSettings(key, defaultSettings) {
    const savedSettings = localStorage.getItem(key);
    if (savedSettings) {
        try {
            return JSON.parse(savedSettings);
        } catch (e) {
            console.error("Error loading settings:", e);
            return defaultSettings;
        }
    }
    return defaultSettings;
}
