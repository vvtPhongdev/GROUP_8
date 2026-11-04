import { UserRole } from '@wr/contracts';

export const getRoleHomePath = (role: UserRole) => {
  switch (role) {
    case UserRole.BOSS:
      return '/boss';
    case UserRole.WEB_ADMIN:
      return '/admin';
    case UserRole.ADMIN:
      return '/boss';
    case UserRole.DEPARTMENT_HEAD:
      return '/dept-head';
    case UserRole.HR_LEADER:
      return '/hr';
    case UserRole.CANDIDATE:
      return '/candidate';
    default:
      return '/dashboard';
  }
};
