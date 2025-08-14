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

// Return a new session state object for a quiz with the provided session length
export function createNewSessionState(sessionLength = 10) {
    return {
        score: { correct: 0, total: 0, skipped: 0 },
        currentSessionQuestions: 0,
        sessionStats: {
            correct: 0,
            wrong: 0,
            skipped: 0,
            total: 0,
            sessionLength: sessionLength,
        },
        sessionInProgress: true,
        sessionStartTime: Date.now(),
        showSessionResults: false,
        sessionRestoredFromReload: false,
    };
}
