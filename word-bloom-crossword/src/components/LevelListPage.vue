<script setup>
import { computed, ref } from "vue";
import { badges } from "../data/badges";
import { chapters as chapterDefinitions } from "../data/chapters";

const props = defineProps({
  currentLevelNumber: {
    type: Number,
    required: true,
  },
  isCompleted: {
    type: Function,
    required: true,
  },
  isLocked: {
    type: Function,
    required: true,
  },
  hasBadge: {
    type: Function,
    required: true,
  },
  levels: {
    type: Array,
    required: true,
  },
});

defineEmits(["go-to-level"]);

const selectedRewardChapter = ref(null);

const chapters = computed(() => {
  const groups = [];
  for (let index = 0; index < props.levels.length; index += 5) {
    const levels = props.levels.slice(index, index + 5);
    groups.push({
      number: Math.floor(index / 5) + 1,
      title: chapterDefinitions[Math.floor(index / 5)]?.title ?? `Chapter ${Math.floor(index / 5) + 1}`,
      levels,
      badge: badges[Math.floor(index / 5)],
    });
  }
  return groups;
});

function chestState(chapter) {
  if (chapter.badge && props.hasBadge(chapter.badge.id)) return "claimed";
  return "locked";
}

function toggleReward(chapterNumber) {
  selectedRewardChapter.value = selectedRewardChapter.value === chapterNumber ? null : chapterNumber;
}

function rewardTitle(chapter) {
  if (chestState(chapter) === "claimed" && chapter.badge) return `已获得：${chapter.badge.name}`;
  return "神秘礼物";
}

function rewardText(chapter) {
  if (chestState(chapter) === "claimed" && chapter.badge) return chapter.badge.note;
  return "通关本章节后开启，里面藏着新的收藏惊喜。";
}
</script>

<template>
  <section class="levels-page">
    <div class="chapter-list">
      <article v-for="chapter in chapters" :key="chapter.number" class="chapter-card">
        <div class="chapter-card-head">
          <div>
            <h3>Chapter {{ chapter.number }} · {{ chapter.title }}</h3>
          </div>

          <button
            class="chapter-reward"
            :class="chestState(chapter)"
            type="button"
            :aria-expanded="selectedRewardChapter === chapter.number"
            @click="toggleReward(chapter.number)"
          >
            {{ chestState(chapter) === "claimed" && chapter.badge ? chapter.badge.emoji : "🎁" }}
          </button>
        </div>

        <div v-if="selectedRewardChapter === chapter.number" class="chapter-reward-note">
          <strong>{{ rewardTitle(chapter) }}</strong>
          <span>{{ rewardText(chapter) }}</span>
        </div>

        <div class="level-list-grid">
          <button
            v-for="level in chapter.levels"
            :key="level.number"
            class="level-card"
            :class="{
              current: level.number === currentLevelNumber,
              done: isCompleted(level.number),
              locked: isLocked(level.number),
            }"
            :disabled="isLocked(level.number)"
            @click="$emit('go-to-level', level.number)"
          >
            <span class="level-card-number">{{ isLocked(level.number) ? "🔒" : level.number }}</span>
          </button>
        </div>
      </article>
    </div>
  </section>
</template>
