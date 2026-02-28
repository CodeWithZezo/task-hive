import {
  format,
  formatDistanceToNow,
  isToday,
  isTomorrow,
  isYesterday,
  isPast,
  differenceInDays,
} from 'date-fns';

export const formatDate = (date) => {
  if (!date) return '';
  return format(new Date(date), 'MMM d, yyyy');
};

export const formatDateTime = (date) => {
  if (!date) return '';
  return format(new Date(date), 'MMM d, yyyy · h:mm a');
};

export const formatTimeAgo = (date) => {
  if (!date) return '';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

export const formatDueDate = (date) => {
  if (!date) return null;
  const d = new Date(date);

  if (isToday(d)) return 'Today';
  if (isTomorrow(d)) return 'Tomorrow';
  if (isYesterday(d)) return 'Yesterday';

  const days = differenceInDays(d, new Date());
  if (days > 0 && days <= 7) return `In ${days} days`;
  if (days < 0 && days >= -7) return `${Math.abs(days)} days ago`;

  return formatDate(date);
};

export const isDueOverdue = (date) => {
  if (!date) return false;
  return isPast(new Date(date));
};

export const isDueSoon = (date, withinDays = 2) => {
  if (!date) return false;
  const d = new Date(date);
  const days = differenceInDays(d, new Date());
  return days >= 0 && days <= withinDays;
};