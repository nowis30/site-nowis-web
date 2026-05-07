export const TASK_TYPE_VALUES = [
  // Legacy values kept for backward compatibility.
  'CALL',
  'EMAIL',
  'SONG',
  // New automation-oriented values.
  'CALLBACK',
  'CREATE_QUOTE',
  'CREATE_INVOICE',
  'CREATE_SONG',
  'UPLOAD_SONG_FILE',
  'SCHEDULE_WORKSHOP',
  'FOLLOW_UP',
  'DOCUMENT_REVIEW',
  'CUSTOM',
] as const;

export type TaskType = (typeof TASK_TYPE_VALUES)[number];

export type TaskPayloadPrimitive = string | number | boolean | null;
export type TaskPayloadRecord = Record<string, TaskPayloadPrimitive>;

export function coerceTaskType(value: unknown): TaskType {
  if (typeof value === 'string' && (TASK_TYPE_VALUES as readonly string[]).includes(value)) {
    return value as TaskType;
  }
  return 'FOLLOW_UP';
}

export function coerceTaskPayload(value: unknown): TaskPayloadRecord | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const output: TaskPayloadRecord = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (typeof raw === 'string') {
      const normalized = raw.trim();
      if (normalized.length > 0) {
        output[key] = normalized;
      }
      continue;
    }
    if (typeof raw === 'number' || typeof raw === 'boolean' || raw === null) {
      output[key] = raw;
    }
  }

  return Object.keys(output).length > 0 ? output : null;
}
