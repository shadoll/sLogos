// quizAchievements.js
// Common achievement logic for all quizzes

export function updateAchievementCount(achievementsComponent) {
    if (achievementsComponent) {
        return achievementsComponent.getAchievementCount();
    }
    return { unlocked: 0, total: 0 };
}
