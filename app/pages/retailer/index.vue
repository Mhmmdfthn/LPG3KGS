<script setup lang="ts">
definePageMeta({
  layout: 'retailer'
})

await navigateTo('/retailer/catalog', { replace: true })
</script>

<template>
  <div class="p-4 text-center text-muted">
    Mengalihkan ke Katalog Produk...
  </div>
</template>
