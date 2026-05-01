<script setup>
import { computed } from "vue";
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
</script>

<template>
  <section class="levels-page">
    <div class="level-head">
      <div>
        <div class="eyebrow">Level Select</div>
        <h2 class="level-title">关卡列表</h2>
      </div>
    </div>

    <div class="chapter-list">
      <article v-for="chapter in chapters" :key="chapter.number" class="chapter-card">
        <div class="chapter-card-head">
          <div>
            <h3>Chapter {{ chapter.number }} · {{ chapter.title }}</h3>
          </div>

          <div class="chapter-reward" :class="chestState(chapter)">
            {{ chestState(chapter) === "claimed" && chapter.badge ? chapter.badge.emoji : "🎁" }}
          </div>
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
