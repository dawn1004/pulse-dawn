# Pulse Notes

## Phase 1 — Make it run

I tested using two Chrome browser windows (normal + incognito), changed the location in the DevTools Sensors tab, and went through the whole flow: join → connect → chat → video call. A few issues immediately showed up during testing.

Ghost dots. After users left, their dots stayed on the globe for ages and wouldn't go away. The heartbeat in /api/poll was refreshing everyone's lastSeen instead of just the current user, so offline users never timed out properly. Fixed by scoping it to the caller only.

Chat was silently broken. Messages were sent as { t: "msg" } but the receiver only listened for t === "chat". Connections worked, messages didn't.

WebRTC was flaky on some networks. ICE candidates were being processed before setRemoteDescription(). Moved candidate flushing to the end of handleSignal() and connection reliability improved a lot.

Busy state never cleared. Hanging up a call left users marked as busy, so they couldn't receive new requests. Added end handling alongside decline.

Closing the tab stranded the other person. If someone closed their tab mid-chat, the other user stayed stuck in a dead session. Updated /api/leave to send an end signal, clear both busy states, and clean everything up properly.

Honestly, Cursor helped me a lot during this phase. I had basically zero experience with WebRTC, so working through the issues and solutions together with Cursor definitely made things easier and helped me understand more WebRTC.

## Phase 2 — Make it good

The app was already working at this point, but it still felt like a prototype and not something complete. There were some UX issues too. For example, clicking a dot immediately connected you to a stranger without any confirmation or context about who you were connecting to. It worked, but it didn't feel great, so I added a confirmation stage and improved the overall user experience.

I also redesigned the Entry Gate flow. Before, it was basically one click and you were inside the globe immediately. Now users go through a few simple steps: nickname → mood → interests → confirmation.

When you join, your profile (nickname, mood, interests, etc.) gets sent to Postgres so other users can see it on the map but only for the active session. It disappears once you leave. localStorage is just for convenience if you check "remember me" so you don't have to fill the form again next time. Chat and video still never touch the server.

I also added privacy reminders, an 18+ confirmation, and an optional "remember me" feature. I think the 18+ confirmation is important since this is an anonymous stranger chat app, and the privacy reminders encourage users to think before sharing personal information. Please note that I didn't actually build a real Privacy Policy page, so clicking the link doesn't go anywhere yet.

I also improved the globe experience itself. Instead of instantly connecting when you click a dot, users first see a small profile preview of the stranger they are about to connect with. This includes their nickname, mood, bio, and interests. I think this makes the experience feel more natural since users can see if they share hobbies or interests before deciding to connect.

For the in-session experience, I added proper request and call screens instead of relying only on toast notifications. Chat now includes avatars, typing indicators, an emoji picker, a report button, and notification sounds for incoming requests. I also added a welcome dialog for first-time users so they feel more welcomed when entering the globe for the first time.

Finally, I added map filters so users can browse by mood or shared interests. It's a small feature, but it makes exploring the globe feel much less random.

## Phase 3 — Make it secure

At this point the app was working and the UX felt much better, so the next question was: how easy would it be for someone to abuse this thing?

Since Pulse has no accounts and everything is anonymous, security and moderation become even more important compared to a normal chat app.

The first thing I added was Cloudflare Turnstile. Without it, anyone could easily script the join endpoint and flood the globe with fake users or bots. Turnstile verification now happens before a user can enter Pulse Globe and create their presence on the map.

I also moved profile validation to the server side. Mood, interests, nicknames, and profile fields are now validated and limited so users can't send garbage values or unexpected payloads.

For moderation, I decided to use device fingerprints instead of session IDs. Since sessions disappear as soon as you close the tab, session IDs are not very useful for handling abuse. Fingerprints aren't perfect either, but for an anonymous app like this I think they are the more practical solution.

I also improved report validation by checking report reasons, limiting text length, preventing duplicate reports, and making sure reports only work while both users are still online.

Another thing I added was moderation checks during polling and connection requests so banned devices get flagged and can't keep using the app. They can still join globe, but the next poll catches them and they can't start new connections.

One small thing I spent more time on than I expected was the Turnstile UX itself. I originally used the visible widget because it was easier to set up, but it completely ruined the layout of the entry screen. I eventually switched to invisible mode so verification runs automatically when users click "Enter Pulse". The flow feels much cleaner now while still keeping the protection.

## Phase 4 — Make it better

One of the biggest things I added in this phase was the reporting and moderation system.

Users can report spam, harassment, inappropriate behavior, or other issues directly from the chat screen. Reports are tied to a device fingerprint instead of a session ID since sessions disappear as soon as the tab is closed. For an anonymous app like this, I think fingerprints are the more practical solution even though they are not perfect.

I also implemented escalating bans. The idea was to give users a chance to correct their behavior while becoming stricter with repeat offenders.

The ban duration increases every time the same device gets reported:

- First report → 3 minute ban
- Second report → 5 minute ban
- Third report → 10 minute ban
- Fourth report → 30 minute ban
- Fifth report → 2 hour ban
- Sixth report → 12 hour ban
- Seventh report → 24 hour ban
- Eighth report → 3 day ban
- Ninth report → 7 day ban
- Tenth to twentieth report → 30 day ban
- Twenty-first report and beyond → permanent ban

To be honest, I think this can still be improved. Right now, reports continue to accumulate forever until someone hits that permanent ban.

I think a better system would be to slowly reset the report count after some time has passed. For example, if someone got reported several times but behaved normally for the next month, maybe those reports should expire and their count should slowly go back to zero instead of following them forever.

This could probably be done using a cron job or scheduled cleanup task, but I didn't spend too much time on it since I wanted to focus more on other features and improvements for the app.

Another feature I added was approximate location and distance information. Profile previews can show an approximate area and distance like "2.4 km away" before connecting. Map tooltips show the distance too but not the area name.

The stranger's area and dot position come from their privacy-offset coordinates on the map, not their real GPS. Distance is approximate too — it's roughly between your location and their offset dot. Since Pulse intentionally moves everyone 1–3 km from their actual spot, the app never exposes where someone really is.

I think this makes the globe feel more alive and gives users a little bit more context about who they are connecting with without sacrificing privacy.

That's it for the summary of my exam 😄

This project was definitely challenging since a lot of the technologies and concepts involved were new to me, not just WebRTC. I'll also be honest and say that Cursor helped me a lot throughout the project by helping me turn ideas into actual features faster and smarter, which gave me more time to focus on the product, UX, and improvements instead of being stuck for hours figuring out implementation details. 🙇‍♂️🙇‍♂️🙇‍♂️🙇‍♂️
