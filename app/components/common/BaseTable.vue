<script setup lang="ts">
interface Props {
  striped?: boolean
  hoverable?: boolean
}

withDefaults(defineProps<Props>(), {
  striped: false,
  hoverable: true
})
</script>

<template>
  <div class="table-container">
    <table
      :class="[
        'table',
        { 'table-striped': striped, 'table-hoverable': hoverable }
      ]"
    >
      <thead v-if="$slots.head" class="table-head">
        <slot name="head" />
      </thead>
      <tbody class="table-body">
        <slot />
      </tbody>
      <tfoot v-if="$slots.foot" class="table-foot">
        <slot name="foot" />
      </tfoot>
    </table>
  </div>
</template>

<style scoped>
.table-container {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background-color: var(--color-surface);
}

.table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: var(--font-size-sm);
  color: var(--color-text);
}

:deep(th) {
  padding: var(--space-3) var(--space-4);
  font-weight: 600;
  font-size: var(--font-size-xs);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
  background-color: var(--color-surface-subtle);
  border-bottom: 1px solid var(--color-border);
  white-space: nowrap;
}

:deep(td) {
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-border);
  vertical-align: middle;
}

:deep(tr:last-child td) {
  border-bottom: none;
}

.table-hoverable :deep(tbody tr:hover) {
  background-color: var(--color-primary-50);
}

.table-striped :deep(tbody tr:nth-child(even)) {
  background-color: var(--color-surface-subtle);
}
</style>

