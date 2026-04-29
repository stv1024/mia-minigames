<script setup>
defineProps({
  view: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(["update:view"]);
</script>

<template>
  <header class="topbar">
    <div class="brand">
      <div class="brand-mark">🌸</div>
      <div>
        <h1>Mia's Word Bloom</h1>
        <div class="subtitle">Crossword spelling adventure</div>
      </div>
    </div>
    <nav class="tabs" aria-label="主导航">
      <button class="tab" :class="{ active: view === 'game' }" @click="emit('update:view', 'game')">
        闯关
      </button>
      <button class="tab" :class="{ active: view === 'badges' }" @click="emit('update:view', 'badges')">
        徽章
      </button>
    </nav>
  </header>
</template>
