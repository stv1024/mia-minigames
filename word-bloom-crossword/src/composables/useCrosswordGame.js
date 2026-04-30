import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import { badges } from "../data/badges";
import { chapters } from "../data/chapters";
import { levels } from "../data/levels";
import { words } from "../data/words";
import { buildPuzzle } from "../utils/crossword";
import { useProgress } from "./useProgress";

export function useCrosswordGame({ view }) {
  const currentLevelNumber = ref(1);
  const currentPlacementId = ref(1);
  const answers = reactive({});
  const wrongCells = ref(new Set());
  const selectedCellKey = ref("");
  const shakeBoard = ref(false);
  const modal = reactive({ show: false, type: "level", opened: false, badge: null });
  const progressState = useProgress();
  const { progress } = progressState;

  const currentLevel = computed(() => levels[currentLevelNumber.value - 1]);
  const chapterNumber = computed(() => Math.ceil(currentLevelNumber.value / 5));
  const currentChapter = computed(() => chapters[chapterNumber.value - 1]);
  const chapterLevels = computed(() => {
    const start = (chapterNumber.value - 1) * 5 + 1;
    return levels.slice(start - 1, start + 4);
  });
  const chapterDoneCount = computed(() => (
    chapterLevels.value.filter((level) => progress.completed.includes(level.number)).length
  ));
  const chapterProgress = computed(() => (chapterDoneCount.value / 5) * 100);
  const completedCount = computed(() => progress.completed.length);
  const puzzle = computed(() => buildPuzzle(currentLevel.value.words));
  const grid = computed(() => puzzle.value);
  const placements = computed(() => (
    puzzle.value.placements.map((placement) => ({
      ...placement,
      ...words[placement.word],
    }))
  ));
  const currentPlacement = computed(() => (
    placements.value.find((placement) => placement.id === currentPlacementId.value) || placements.value[0]
  ));

  function clearLevel() {
    Object.keys(answers).forEach((key) => delete answers[key]);
    wrongCells.value = new Set();
    selectedCellKey.value = placements.value[0]?.cells[0] || "";
  }

  function selectCell(cell) {
    if (!cell.active) return;
    selectedCellKey.value = cell.key;
    if (currentPlacement.value?.cells.includes(cell.key)) return;

    const placement = placements.value.find((item) => item.cells.includes(cell.key));
    if (placement) currentPlacementId.value = placement.id;
  }

  function selectPlacement(id) {
    currentPlacementId.value = id;
    const placement = placements.value.find((item) => item.id === id);
    selectedCellKey.value = placement?.cells.find((key) => !answers[key]) || placement?.cells[0] || "";
  }

  function cellClass(cell) {
    return {
      blank: !cell.active,
      active: cell.active,
      selected: cell.key === selectedCellKey.value,
      related: cell.active && currentPlacement.value?.cells.includes(cell.key),
      wrong: wrongCells.value.has(cell.key),
    };
  }

  function isPlacementComplete(placement) {
    return placement.cells.every((key, index) => (
      (answers[key] || "").toLowerCase() === placement.word[index]
    ));
  }

  function moveSelection(step) {
    const placement = currentPlacement.value;
    if (!placement) return;

    const index = placement.cells.indexOf(selectedCellKey.value);
    const nextIndex = Math.max(0, Math.min(placement.cells.length - 1, index + step));
    selectedCellKey.value = placement.cells[nextIndex];
  }

  function typeLetter(letter) {
    if (!selectedCellKey.value) selectedCellKey.value = currentPlacement.value?.cells[0] || "";
    answers[selectedCellKey.value] = letter.toUpperCase();
    wrongCells.value = new Set([...wrongCells.value].filter((key) => key !== selectedCellKey.value));
    moveSelection(1);
  }

  function handleKeydown(event) {
    if (modal.show || view.value !== "game") return;

    if (/^[a-zA-Z]$/.test(event.key)) {
      event.preventDefault();
      typeLetter(event.key);
      return;
    }

    if (event.key === "Backspace") {
      event.preventDefault();
      if (answers[selectedCellKey.value]) {
        answers[selectedCellKey.value] = "";
      } else {
        moveSelection(-1);
        answers[selectedCellKey.value] = "";
      }
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      checkAnswers();
      return;
    }

    if (["ArrowRight", "ArrowDown"].includes(event.key)) {
      event.preventDefault();
      moveSelection(1);
    } else if (["ArrowLeft", "ArrowUp"].includes(event.key)) {
      event.preventDefault();
      moveSelection(-1);
    }
  }

  function checkAnswers() {
    const wrong = new Set();
    grid.value.cells.forEach((cell) => {
      if (!cell.active) return;
      if ((answers[cell.key] || "").toLowerCase() !== cell.letter) wrong.add(cell.key);
    });

    wrongCells.value = wrong;
    if (wrong.size > 0) {
      shakeBoard.value = true;
      window.setTimeout(() => {
        shakeBoard.value = false;
      }, 320);
      return;
    }

    completeCurrentLevel();
  }

  function completeCurrentLevel() {
    const levelNumber = currentLevelNumber.value;
    progressState.completeLevel(levelNumber);

    const chapterIndex = Math.ceil(levelNumber / 5) - 1;
    const chapterComplete = levelNumber % 5 === 0;
    const badge = badges[chapterIndex];

    if (chapterComplete && badge && !progress.badges.includes(badge.id)) {
      modal.show = true;
      modal.type = "chest";
      modal.opened = false;
      modal.badge = badge;
      return;
    }

    modal.show = true;
    modal.type = "level";
    modal.opened = true;
    modal.badge = null;
  }

  function openChest() {
    if (!modal.badge) return;
    progressState.awardBadge(modal.badge.id);
    modal.opened = true;
  }

  function continueAfterModal() {
    modal.show = false;
    if (currentLevelNumber.value >= levels.length) {
      view.value = "badges";
      return;
    }
    goToLevel(currentLevelNumber.value + 1);
  }

  function goToLevel(levelNumber) {
    if (progressState.isLocked(levelNumber)) return;
    currentLevelNumber.value = levelNumber;
    view.value = "game";
    nextTick(() => {
      selectedCellKey.value = placements.value[0]?.cells[0] || "";
    });
  }

  function resetProgress() {
    if (!window.confirm("确定要清空所有关卡和徽章进度吗？")) return;
    progressState.resetProgress();
    currentLevelNumber.value = 1;
    view.value = "levels";
    clearLevel();
  }

  watch(currentLevelNumber, () => {
    clearLevel();
    currentPlacementId.value = 1;
  });

  onMounted(() => {
    window.addEventListener("keydown", handleKeydown);
    currentLevelNumber.value = Math.min(progress.maxUnlocked, levels.length);
    nextTick(() => {
      selectedCellKey.value = placements.value[0]?.cells[0] || "";
    });
  });

  onUnmounted(() => {
    window.removeEventListener("keydown", handleKeydown);
  });

  return reactive({
    answers,
    badges,
    cellClass,
    chapterDoneCount,
    chapterNumber,
    chapterProgress,
    checkAnswers,
    clearLevel,
    completedCount,
    continueAfterModal,
    currentChapter,
    currentLevel,
    currentLevelNumber,
    currentPlacementId,
    grid,
    goToLevel,
    hasBadge: progressState.hasBadge,
    isCompleted: progressState.isCompleted,
    isLocked: progressState.isLocked,
    isPlacementComplete,
    levels,
    modal,
    openChest,
    placements,
    progress,
    resetProgress,
    selectCell,
    selectPlacement,
    shakeBoard,
  });
}
