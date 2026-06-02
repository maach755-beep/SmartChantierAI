import type { TaskPriority, TaskStatus } from '@/types';

type BadgeVariant = 'green' | 'orange' | 'red' | 'blue' | 'gray';

export const TASK_STATUS_I18N: Record<TaskStatus, string> = {
  todo: 'tasks.statusTodo',
  in_progress: 'tasks.statusInProgress',
  waiting: 'tasks.statusWaiting',
  blocked: 'tasks.statusBlocked',
  done: 'tasks.statusDone',
  validated: 'tasks.statusValidated',
};

export const TASK_PRIORITY_I18N: Record<TaskPriority, string> = {
  low: 'tasks.priorityLow',
  medium: 'tasks.priorityMedium',
  high: 'tasks.priorityHigh',
  critical: 'tasks.priorityCritical',
};

export const TASK_STATUS_VARIANT: Record<TaskStatus, BadgeVariant> = {
  todo: 'gray',
  in_progress: 'blue',
  waiting: 'orange',
  blocked: 'red',
  done: 'green',
  validated: 'green',
};

export const TASK_PRIORITY_VARIANT: Record<TaskPriority, BadgeVariant> = {
  low: 'gray',
  medium: 'blue',
  high: 'orange',
  critical: 'red',
};

/** Ordre d'affichage / tri statut (urgence opérationnelle). */
export const TASK_STATUS_SORT_ORDER: Record<TaskStatus, number> = {
  blocked: 0,
  waiting: 1,
  todo: 2,
  in_progress: 3,
  done: 4,
  validated: 5,
};

export const TASK_PRIORITY_SORT_ORDER: Record<TaskPriority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export const ALL_TASK_STATUSES: TaskStatus[] = [
  'blocked',
  'waiting',
  'todo',
  'in_progress',
  'done',
  'validated',
];

export const ALL_TASK_PRIORITIES: TaskPriority[] = ['critical', 'high', 'medium', 'low'];

export function isTaskOpen(status: TaskStatus): boolean {
  return status === 'todo' || status === 'waiting' || status === 'blocked';
}

export function isTaskComplete(status: TaskStatus): boolean {
  return status === 'done' || status === 'validated';
}
