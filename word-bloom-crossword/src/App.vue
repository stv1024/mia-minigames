<script setup>
import { ref } from "vue";
import AppHeader from "./components/AppHeader.vue";
import BadgeCollection from "./components/BadgeCollection.vue";
import GameView from "./components/GameView.vue";
import LevelListPage from "./components/LevelListPage.vue";
import RewardModal from "./components/RewardModal.vue";
import { useCrosswordGame } from "./composables/useCrosswordGame";

const view = ref("levels");
const game = useCrosswordGame({ view });
</script>

<template>
  <main class="shell">
    <AppHeader v-model:view="view" />

    <GameView v-if="view === 'game'" :game="game" />
    <LevelListPage
      v-else-if="view === 'levels'"
      :current-level-number="game.currentLevelNumber"
      :has-badge="game.hasBadge"
      :is-completed="game.isCompleted"
      :is-locked="game.isLocked"
      :levels="game.levels"
      @go-to-level="game.goToLevel"
    />
    <BadgeCollection
      v-else
      :badges="game.badges"
      :has-badge="game.hasBadge"
      @reset="game.resetProgress"
    />
  </main>

  <RewardModal
    v-if="game.modal.show"
    :modal="game.modal"
    :chapter-number="game.chapterNumber"
    :is-final-level="game.currentLevelNumber >= game.levels.length"
    @open-chest="game.openChest"
    @continue="game.continueAfterModal"
  />
</template>
