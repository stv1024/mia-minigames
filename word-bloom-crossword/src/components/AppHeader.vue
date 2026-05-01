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
  <header class="topbar" :class="{ 'game-topbar': view === 'game' }">
    <template v-if="view === 'game'">
      <nav class="tabs" aria-label="主导航">
        <button class="tab back-tab" @click="emit('update:view', 'levels')">← 关卡</button>
      </nav>
    </template>

    <template v-else>
      <div class="brand">
        <div class="brand-mark">🌸</div>
        <div>
          <h1>Mia's Word Bloom</h1>
          <div class="subtitle">Crossword spelling adventure</div>
        </div>
      </div>
      <nav class="tabs" aria-label="主导航">
        <button class="tab" :class="{ active: view === 'levels' }" @click="emit('update:view', 'levels')">
          关卡列表
        </button>
        <button class="tab" :class="{ active: view === 'badges' }" @click="emit('update:view', 'badges')">
          Badge收藏
        </button>
      </nav>
    </template>
  </header>
</template>
