// @ts-check
/** 90-day plan helpers, ported from v0.1. */
import { newWorkspace } from './schema.js';

/**
 * A plan pre-filled from a role template; 'custom' (or no role) gives a blank plan.
 * @param {any} role a content/roles/*.json object
 */
export function planFromRole(role) {
  const plan = newWorkspace().plan;
  if (!role || role.id === 'custom') return plan;
  plan.roleId = String(role.id || 'custom');
  plan.targetRole = String(role.role || '');
  plan.priorities = [0, 1, 2].map(function (i) { return role.priorities && role.priorities[i] ? String(role.priorities[i]) : ''; });
  plan.project = String(role.portfolio || '');
  plan.day30 = String(role.phase_1 && role.phase_1.output || '');
  plan.day60 = String(role.phase_2 && role.phase_2.output || '');
  plan.day90 = String(role.phase_3 && role.phase_3.output || '');
  plan.nextAction = String(role.first_step || '');
  return plan;
}

/**
 * True when the plan has text the user might lose by applying a template.
 * @param {any} plan
 */
export function planHasContent(plan) {
  return ['targetRole', 'project', 'day30', 'day60', 'day90', 'nextAction', 'nextDate'].some(function (k) { return plan[k]; }) || plan.priorities.some(Boolean);
}
