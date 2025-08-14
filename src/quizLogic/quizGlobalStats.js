// quizGlobalStats.js
// Common global statistics logic for all quizzes

export function loadGlobalStats(key) {
    const savedGlobalStats = localStorage.getItem(key);
    if (savedGlobalStats) {
        try {
            return JSON.parse(savedGlobalStats);
        } catch (e) {
            console.error("Error loading global stats:", e);
        }
    }
    return null;
}

export function updateGlobalStats(key, quizName, isCorrect, isSkipped = false) {
    let globalStats = {};
    const savedGlobalStats = localStorage.getItem(key);
    if (savedGlobalStats) {
        try {
            globalStats = JSON.parse(savedGlobalStats);
        } catch (e) {
            console.error("Error parsing global stats:", e);
        }
    }
    if (!globalStats[quizName]) {
        globalStats[quizName] = { correct: 0, wrong: 0, total: 0, skipped: 0 };
    }
    if (!globalStats.overall) {
        globalStats.overall = { correct: 0, wrong: 0, total: 0, skipped: 0 };
    }
    globalStats[quizName].total++;
    globalStats.overall.total++;
    if (isSkipped) {
        globalStats[quizName].skipped++;
        globalStats.overall.skipped++;
    } else if (isCorrect) {
        globalStats[quizName].correct++;
        globalStats.overall.correct++;
    } else {
        globalStats[quizName].wrong++;
        globalStats.overall.wrong++;
    }
    localStorage.setItem(key, JSON.stringify(globalStats));
    return globalStats;
}
