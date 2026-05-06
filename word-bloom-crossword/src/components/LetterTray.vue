<script setup>
defineProps({
  selectedTileId: {
    type: String,
    default: "",
  },
  tiles: {
    type: Array,
    required: true,
  },
});

const emit = defineEmits(["select-tile"]);

function startDrag(event, tile) {
  if (tile.usedCellKey) {
    event.preventDefault();
    return;
  }

  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", tile.id);
}
</script>

<template>
  <section class="letter-tray" aria-label="letter cards">
    <div class="letter-card-grid">
      <button
        v-for="tile in tiles"
        :key="tile.id"
        class="letter-card"
        :class="{ selected: tile.id === selectedTileId, used: tile.usedCellKey }"
        type="button"
        :draggable="!tile.usedCellKey"
        :aria-pressed="tile.id === selectedTileId"
        @click="emit('select-tile', tile.id)"
        @dragstart="startDrag($event, tile)"
      >
        {{ tile.letter }}
      </button>
    </div>
  </section>
</template>
