// quizSession.js
// Common session management logic for all quizzes

export function saveSessionState(key, state) {
    localStorage.setItem(key, JSON.stringify(state));
}

export function loadSessionState(key, defaultState) {
    const savedState = localStorage.getItem(key);
    if (savedState) {
        try {
            return JSON.parse(savedState);
        } catch (e) {
            console.error("Error loading session state:", e);
            return defaultState;
        }
    }
    return defaultState;
}

export function clearSessionState(key) {
    localStorage.removeItem(key);
}
