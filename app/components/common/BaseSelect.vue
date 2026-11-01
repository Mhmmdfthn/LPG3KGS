<script setup lang="ts">
export interface SelectOption {
  value: string | number
  label: string
}

interface Props {
  modelValue?: string | number
  label?: string
  id?: string
  options: SelectOption[]
  placeholder?: string
  helperText?: string
  errorText?: string
  disabled?: boolean
  required?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  disabled: false,
  required: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void
}>()

const selectId = computed(() => props.id || `select-${Math.random().toString(36).substring(2, 9)}`)

function handleChange(event: Event) {
  const target = event.target as HTMLSelectElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <div class="form-group" :class="{ 'has-error': !!errorText, 'is-disabled': disabled }">
    <label v-if="label" :for="selectId" class="form-label">
      {{ label }}
      <span v-if="required" class="required-star">*</span>
    </label>

    <div class="select-wrapper">
      <select
        :id="selectId"
        :value="modelValue"
        :disabled="disabled"
        :required="required"
        class="form-select"
        @change="handleChange"
      >
        <option v-if="placeholder" value="" disabled :selected="!modelValue">
          {{ placeholder }}
        </option>
        <option
          v-for="opt in options"
          :key="String(opt.value)"
          :value="opt.value"
        >
          {{ opt.label }}
        </option>
      </select>
      <span class="select-chevron" aria-hidden="true">▼</span>
    </div>

    <p v-if="errorText" class="form-feedback error">{{ errorText }}</p>
    <p v-else-if="helperText" class="form-feedback helper">{{ helperText }}</p>
  </div>
</template>

<style scoped>
.form-group {
  display: flex;
  flex-direction: column;
  margin-bottom: var(--space-4);
  width: 100%;
}

.form-label {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: var(--space-1);
}

.required-star {
  color: var(--color-danger);
  margin-left: 2px;
}

.select-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.form-select {
  width: 100%;
  height: 44px;
  padding: 0 var(--space-8) 0 var(--space-3);
  font-size: var(--font-size-base);
  font-family: inherit;
  color: var(--color-text);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  appearance: none;
  cursor: pointer;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.form-select:focus {
  outline: none;
  border-color: var(--color-primary-600);
  box-shadow: 0 0 0 3px var(--color-primary-100);
}

.form-select:disabled {
  background-color: var(--color-surface-subtle);
  color: var(--color-text-subtle);
  cursor: not-allowed;
}

.select-chevron {
  position: absolute;
  right: var(--space-3);
  font-size: 10px;
  color: var(--color-text-muted);
  pointer-events: none;
}

.has-error .form-select {
  border-color: var(--color-danger);
}

.has-error .form-select:focus {
  box-shadow: 0 0 0 3px var(--color-danger-bg);
}

.form-feedback {
  font-size: var(--font-size-xs);
  margin-top: var(--space-1);
}

.form-feedback.error {
  color: var(--color-danger);
  font-weight: 500;
}

.form-feedback.helper {
  color: var(--color-text-muted);
}
</style>

