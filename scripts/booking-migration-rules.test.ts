import assert from 'node:assert/strict';
import test from 'node:test';

type WorkshopBookingState = {
  bookingProvider: 'GOOGLE' | 'MICROSOFT' | 'CALENDLY' | 'ICLOUD' | null;
  bookingEventUri: string | null;
  bookingInviteeUri: string | null;
  bookingUrl: string | null;
  calendlyEventUri: string | null;
  calendlyInviteeUri: string | null;
  calendlyUrl: string | null;
};

function computeDualRead(state: WorkshopBookingState) {
  return {
    eventUri: state.bookingEventUri || state.calendlyEventUri || null,
    inviteeUri: state.bookingInviteeUri || state.calendlyInviteeUri || null,
    bookingUrl: state.bookingUrl || state.calendlyUrl || null,
  };
}

function applyLegacyWebhook(state: WorkshopBookingState, input: { eventUri: string; inviteeUri: string; bookingUrl: string }) {
  return {
    ...state,
    bookingProvider: 'CALENDLY' as const,
    bookingEventUri: input.eventUri,
    bookingInviteeUri: input.inviteeUri,
    bookingUrl: input.bookingUrl,
    calendlyEventUri: input.eventUri,
    calendlyInviteeUri: input.inviteeUri,
    calendlyUrl: input.bookingUrl,
  };
}

function applyGoogleSync(state: WorkshopBookingState, input: { eventUri: string; bookingUrl: string }) {
  return {
    ...state,
    bookingProvider: 'GOOGLE' as const,
    bookingEventUri: input.eventUri,
    bookingUrl: input.bookingUrl,
    // Legacy Calendly must stay untouched for historical compatibility.
    calendlyEventUri: state.calendlyEventUri,
    calendlyInviteeUri: state.calendlyInviteeUri,
    calendlyUrl: state.calendlyUrl,
  };
}

test('Dual-read: priorité aux champs booking* puis fallback legacy Calendly', () => {
  const legacyOnly: WorkshopBookingState = {
    bookingProvider: null,
    bookingEventUri: null,
    bookingInviteeUri: null,
    bookingUrl: null,
    calendlyEventUri: 'legacy-event',
    calendlyInviteeUri: 'legacy-invitee',
    calendlyUrl: 'https://calendly.com/test',
  };

  const resolved = computeDualRead(legacyOnly);
  assert.equal(resolved.eventUri, 'legacy-event');
  assert.equal(resolved.inviteeUri, 'legacy-invitee');
  assert.equal(resolved.bookingUrl, 'https://calendly.com/test');
});

test('Legacy webhook: dual-write dans booking* et calendly*', () => {
  const initial: WorkshopBookingState = {
    bookingProvider: null,
    bookingEventUri: null,
    bookingInviteeUri: null,
    bookingUrl: null,
    calendlyEventUri: null,
    calendlyInviteeUri: null,
    calendlyUrl: null,
  };

  const next = applyLegacyWebhook(initial, {
    eventUri: 'https://api.calendly.com/scheduled_events/uuid-1',
    inviteeUri: 'https://api.calendly.com/invitees/uuid-1',
    bookingUrl: 'https://calendly.com/simonmorin-nowis/30min',
  });

  assert.equal(next.bookingProvider, 'CALENDLY');
  assert.equal(next.bookingEventUri, next.calendlyEventUri);
  assert.equal(next.bookingInviteeUri, next.calendlyInviteeUri);
  assert.equal(next.bookingUrl, next.calendlyUrl);
});

test('Sync Google: écrit booking* sans écraser les champs legacy Calendly', () => {
  const withLegacy: WorkshopBookingState = {
    bookingProvider: 'CALENDLY',
    bookingEventUri: 'https://api.calendly.com/scheduled_events/legacy',
    bookingInviteeUri: 'https://api.calendly.com/invitees/legacy',
    bookingUrl: 'https://calendly.com/simonmorin-nowis/30min',
    calendlyEventUri: 'https://api.calendly.com/scheduled_events/legacy',
    calendlyInviteeUri: 'https://api.calendly.com/invitees/legacy',
    calendlyUrl: 'https://calendly.com/simonmorin-nowis/30min',
  };

  const next = applyGoogleSync(withLegacy, {
    eventUri: 'google-event-123',
    bookingUrl: 'https://calendar.google.com/calendar/embed?src=x',
  });

  assert.equal(next.bookingProvider, 'GOOGLE');
  assert.equal(next.bookingEventUri, 'google-event-123');
  assert.equal(next.bookingUrl?.includes('calendar.google.com'), true);
  assert.equal(next.calendlyEventUri, withLegacy.calendlyEventUri);
  assert.equal(next.calendlyInviteeUri, withLegacy.calendlyInviteeUri);
  assert.equal(next.calendlyUrl, withLegacy.calendlyUrl);
});

test('Backfill SQL attendu: bookingProvider=CALENDLY si legacy présent', () => {
  const legacyRow = {
    calendlyEventUri: 'legacy-event',
    calendlyInviteeUri: null,
    calendlyUrl: null,
  };

  const inferredProvider = legacyRow.calendlyEventUri || legacyRow.calendlyInviteeUri || legacyRow.calendlyUrl
    ? 'CALENDLY'
    : null;

  assert.equal(inferredProvider, 'CALENDLY');
});
