<script setup>
defineProps({
  answers: {
    type: Object,
    required: true,
  },
  cellClass: {
    type: Function,
    required: true,
  },
  grid: {
    type: Object,
    required: true,
  },
  shake: {
    type: Boolean,
    default: false,
  },
});

defineEmits(["select-cell"]);
</script>

<template>
  <div class="puzzle-wrap" :class="{ shake }">
    <div
      class="crossword-grid"
      :style="{ gridTemplateColumns: `repeat(${grid.cols}, minmax(0, 1fr))` }"
      role="grid"
      aria-label="crossword board"
    >
      <button
        v-for="cell in grid.cells"
        :key="cell.key"
        class="cell"
        :class="cellClass(cell)"
        :disabled="!cell.active"
        :style="{ gridColumn: cell.col + 1, gridRow: cell.row + 1 }"
        @click="$emit('select-cell', cell)"
      >
        <span v-if="cell.number" class="cell-number">{{ cell.number }}</span>
        <span v-if="cell.active" class="cell-letter">{{ answers[cell.key] || "" }}</span>
      </button>
    </div>
  </div>
</template>
