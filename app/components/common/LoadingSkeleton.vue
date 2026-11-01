<script setup lang="ts">
interface Props {
  type?: 'line' | 'rect' | 'circle'
  width?: string
  height?: string
  count?: number
}

withDefaults(defineProps<Props>(), {
  type: 'line',
  width: '100%',
  count: 1
})
</script>

<template>
  <div class="skeleton-group">
    <div
      v-for="i in count"
      :key="i"
      :class="['skeleton', `skeleton-${type}`]"
      :style="{
        width: width,
        height: height || (type === 'line' ? '18px' : type === 'circle' ? '40px' : '100px')
      }"
    />
  </div>
</template>

<style scoped>
.skeleton-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  width: 100%;
}

.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-surface-subtle) 25%,
    #E2E8F0 50%,
    var(--color-surface-subtle) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-sm);
}

.skeleton-circle {
  border-radius: var(--radius-full);
}

.skeleton-rect {
  border-radius: var(--radius-md);
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>

