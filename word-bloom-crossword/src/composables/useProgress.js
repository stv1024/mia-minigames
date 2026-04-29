import { reactive, watch } from "vue";

const STORAGE_KEY = "mia-word-bloom-progress-v1";

function readStoredProgress() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (parsed && Array.isArray(parsed.completed) && Array.isArray(parsed.badges)) {
      return {
        completed: parsed.completed,
        badges: parsed.badges,
        maxUnlocked: Math.max(1, Math.min(50, parsed.maxUnlocked || 1)),
      };
    }
  } catch {
    // Damaged local progress should not block the game.
  }

  return { completed: [], badges: [], maxUnlocked: 1 };
}

export function useProgress() {
  const progress = reactive(readStoredProgress());

  watch(
    progress,
    () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    },
    { deep: true },
  );

  function completeLevel(levelNumber) {
    if (!progress.completed.includes(levelNumber)) {
      progress.completed.push(levelNumber);
      progress.completed.sort((a, b) => a - b);
    }
    progress.maxUnlocked = Math.max(progress.maxUnlocked, Math.min(50, levelNumber + 1));
  }

  function awardBadge(badgeId) {
    if (!progress.badges.includes(badgeId)) progress.badges.push(badgeId);
  }

  function hasBadge(badgeId) {
    return progress.badges.includes(badgeId);
  }

  function isCompleted(levelNumber) {
    return progress.completed.includes(levelNumber);
  }

  function isLocked(levelNumber) {
    return levelNumber > progress.maxUnlocked;
  }

  function resetProgress() {
    progress.completed.splice(0);
    progress.badges.splice(0);
    progress.maxUnlocked = 1;
  }

  return {
    awardBadge,
    completeLevel,
    hasBadge,
    isCompleted,
    isLocked,
    progress,
    resetProgress,
  };
}
