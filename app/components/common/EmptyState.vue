<script setup lang="ts">
interface Props {
  title?: string
  description?: string
  icon?: string
  actionLabel?: string
}

withDefaults(defineProps<Props>(), {
  title: 'Belum Ada Data',
  description: 'Tidak ada informasi untuk ditampilkan pada daftar ini.',
  icon: '📭'
})

defineEmits<{
  (e: 'action'): void
}>()
</script>

<template>
  <div class="empty-state">
    <div class="empty-icon" aria-hidden="true">{{ icon }}</div>
    <h3 class="empty-title">{{ title }}</h3>
    <p class="empty-description">{{ description }}</p>
    <div v-if="$slots.action || actionLabel" class="empty-action">
      <slot name="action">
        <BaseButton v-if="actionLabel" variant="primary" @click="$emit('action')">
          {{ actionLabel }}
        </BaseButton>
      </slot>
    </div>
  </div>
</template>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-10) var(--space-4);
  text-align: center;
  background-color: var(--color-surface);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-lg);
  margin: var(--space-4) 0;
}

.empty-icon {
  font-size: 40px;
  margin-bottom: var(--space-3);
  opacity: 0.8;
}

.empty-title {
  font-size: var(--font-size-md);
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: var(--space-1);
}

.empty-description {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  max-width: 400px;
  line-height: var(--line-height-normal);
}

.empty-action {
  margin-top: var(--space-4);
}
</style>

