# 🍱 Tiffin Manager

**Run your office tiffin service without the daily WhatsApp chaos.**

Every day someone in the office plays "tiffin coordinator": ask the vendor for the menu, ping everyone, chase the people who didn't reply, count how many half/full tiffins per location, send the order before the cutoff, then at week-end tally who ate what and collect money that trickles in bit by bit. Tiffin Manager turns that whole mess into a few taps.

Built for the **coordinator** (the single point of contact) and the **members** who order. The vendor stays on WhatsApp — the app just writes the short order message for you to send.

---

## Why people like it

- **One-tap ordering.** Members pick Full / Half / Skip and confirm. Done.
- **No more chasing.** Live count of who's in, who's pending, per office — with a cutoff timer.
- **Auto vendor message.** "Teerth 2 (1F, 1H), SBC 1 (1F). Total 3." — one tap to send on WhatsApp.
- **Money that adds up.** Per-person running balance, carry-over of unpaid amounts, partial payments, and fixes for mistakes — all logged.
- **UPI QR built in.** Members scan and pay; you record and reconcile against your bank.
- **Rates with history.** Prices changed from 60/80 to 65/90? Old weeks still bill at old rates.
- **Reminders that work offline.** On-device notifications (menu, order, cutoff, settlement) fire even when the app is closed — no server, no cost.
- **Reports.** Weekly/monthly tiffin counts, spend per person, and a one-tap PDF statement.

---

## How it works

**Coordinator**
1. Post the day's menu.
2. Watch orders come in (grouped by office, with a cutoff countdown).
3. Tap **Send order on WhatsApp** → forward it to the vendor.
4. Tap **Lock & bill** → everyone's charged at the current rate.
5. Collect via your UPI QR; record payments; reconcile; export a statement.

**Member**
1. See the menu, tap **Full / Half / Skip**, hit **Confirm**.
2. Check your running balance any time.
3. Scan the QR to pay.

---

## Install (for users)

This app is distributed as an Android **APK** (no Play Store needed).

1. Download the latest `app.apk` from the [**Releases**](../../releases) page.
2. Open it on your phone and allow "install from this source" if prompted.
3. Open the app, sign up, and either **create a group** (you become the coordinator) or **join** one with the 6-character code your coordinator shares.

The app checks for new versions on launch and shows an **Update available** prompt when a newer release is published.

---

## Run from source (for developers)

**Requirements:** Node 18+, a free Firebase project.

```bash
npm install --legacy-peer-deps
```

Create a Firebase project → enable **Email/Password** auth and **Firestore**, then copy your web config into a `.env` file (see `.env.example`):

```
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
# optional: enables in-app update checks from GitHub Releases
EXPO_PUBLIC_GITHUB_REPO=PushkarPisolkar04/meal-distributor
```

Deploy the security rules, then start the dev server:

```bash
npm install -g firebase-tools && firebase login
firebase deploy --only firestore:rules
npm start          # dev server
npm run android    # build & run on a connected device/emulator
```

**Tests & checks**

```bash
npm test           # unit tests for the money-critical logic
npm run typecheck  # TypeScript
```

## Releasing a new version

APKs are built and published to **GitHub Releases automatically** by a workflow — no local Android tooling needed.

One-time setup: add a repo secret named `EXPO_TOKEN` (create a free token at **expo.dev → Account settings → Access tokens**).

Then to cut a release:

```bash
# bump "version" in app.config.js first, e.g. 1.0.0 -> 1.0.1
git tag v1.0.1
git push origin v1.0.1
```

The workflow builds the APK, signs it consistently, and attaches it to a Release. Anyone on an older version gets the **Update available** prompt automatically.

---

## Tech

- **React Native** (TypeScript) — one codebase, Android APK, animated UI.
- **Firebase** (free tier) — Auth + Firestore, secured with multi-tenant rules.
- **On-device notifications** — reminders fire even when the app is closed, no server needed.
- Business logic (pricing, ledger, consolidation) is pure and **unit-tested**.

## Security

- Data is isolated per group by **Firestore Security Rules** — you must belong to a group to read its data, only a coordinator can write shared data, members can only edit their own order, and the activity log is append-only.
- Firebase web keys in the app are public identifiers by design; the rules are the real protection.

## License

MIT — see [LICENSE](LICENSE).
