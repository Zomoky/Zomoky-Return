import { createPermissions } from '@/services/permissions';

export const PROFILES = {
  Admin_c: { label: 'Admin', isDefault: false, isPublic: false, canManageTeam: true, reportsTo: null },
  Agent_c: { label: 'Support agent', isDefault: true, isPublic: false, canManageTeam: false, reportsTo: 'Admin_c' },
  PublicProfile: { label: 'Customer', isDefault: false, isPublic: true, canManageTeam: false, reportsTo: 'Admin_c' },
};

const TABLE_PERMISSIONS = {
  Admin_c: {
    orders_c: { access: 'Full' },
    order_items_c: { access: 'Full' },
    return_requests_c: { access: 'Full' },
  },
  Agent_c: {
    orders_c: { access: 'Read' },
    order_items_c: { access: 'Read' },
    return_requests_c: { access: 'Read,Update' },
  },
  PublicProfile: {
    orders_c: { access: 'Read' },
    order_items_c: { access: 'Read' },
    return_requests_c: { access: 'Create' },
  },
};

export const { getProfileMeta, getTableAccess, getFieldAccess } = createPermissions(PROFILES, TABLE_PERMISSIONS);
