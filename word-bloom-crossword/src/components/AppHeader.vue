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
      <template v-if="view === 'game'">
        <button class="tab" @click="emit('update:view', 'levels')">关卡列表</button>
      </template>
      <template v-else>
        <button class="tab" :class="{ active: view === 'levels' }" @click="emit('update:view', 'levels')">
          关卡列表
        </button>
        <button class="tab" :class="{ active: view === 'badges' }" @click="emit('update:view', 'badges')">
          Badge收藏
        </button>
      </template>
    </nav>
  </header>
</template>
