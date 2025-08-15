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

// Restore session helper: loads saved session state (if any) and returns a normalized object
export function restoreSessionState(key) {
    const loaded = loadSessionState(key, null);
    if (!loaded) return null;

    const session = {
        sessionInProgress: loaded.sessionInProgress || false,
        currentSessionQuestions: loaded.currentSessionQuestions || 0,
        sessionStats: loaded.sessionStats || {
            correct: 0,
            wrong: 0,
            skipped: 0,
            total: 0,
            sessionLength: loaded?.sessionStats?.sessionLength || 10,
        },
        score: loaded.score || { correct: 0, total: 0, skipped: 0 },
        currentQuestion: loaded.currentQuestion || null,
        selectedAnswer: loaded.selectedAnswer || null,
        showResult: loaded.showResult || false,
        gameState: loaded.gameState || "question",
        quizSubpage: loaded.quizSubpage || "quiz",
        sessionStartTime: loaded.sessionStartTime || null,
        questionKey: loaded.questionKey || 0,
        sessionRestoredFromReload: true,
    };

    return session;
}
