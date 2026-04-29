<script setup>
defineProps({
  currentPlacementId: {
    type: Number,
    required: true,
  },
  isPlacementComplete: {
    type: Function,
    required: true,
  },
  placements: {
    type: Array,
    required: true,
  },
});

defineEmits(["select-placement"]);
</script>

<template>
  <h3 class="section-title">Clues</h3>
  <div class="clue-list">
    <button
      v-for="placement in placements"
      :key="placement.id"
      class="clue"
      :class="{ active: placement.id === currentPlacementId, done: isPlacementComplete(placement) }"
      @click="$emit('select-placement', placement.id)"
    >
      <span class="clue-main">
        <span>{{ placement.number }}. {{ placement.icon }} {{ placement.zh }}</span>
        <span>{{ placement.direction === "across" ? "→" : "↓" }}</span>
      </span>
      <small>{{ placement.clue }} · {{ placement.word.length }} letters</small>
    </button>
  </div>
</template>
