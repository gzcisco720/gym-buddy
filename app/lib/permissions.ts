import { UserRole } from "./models/User";

// Role hierarchy levels
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.SUPER_ADMIN]: 4,
  [UserRole.GYM_ADMIN]: 3,
  [UserRole.TRAINER]: 2,
  [UserRole.MEMBER]: 1,
};

// Permission checker functions
export class PermissionChecker {
  /**
   * Check if user has minimum required role level
   */
  static hasMinimumRole(userRole: UserRole, requiredRole: UserRole): boolean {
    return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
  }

  /**
   * Check if user can access another user's data
   */
  static canAccessUserData(
    accessorRole: UserRole,
    targetUserId: string,
    accessorUserId: string,
    trainerMemberRelation?: { trainerId: string; memberId: string }
  ): boolean {
    // Super admin can access everything
    if (accessorRole === UserRole.SUPER_ADMIN) {
      return true;
    }

    // Users can access their own data
    if (accessorUserId === targetUserId) {
      return true;
    }

    // Trainers can access their assigned members' data
    if (accessorRole === UserRole.TRAINER && trainerMemberRelation) {
      return (
        trainerMemberRelation.trainerId === accessorUserId &&
        trainerMemberRelation.memberId === targetUserId
      );
    }

    return false;
  }

  /**
   * Check if user can modify another user's data
   */
  static canModifyUserData(
    accessorRole: UserRole,
    targetUserId: string,
    accessorUserId: string,
    trainerMemberRelation?: { trainerId: string; memberId: string }
  ): boolean {
    // Super admin can modify everything
    if (accessorRole === UserRole.SUPER_ADMIN) {
      return true;
    }

    // Users can modify their own data
    if (accessorUserId === targetUserId) {
      return true;
    }

    // Trainers can modify specific fields of their assigned members
    if (accessorRole === UserRole.TRAINER && trainerMemberRelation) {
      return (
        trainerMemberRelation.trainerId === accessorUserId &&
        trainerMemberRelation.memberId === targetUserId
      );
    }

    return false;
  }

  /**
   * Check if user can assign members to trainers
   */
  static canAssignMembers(userRole: UserRole): boolean {
    return this.hasMinimumRole(userRole, UserRole.GYM_ADMIN);
  }

  /**
   * Check if user can create other users
   */
  static canCreateUser(creatorRole: UserRole, targetRole: UserRole): boolean {
    // Super admin can create anyone
    if (creatorRole === UserRole.SUPER_ADMIN) {
      return true;
    }

    // Gym admin can create trainers and members
    if (creatorRole === UserRole.GYM_ADMIN) {
      return targetRole === UserRole.TRAINER || targetRole === UserRole.MEMBER;
    }

    // Trainers can create members
    if (creatorRole === UserRole.TRAINER) {
      return targetRole === UserRole.MEMBER;
    }

    return false;
  }

  /**
   * Check if user can delete other users
   */
  static canDeleteUser(deleterRole: UserRole, targetRole: UserRole): boolean {
    // Super admin can delete anyone except other super admins
    if (deleterRole === UserRole.SUPER_ADMIN) {
      return targetRole !== UserRole.SUPER_ADMIN;
    }

    // Gym admin can delete trainers and members
    if (deleterRole === UserRole.GYM_ADMIN) {
      return targetRole === UserRole.TRAINER || targetRole === UserRole.MEMBER;
    }

    return false;
  }

  /**
   * Check if user can view system analytics
   */
  static canViewAnalytics(userRole: UserRole): boolean {
    return this.hasMinimumRole(userRole, UserRole.TRAINER);
  }

  /**
   * Check if user can manage gym settings
   */
  static canManageGymSettings(userRole: UserRole): boolean {
    return this.hasMinimumRole(userRole, UserRole.GYM_ADMIN);
  }

  /**
   * Check if user can access workout plans
   */
  static canAccessWorkoutPlans(
    accessorRole: UserRole,
    planOwnerId: string,
    accessorUserId: string,
    trainerMemberRelation?: { trainerId: string; memberId: string }
  ): boolean {
    // Super admin can access all plans
    if (accessorRole === UserRole.SUPER_ADMIN) {
      return true;
    }

    // Users can access their own plans
    if (accessorUserId === planOwnerId) {
      return true;
    }

    // Trainers can access their assigned members' plans
    if (accessorRole === UserRole.TRAINER && trainerMemberRelation) {
      return (
        trainerMemberRelation.trainerId === accessorUserId &&
        trainerMemberRelation.memberId === planOwnerId
      );
    }

    return false;
  }

  /**
   * Get allowed actions for a user role
   */
  static getAllowedActions(userRole: UserRole): string[] {
    const actions: string[] = [];

    // Base actions for all authenticated users
    actions.push('view_own_profile', 'edit_own_profile', 'view_own_workouts');

    switch (userRole) {
      case UserRole.SUPER_ADMIN:
        actions.push(
          'manage_all_users',
          'view_all_data',
          'modify_all_data',
          'manage_gym_settings',
          'view_system_analytics',
          'assign_members',
          'delete_users',
          'create_users'
        );
        break;

      case UserRole.GYM_ADMIN:
        actions.push(
          'manage_trainers',
          'manage_members',
          'assign_members',
          'view_gym_analytics',
          'manage_gym_settings',
          'create_trainers',
          'create_members',
          'delete_trainers',
          'delete_members'
        );
        break;

      case UserRole.TRAINER:
        actions.push(
          'view_assigned_members',
          'manage_member_workouts',
          'view_member_progress',
          'create_workout_plans',
          'view_trainer_analytics',
          'create_members'
        );
        break;

      case UserRole.MEMBER:
        actions.push('view_workout_plan', 'log_workouts', 'view_progress');
        break;
    }

    return actions;
  }
}

// Utility functions for common permission checks
export const hasPermission = (userRole: UserRole, action: string): boolean => {
  const allowedActions = PermissionChecker.getAllowedActions(userRole);
  return allowedActions.includes(action);
};

export const isAdmin = (userRole: UserRole): boolean => {
  return userRole === UserRole.SUPER_ADMIN || userRole === UserRole.GYM_ADMIN;
};

export const isSuperAdmin = (userRole: UserRole): boolean => {
  return userRole === UserRole.SUPER_ADMIN;
};

export const isTrainer = (userRole: UserRole): boolean => {
  return userRole === UserRole.TRAINER;
};

export const isMember = (userRole: UserRole): boolean => {
  return userRole === UserRole.MEMBER;
};