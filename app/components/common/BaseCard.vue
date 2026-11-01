<script setup lang="ts">
interface Props {
  title?: string
  subtitle?: string
  noPadding?: boolean
}

withDefaults(defineProps<Props>(), {
  noPadding: false
})
</script>

<template>
  <div class="card-box" :class="{ 'no-padding': noPadding }">
    <div v-if="title || $slots.header || $slots.actions" class="card-header">
      <div>
        <h3 v-if="title" class="card-title">{{ title }}</h3>
        <p v-if="subtitle" class="card-subtitle">{{ subtitle }}</p>
        <slot name="header" />
      </div>
      <div v-if="$slots.actions" class="card-actions">
        <slot name="actions" />
      </div>
    </div>

    <div :class="{ 'card-body': !noPadding }">
      <slot />
    </div>

    <div v-if="$slots.footer" class="card-footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<style scoped>
.card-box {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xs);
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--color-border);
}

.card-title {
  font-size: var(--font-size-md);
  font-weight: 700;
  color: var(--color-text);
  line-height: var(--line-height-tight);
}

.card-subtitle {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  margin-top: 2px;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.card-body {
  padding: var(--space-5);
}

.card-footer {
  padding: var(--space-3) var(--space-5);
  background-color: var(--color-surface-subtle);
  border-top: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-2);
}

.no-padding {
  padding: 0;
}
</style>

