// ─── User Roles ───────────────────────────────────────────────────────────────
export const USER_ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member',
  VIEWER: 'viewer',
};

// ─── Task Status ──────────────────────────────────────────────────────────────
export const TASK_STATUS = {
  BACKLOG: 'backlog',
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  IN_REVIEW: 'in_review',
  DONE: 'done',
  CANCELLED: 'cancelled',
};

// ─── Task Priority ────────────────────────────────────────────────────────────
export const TASK_PRIORITY = {
  NONE: 'none',
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
};

// ─── Project Visibility ───────────────────────────────────────────────────────
export const PROJECT_VISIBILITY = {
  PUBLIC: 'public',    // All workspace members
  PRIVATE: 'private',  // Only project members
};

// ─── Notification Types ───────────────────────────────────────────────────────
export const NOTIFICATION_TYPES = {
  TASK_ASSIGNED: 'task_assigned',
  TASK_UPDATED: 'task_updated',
  TASK_COMPLETED: 'task_completed',
  TASK_DUE_SOON: 'task_due_soon',
  TASK_OVERDUE: 'task_overdue',
  COMMENT_ADDED: 'comment_added',
  COMMENT_MENTIONED: 'comment_mentioned',
  PROJECT_INVITED: 'project_invited',
  WORKSPACE_INVITED: 'workspace_invited',
};

// ─── Activity Types ───────────────────────────────────────────────────────────
export const ACTIVITY_TYPES = {
  TASK_CREATED: 'task_created',
  TASK_UPDATED: 'task_updated',
  TASK_DELETED: 'task_deleted',
  TASK_STATUS_CHANGED: 'task_status_changed',
  TASK_ASSIGNED: 'task_assigned',
  TASK_UNASSIGNED: 'task_unassigned',
  COMMENT_ADDED: 'comment_added',
  COMMENT_DELETED: 'comment_deleted',
  ATTACHMENT_ADDED: 'attachment_added',
  MEMBER_ADDED: 'member_added',
  MEMBER_REMOVED: 'member_removed',
};

// ─── Cookie Options ───────────────────────────────────────────────────────────
export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  path: '/',
};

// ─── Pagination ───────────────────────────────────────────────────────────────
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

// ─── Token Expiry ─────────────────────────────────────────────────────────────
export const REFRESH_TOKEN_EXPIRY_DAYS = 7;
export const ACCESS_TOKEN_EXPIRY_MINUTES = 15;
export const EMAIL_VERIFY_TOKEN_EXPIRY_HOURS = 24;
export const PASSWORD_RESET_TOKEN_EXPIRY_HOURS = 1;