export const ROLES = ['super_admin', 'admin', 'manager', 'shop_keeper', 'financier'] as const
export type Role = typeof ROLES[number]

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: 'Super Admin',
  admin:       'Admin',
  manager:     'Manager',
  shop_keeper: 'Shop Keeper',
  financier:   'Financier',
}

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  super_admin: 'Full access — can assign all roles',
  admin:       'Full access — cannot assign Super Admin',
  manager:     'Orders, customers & reports',
  shop_keeper: 'Products & orders',
  financier:   'Orders, pricing & coupons',
}

export const ROLE_COLORS: Record<Role, string> = {
  super_admin: 'bg-[#4A0F1C]/10 dark:bg-[#4A0F1C]/30 text-[#6B1A2A] dark:text-[#D4849A]',
  admin:       'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400',
  manager:     'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400',
  shop_keeper: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400',
  financier:   'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400',
}

// Which nav sections each role can access
export type Section = 'dashboard' | 'products' | 'orders' | 'customers' | 'users' | 'settings' | 'coupons'

export const ROLE_PERMISSIONS: Record<Role, Section[]> = {
  super_admin: ['dashboard', 'products', 'orders', 'customers', 'users', 'settings', 'coupons'],
  admin:       ['dashboard', 'products', 'orders', 'customers', 'users', 'settings', 'coupons'],
  manager:     ['dashboard', 'orders', 'customers'],
  shop_keeper: ['dashboard', 'products', 'orders'],
  financier:   ['dashboard', 'orders', 'coupons'],
}

export function can(role: string | undefined, section: Section): boolean {
  if (!role) return false
  const perms = ROLE_PERMISSIONS[role as Role]
  return perms?.includes(section) ?? false
}

// Roles a given role is allowed to assign to others
export function assignableRoles(currentRole: string | undefined): Role[] {
  if (currentRole === 'super_admin') return ROLES as unknown as Role[]
  if (currentRole === 'admin') return ['admin', 'manager', 'shop_keeper', 'financier']
  return []
}
