export const AUTH_ROLES = Object.freeze({
  ADMIN: 'admin',
  DRIVER: 'driver',
});

const VALID_AUTH_ROLES = new Set(Object.values(AUTH_ROLES));

export const isValidAuthRole = (role) => VALID_AUTH_ROLES.has(role);

export const getDashboardPathForRole = (role) => {
  if (role === AUTH_ROLES.ADMIN) return '/admin';
  if (role === AUTH_ROLES.DRIVER) return '/driver';
  return '/';
};
