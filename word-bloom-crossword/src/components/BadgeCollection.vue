<script setup>
defineProps({
  badges: {
    type: Array,
    required: true,
  },
  hasBadge: {
    type: Function,
    required: true,
  },
});

defineEmits(["reset"]);
</script>

<template>
  <section class="badges-panel">
    <div class="level-head">
      <div>
        <div class="eyebrow">Badge Collection</div>
        <h2 class="level-title">宝箱徽章</h2>
      </div>
      <button class="ghost" @click="$emit('reset')">重置进度</button>
    </div>

    <div class="badge-grid">
      <article
        v-for="badge in badges"
        :key="badge.id"
        class="badge"
        :class="{ locked: !hasBadge(badge.id) }"
      >
        <span class="badge-emoji">{{ hasBadge(badge.id) ? badge.emoji : "🎁" }}</span>
        <strong>{{ hasBadge(badge.id) ? badge.name : `第 ${badge.chapter} 章宝箱` }}</strong>
        <span>{{ hasBadge(badge.id) ? badge.note : `完成第 ${badge.from}-${badge.to} 关后开启` }}</span>
      </article>
    </div>
  </section>
</template>
