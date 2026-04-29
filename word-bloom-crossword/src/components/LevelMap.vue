<script setup>
defineProps({
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
</script>

<template>
  <h3 class="section-title">Levels</h3>
  <div class="level-map">
    <button
      v-for="level in levels"
      :key="level.number"
      class="level-pill"
      :class="{
        current: level.number === currentLevelNumber,
        done: isCompleted(level.number),
        locked: isLocked(level.number),
      }"
      :disabled="isLocked(level.number)"
      @click="$emit('go-to-level', level.number)"
    >
      {{ isLocked(level.number) ? "🔒" : level.number }}
    </button>
  </div>
</template>
