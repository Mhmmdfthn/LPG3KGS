<script setup lang="ts">
interface Props {
  modelValue?: string
  label?: string
  id?: string
  placeholder?: string
  rows?: number
  helperText?: string
  errorText?: string
  disabled?: boolean
  required?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  rows: 3,
  disabled: false,
  required: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const textareaId = computed(() => props.id || `textarea-${Math.random().toString(36).substring(2, 9)}`)

function handleInput(event: Event) {
  const target = event.target as HTMLTextAreaElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <div class="form-group" :class="{ 'has-error': !!errorText, 'is-disabled': disabled }">
    <label v-if="label" :for="textareaId" class="form-label">
      {{ label }}
      <span v-if="required" class="required-star">*</span>
    </label>

    <textarea
      :id="textareaId"
      :value="modelValue"
      :placeholder="placeholder"
      :rows="rows"
      :disabled="disabled"
      :required="required"
      class="form-textarea"
      @input="handleInput"
    />

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

.form-textarea {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  font-size: var(--font-size-base);
  font-family: inherit;
  color: var(--color-text);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  resize: vertical;
  min-height: 80px;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.form-textarea:focus {
  outline: none;
  border-color: var(--color-primary-600);
  box-shadow: 0 0 0 3px var(--color-primary-100);
}

.form-textarea:disabled {
  background-color: var(--color-surface-subtle);
  color: var(--color-text-subtle);
  cursor: not-allowed;
}

.has-error .form-textarea {
  border-color: var(--color-danger);
}

.has-error .form-textarea:focus {
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

