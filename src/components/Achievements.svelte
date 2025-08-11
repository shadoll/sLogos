<script>
  import { createEventDispatcher } from 'svelte';
  import InlineSvg from './InlineSvg.svelte';

  const dispatch = createEventDispatcher();

  // Props
  export let gameStats = { correct: 0, wrong: 0, total: 0, skipped: 0 };
  export let currentStreak = 0;
  export let show = false;

  // Achievement state
  let achievements = {};
  let newAchievements = [];

  // Achievement definitions
  const achievementDefinitions = {
    'first_correct': {
      name: 'First Victory',
      description: 'Answer your first question correctly',
      icon: 'smile-squre.svg',
      requirement: () => gameStats.correct >= 1
    },
    'perfect_10': {
      name: 'Perfect Ten',
      description: 'Answer 10 questions correctly without any mistakes',
      icon: 'medal-star.svg',
      requirement: () => currentStreak >= 10
    },
    'speedrunner': {
      name: 'Speed Runner',
      description: 'Skip 10 questions in a row',
      icon: 'running.svg',
      requirement: () => achievements.consecutive_skips >= 10
    },
    'explorer': {
      name: 'World Explorer',
      description: 'Answer 50 questions correctly',
      icon: 'crown-minimalistic.svg',
      requirement: () => gameStats.correct >= 50
    },
    'master': {
      name: 'Flag Master',
      description: 'Answer 100 questions correctly',
      icon: 'cup-first.svg',
      requirement: () => gameStats.correct >= 100
    },
    'persistent': {
      name: 'Persistent Scholar',
      description: 'Answer 25 questions (correct or wrong)',
      icon: 'medal-ribbons-star.svg',
      requirement: () => gameStats.total >= 25
    },
    'perfectionist': {
      name: 'Perfectionist',
      description: 'Achieve 90% accuracy with at least 20 answers',
      icon: 'medal-star-circle.svg',
      requirement: () => gameStats.total >= 20 && (gameStats.correct / gameStats.total) >= 0.9
    },
    'party_time': {
      name: 'Party Time!',
      description: 'Answer 5 questions correctly in a row',
      icon: 'confetti-minimalistic.svg',
      requirement: () => currentStreak >= 5
    },
    'dedication': {
      name: 'Dedicated Learner',
      description: 'Answer 10 questions in total',
      icon: 'check-circle.svg',
      requirement: () => gameStats.total >= 10
    },
    'legend': {
      name: 'Geography Legend',
      description: 'Answer 200 questions correctly',
      icon: 'crown-star.svg',
      requirement: () => gameStats.correct >= 200
    }
  };

  // Achievement functions
  export function loadAchievements() {
    try {
      const saved = localStorage.getItem('flagQuizAchievements');
      if (saved) {
        achievements = JSON.parse(saved);
      } else {
        achievements = { consecutive_skips: 0 };
      }
    } catch (error) {
      console.error('Error loading achievements:', error);
      achievements = { consecutive_skips: 0 };
    }
  }

  function saveAchievements() {
    localStorage.setItem('flagQuizAchievements', JSON.stringify(achievements));
  }

  export function checkAchievements() {
    const newUnlocked = [];

    Object.entries(achievementDefinitions).forEach(([key, achievement]) => {
      if (!achievements[key] && achievement.requirement()) {
        achievements[key] = {
          unlocked: true,
          unlockedAt: Date.now()
        };
        newUnlocked.push({
          key,
          ...achievement
        });
      }
    });

    if (newUnlocked.length > 0) {
      newAchievements = [...newAchievements, ...newUnlocked];
      saveAchievements();
      showNewAchievements();
      dispatch('achievementsUnlocked', newUnlocked);
    }
  }

  function showNewAchievements() {
    // Show achievement notifications briefly
    setTimeout(() => {
      newAchievements = [];
    }, 5000);
  }

  export function getUnlockedAchievements() {
    return Object.entries(achievements)
      .filter(([key, data]) => data.unlocked && achievementDefinitions[key])
      .map(([key, data]) => ({
        key,
        ...achievementDefinitions[key],
        ...data
      }));
  }

  export function getAchievementCount() {
    return {
      unlocked: Object.values(achievements).filter(a => a.unlocked).length,
      total: Object.keys(achievementDefinitions).length
    };
  }

  export function incrementConsecutiveSkips() {
    achievements.consecutive_skips = (achievements.consecutive_skips || 0) + 1;
    saveAchievements();
  }

  export function resetConsecutiveSkips() {
    achievements.consecutive_skips = 0;
    saveAchievements();
  }

  // Initialize achievements on component mount
  loadAchievements();

  function handleOverlayClick(event) {
    if (event.target === event.currentTarget) {
      show = false;
      dispatch('close');
    }
  }

  function handleOverlayKeydown(event) {
    if (event.key === 'Escape') {
      show = false;
      dispatch('close');
    }
  }

  function closeModal() {
    show = false;
    dispatch('close');
  }
</script>

<!-- Achievement display modal -->
{#if show}
  <div
    class="achievements-overlay"
    on:click={handleOverlayClick}
    tabindex="0"
    role="button"
    aria-label="Close achievements (click background or press Escape)"
    on:keydown={handleOverlayKeydown}
  >
    <div
      class="achievements-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="achievements-title"
    >
      <div class="achievements-header">
        <h2 id="achievements-title">🏆 Achievements</h2>
        <button class="close-btn" on:click={closeModal}>✕</button>
      </div>

      <div class="achievements-content">
        {#each Object.entries(achievementDefinitions) as [key, def]}
          <div class="achievement-item" class:unlocked={achievements[key]?.unlocked}>
            <div class="achievement-icon">
              <InlineSvg path={`/icons/${def.icon}`} alt={def.name} />
            </div>
            <div class="achievement-info">
              <div class="achievement-name">{def.name}</div>
              <div class="achievement-description">{def.description}</div>
              {#if achievements[key]?.unlocked}
                <div class="achievement-unlocked">
                  <div class="status-icon">
                    <InlineSvg path="/icons/check-circle.svg" alt="Unlocked" />
                  </div>
                  <span>Unlocked!</span>
                </div>
              {:else}
                <div class="achievement-locked">
                  <div class="status-icon">
                    <InlineSvg path="/icons/lock-locked.svg" alt="Locked" />
                  </div>
                  <span>Locked</span>
                </div>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>
{/if}

<!-- Achievement notifications -->
{#if newAchievements.length > 0}
  <div class="achievement-notifications">
    {#each newAchievements as achievement}
      <div class="achievement-notification" key={achievement.key}>
        <div class="notification-icon">
          <InlineSvg path={`/icons/${achievement.icon}`} alt="Achievement" />
        </div>
        <div class="notification-text">
          <div class="notification-title">Achievement Unlocked!</div>
          <div class="notification-name">{achievement.name}</div>
        </div>
      </div>
    {/each}
  </div>
{/if}

<style>
  /* Achievement modal styles */
  .achievements-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .achievements-modal {
    background: var(--color-bg-secondary);
    border: 2px solid var(--color-border);
    border-radius: 1rem;
    padding: 0;
    max-width: 600px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 10px 24px rgba(0,0,0,0.25);
  }

  .achievements-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid var(--color-border);
    position: sticky;
    top: 0;
    background: var(--color-bg-secondary);
    z-index: 1;
  }

  .achievements-header h2 {
    margin: 0;
    font-size: 1.5rem;
    color: var(--color-text-primary);
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--color-text-primary);
    padding: 0.25rem;
    border-radius: 0.25rem;
    transition: background-color 0.3s ease;
  }

  .close-btn:hover {
    background-color: var(--color-border);
  }

  .achievements-content {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .achievement-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border);
    border-radius: 0.5rem;
    transition: all 0.2s ease;
  }

  .achievement-item.unlocked {
    border-color: var(--color-primary);
    background: var(--color-primary-light);
  }

  .achievement-icon {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .achievement-item.unlocked .achievement-icon {
    color: #fbbf24;
  }

  .achievement-info {
    flex: 1;
  }

  .achievement-name {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--color-text-primary);
    margin-bottom: 0.25rem;
  }

  .achievement-description {
    font-size: 0.9rem;
    color: var(--color-text-secondary);
    margin-bottom: 0.5rem;
  }

  .achievement-unlocked {
    font-size: 0.8rem;
    color: #22c55e;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: end;
    gap: 0.25rem;
  }

  .achievement-locked {
    font-size: 0.8rem;
    color: var(--color-text-secondary);
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: end;
    gap: 0.25rem;
  }

  .status-icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .achievement-unlocked .status-icon {
    color: #22c55e;
  }

  .achievement-locked .status-icon {
    color: var(--color-text-secondary);
  }

  /* Achievement notifications */
  .achievement-notifications {
    position: fixed;
    top: 1rem;
    right: 1rem;
    z-index: 1100;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .achievement-notification {
    background: var(--color-primary);
    color: white;
    border-radius: 0.5rem;
    padding: 1rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    animation: slideInRight 0.3s ease-out;
    max-width: 300px;
  }

  .notification-icon {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255,255,255,0.2);
    border-radius: 50%;
  }

  .notification-text {
    flex: 1;
  }

  .notification-title {
    font-size: 0.875rem;
    font-weight: 600;
    margin-bottom: 0.25rem;
  }

  .notification-name {
    font-size: 0.75rem;
    opacity: 0.9;
  }

  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
</style>
