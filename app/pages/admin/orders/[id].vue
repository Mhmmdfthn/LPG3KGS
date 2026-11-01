<script setup lang="ts">
definePageMeta({
  layout: 'admin'
})

const route = useRoute()
const orderId = computed(() => String(route.params.id))
</script>

<template>
  <OrderDetailManager :order-id="orderId" role="admin" />
</template>

