<script setup>
import ClueList from "./ClueList.vue";
import CrosswordBoard from "./CrosswordBoard.vue";
import LetterTray from "./LetterTray.vue";
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
        <div class="game-level-label">Chapter {{ game.chapterNumber }} · Level {{ game.currentLevel.number }}</div>
      </div>

      <CrosswordBoard
        :answers="game.answers"
        :cell-class="game.cellClass"
        :grid="game.grid"
        :shake="game.shakeBoard"
        @drop-tile="(cell, tileId) => game.placeTileOnCell(tileId, cell.key)"
        @select-cell="game.selectCell"
      />

      <LetterTray
        :selected-tile-id="game.selectedTileId"
        :tiles="game.letterTiles"
        @select-tile="game.selectTile"
      />
    </div>

    <aside class="side-panel">
      <div class="desktop-stats">
        <StatsPanel
          :badge-count="game.progress.badges.length"
          :completed-count="game.completedCount"
          :word-count="game.currentLevel.words.length"
        />
      </div>

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
