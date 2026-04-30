<script setup>
import { computed } from "vue";

const props = defineProps({
  completedCount: {
    type: Number,
    required: true,
  },
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
      levels,
      completed: levels.filter((level) => props.isCompleted(level.number)).length,
    });
  }
  return groups;
});
</script>

<template>
  <section class="levels-page">
    <div class="level-head">
      <div>
        <div class="eyebrow">Level Select</div>
        <h2 class="level-title">关卡列表</h2>
      </div>
      <div class="level-summary">
        <strong>{{ completedCount }}/{{ levels.length }}</strong>
        <span>已完成</span>
      </div>
    </div>

    <div class="chapter-list">
      <article v-for="chapter in chapters" :key="chapter.number" class="chapter-card">
        <div class="chapter-card-head">
          <div>
            <h3>Chapter {{ chapter.number }}</h3>
            <span>{{ chapter.completed }}/{{ chapter.levels.length }} completed</span>
          </div>
          <div class="chapter-card-progress" aria-hidden="true">
            <div :style="{ width: `${(chapter.completed / chapter.levels.length) * 100}%` }"></div>
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
            <span class="level-card-title">{{ level.title }}</span>
          </button>
        </div>
      </article>
    </div>
  </section>
</template>
