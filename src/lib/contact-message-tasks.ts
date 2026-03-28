const MESSAGE_TASK_MARKER_REGEX = /\n\n\[crm-message:([0-9a-f-]{36})\]\s*$/i;
const AUTO_REPLY_TITLE_REGEX = /^Repondre au message de /i;

export function buildIncomingMessageTaskDescription(message: string, messageId: string) {
  const content = message.trim();
  return `${content}\n\n[crm-message:${messageId}]`;
}

export function extractIncomingMessageTaskMeta(description: string | null | undefined) {
  if (!description) {
    return { description: null, messageId: null };
  }

  const match = description.match(MESSAGE_TASK_MARKER_REGEX);
  const cleanedDescription = description.replace(MESSAGE_TASK_MARKER_REGEX, '').trim();

  return {
    description: cleanedDescription || null,
    messageId: match?.[1] || null,
  };
}

export function buildContactMessageTaskHref(contactId: string, messageId: string) {
  const params = new URLSearchParams({ tab: 'messages', message: messageId });
  return `/crm/contacts/${contactId}?${params.toString()}`;
}

export function getIncomingMessageTaskHref(task: {
  linkedType?: string | null;
  linkedId?: string | null;
  description?: string | null;
}) {
  if (task.linkedType !== 'CONTACT' || !task.linkedId) {
    return null;
  }

  const { messageId } = extractIncomingMessageTaskMeta(task.description);
  return messageId ? buildContactMessageTaskHref(task.linkedId, messageId) : null;
}

export function isIncomingMessageTask(task: {
  title?: string | null;
  linkedType?: string | null;
  linkedId?: string | null;
  description?: string | null;
}) {
  if (task.linkedType !== 'CONTACT' || !task.linkedId) {
    return false;
  }

  return AUTO_REPLY_TITLE_REGEX.test(task.title || '') && Boolean(extractIncomingMessageTaskMeta(task.description).messageId);
}

