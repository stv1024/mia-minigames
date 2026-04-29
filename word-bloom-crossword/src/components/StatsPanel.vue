<script setup>
defineProps({
  badgeCount: {
    type: Number,
    required: true,
  },
  completedCount: {
    type: Number,
    required: true,
  },
  wordCount: {
    type: Number,
    required: true,
  },
});
</script>

<template>
  <div class="stat-row">
    <div class="stat">
      <strong>{{ completedCount }}</strong>
      <span>完成</span>
    </div>
    <div class="stat">
      <strong>{{ badgeCount }}</strong>
      <span>徽章</span>
    </div>
    <div class="stat">
      <strong>{{ wordCount }}</strong>
      <span>单词</span>
    </div>
  </div>
</template>
