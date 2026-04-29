<script setup>
import { computed } from "vue";

const props = defineProps({
  chapterNumber: {
    type: Number,
    required: true,
  },
  isFinalLevel: {
    type: Boolean,
    required: true,
  },
  modal: {
    type: Object,
    required: true,
  },
});

defineEmits(["continue", "open-chest"]);

const icon = computed(() => {
  if (props.modal.type === "chest") return props.modal.opened && props.modal.badge ? props.modal.badge.emoji : "🎁";
  return "🌼";
});

const title = computed(() => {
  if (props.modal.type === "chest") {
    return props.modal.opened && props.modal.badge ? props.modal.badge.name : `第 ${props.chapterNumber} 章完成`;
  }
  return "拼写完成";
});

const text = computed(() => {
  if (props.modal.type === "chest") {
    return props.modal.opened && props.modal.badge ? props.modal.badge.note : "章节宝箱已经准备好了。";
  }
  return props.isFinalLevel ? "50 个固定关卡已经全部完成。" : "下一关会多一点点挑战。";
});
</script>

<template>
  <div class="modal-backdrop">
    <div class="modal">
      <div class="modal-icon">{{ icon }}</div>
      <h2>{{ title }}</h2>
      <p>{{ text }}</p>
      <button
        v-if="modal.type === 'chest' && !modal.opened"
        class="primary"
        @click="$emit('open-chest')"
      >
        打开宝箱
      </button>
      <button v-else class="primary" @click="$emit('continue')">
        {{ isFinalLevel ? "回到徽章" : "下一关" }}
      </button>
    </div>
  </div>
</template>
