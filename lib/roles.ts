export const ROLES = ['super_admin', 'admin', 'editor', 'manager', 'shop_keeper', 'financier'] as const
export type Role = typeof ROLES[number]

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: 'Super Admin',
  admin:       'Admin',
  editor:      'Editor',
  manager:     'Manager',
  shop_keeper: 'Shop Keeper',
  financier:   'Financier',
}

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  super_admin: 'Unrestricted access. Can assign any role. Account is protected — cannot be deleted or demoted by anyone.',
  admin:       'Full store access. Can assign Editor, Manager, Shop Keeper, and Financier roles. Cannot touch Super Admin accounts.',
  editor:      'Can create, edit, and delete products, categories, brands, and featured items. No access to orders, users, or financials.',
  manager:     'Manages orders and customers. Can update order status, view customer details, and handle support. No product or finance access.',
  shop_keeper: 'Manages product listings and processes orders. Can update stock, mark orders shipped/delivered. No user or finance access.',
  financier:   'Views and manages orders for financial purposes. Can apply and manage coupons and discounts. No product or user management.',
}

export const ROLE_COLORS: Record<Role, string> = {
  super_admin: 'bg-[#4A0F1C]/10 dark:bg-[#4A0F1C]/30 text-[#6B1A2A] dark:text-[#D4849A]',
  admin:       'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400',
  editor:      'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400',
  manager:     'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400',
  shop_keeper: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400',
  financier:   'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400',
}

export type Section = 'dashboard' | 'homepage' | 'media' | 'products' | 'orders' | 'customers' | 'users' | 'settings' | 'coupons' | 'emails' | 'finance' | 'support'

export const ROLE_PERMISSIONS: Record<Role, Section[]> = {
  super_admin: ['dashboard', 'homepage', 'media', 'products', 'orders', 'customers', 'users', 'settings', 'coupons', 'emails', 'finance', 'support'],
  admin:       ['dashboard', 'homepage', 'media', 'products', 'orders', 'customers', 'users', 'settings', 'coupons', 'emails', 'finance', 'support'],
  editor:      ['dashboard', 'homepage', 'media', 'products'],
  manager:     ['dashboard', 'orders', 'customers', 'finance', 'support'],
  shop_keeper: ['dashboard', 'media', 'products', 'orders'],
  financier:   ['dashboard', 'orders', 'coupons', 'finance'],
}

export function can(role: string | undefined, section: Section): boolean {
  if (!role) return false
  return ROLE_PERMISSIONS[role as Role]?.includes(section) ?? false
}

// Roles a given role is allowed to assign to others
export function assignableRoles(currentRole: string | undefined): Role[] {
  if (currentRole === 'super_admin') return [...ROLES] as Role[]
  if (currentRole === 'admin') return ['admin', 'editor', 'manager', 'shop_keeper', 'financier']
  return []
}

export function isSuperAdmin(role: string | undefined): boolean {
  return role === 'super_admin'
}
