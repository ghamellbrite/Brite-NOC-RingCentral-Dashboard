# Brite NOC RingCentral Dashboard

Userscript that turns the RingCentral Contact Center (NICE CXone) **My Dashboard** page into a full-screen wallboard styled with the [Hali](https://github.com/carcosa-astral/Hali) design language, matching the Brite NOC Halo Dashboard. It reads the live-data responses the page already loads; it makes no extra requests and stores nothing.

## Data privacy

- Nothing is persisted: no storage, no network calls of its own, no logging of payloads.
- The repo contains code only. Never commit captured payloads, screenshots of the live board, agent names or tenant/user identifiers.
- Agent names render as `First L.` by default. Set `CONFIG.nameMode` to `'initials'` to show initials only.

## Install

1. Install [Tampermonkey](https://www.tampermonkey.net/).
2. Create a new script and paste in `noc-dashboard.user.js` (add `@updateURL` / `@downloadURL` once a remote exists).
3. Open `https://<tenant>.nice-incontact.com/mydashboard/` and the wallboard covers the page.

Keys: **D** shows the data map (endpoints, fields, state distributions), **O** toggles the overlay off to reach the underlying page.

## How it works

It wraps `fetch`/`XHR` and reads three polled endpoints under `CacheSite/EvolveCacheService.svc/rest/`:

| Endpoint | Feeds |
| --- | --- |
| `GetAllAgentEntryList` | Agent state counters, team member list |
| `GetContactQueueEntryList` | Calls waiting in queue |
| `GetCallBackEntryList` | Callback requests |

Initial loads are full; later polls are deltas, merged by agent / contact id.

## Configuration

Everything is in the `CONFIG` block at the top of the script. The state mappings were inferred from live data and should be checked with **D**:

- `loggedInLogStates`, `teamNos`: which agents appear (the native dashboard filters by team).
- `queueWaitingStates`, `callbackQueuedStates`, `callbackDoneStates`, `callbackFailedStates`: contact-state numbers.
- Agent state is derived from `IsAcw`, `Working`, `Available` and `OutstateDescription`; inbound vs outbound from `OutboundSkill`.

When changing the script, bump `@version`.
