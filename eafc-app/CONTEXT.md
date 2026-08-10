# Stage App

Domain language for Stage mobile features.

---

# Schedule

Personal calendar of Stage competition and contract milestones for the signed-in identity.

## Language

**Schedule Event**:
A dated item on the Schedule — a Match Event, Contract End, Contract Reminder, or Tournament Start.
_Avoid_: Appointment, booking, agenda item

**Match Event**:
A Schedule Event backed by a Match involving the user's club or player.
_Avoid_: Fixture row (prefer Match Event when talking about Schedule domain)

**Contract End**:
A Schedule Event on the contract's end date for an active Player Contract tied to the user or club.
_Avoid_: Expiry notice (that is Contract Reminder)

**Contract Reminder**:
A Schedule Event surfaced today when an active contract is near expiry (≤10 games left or ≤14 days).
_Avoid_: Contract End

**Tournament Start**:
A Schedule Event on a tournament start date when the user's club is registered.
_Avoid_: Cup kickoff

**Fixtures View**:
The chronological list of Schedule Events (excluding Tournament Start in the list, matching web).
_Avoid_: Matches tab, Game Day

**Calendar View**:
The month grid of Schedule Events keyed by local calendar day (excludes Contract Reminder dots).
_Avoid_: Date picker

---

# Inbox

Actionable messages delivered to the signed-in user (match invites, contracts, schedule proposals, club mail).

## Language

**Inbox Message**:
A message in the user's Inbox, addressed by recipient email.
_Avoid_: Email, notification (Notifications are a separate feed that may deep-link here)

**Needs Action**:
An Inbox Message with a recoverable action type that is still pending.
_Avoid_: Unread (unread is only about is_read)

**Notification**:
A lightweight alert that may include a link into Inbox or another screen.
_Avoid_: Inbox Message
