<script setup>
import ClueList from "./ClueList.vue";
import CrosswordBoard from "./CrosswordBoard.vue";
import StatsPanel from "./StatsPanel.vue";

defineProps({
  game: {
    type: Object,
    required: true,
  },
});
</script>

<template>
  <section class="game-layout">
    <div class="board-panel">
      <div class="level-head">
        <div>
          <div class="eyebrow">Chapter {{ game.chapterNumber }} · Level {{ game.currentLevel.number }}</div>
          <h2 class="level-title">{{ game.currentLevel.title }}</h2>
        </div>
        <div class="chapter-track">
          <div class="progress-line" aria-hidden="true">
            <div class="progress-fill" :style="{ width: `${game.chapterProgress}%` }"></div>
          </div>
          <div class="chapter-text">{{ game.currentChapter.title }} · {{ game.chapterDoneCount }}/5</div>
        </div>
      </div>

      <CrosswordBoard
        :answers="game.answers"
        :cell-class="game.cellClass"
        :grid="game.grid"
        :shake="game.shakeBoard"
        @select-cell="game.selectCell"
      />
    </div>

    <aside class="side-panel">
      <StatsPanel
        :badge-count="game.progress.badges.length"
        :completed-count="game.completedCount"
        :word-count="game.currentLevel.words.length"
      />

      <ClueList
        :current-placement-id="game.currentPlacementId"
        :is-placement-complete="game.isPlacementComplete"
        :placements="game.placements"
        @select-placement="game.selectPlacement"
      />

      <div class="actions">
        <button class="primary" @click="game.checkAnswers">检查</button>
        <button class="ghost" @click="game.clearLevel">清空本关</button>
      </div>
    </aside>
  </section>
</template>
