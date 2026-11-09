const publicPaths = new Set(['/', '/login', '/register', '/registration-pending', '/preview-components'])

export default defineNuxtRouteMiddleware(async (to) => {
  if (publicPaths.has(to.path)) return
  const { currentUser, refresh } = useAuth()
  const user = currentUser.value || await refresh()
  if (!user) return navigateTo('/login')
  const roleRoot: Record<string, string> = { admin: '/admin', karyawan: '/staff', pengecer: '/retailer' }
  const root = roleRoot[user.role]!
  const targetRoot = to.path.startsWith('/admin') ? '/admin' : to.path.startsWith('/staff') ? '/staff' : to.path.startsWith('/retailer') ? '/retailer' : null
  if (targetRoot && targetRoot !== root) return navigateTo(root)
  if (!targetRoot && !['/profile'].includes(to.path)) return navigateTo(root)
})
