# UniFuzz

Looks the same. Isn't the same.

UniFuzz is a Unicode fuzzing toolkit for security testing.

In plain English: you type something boring like `admin`, and UniFuzz replies with its chaotic Unicode cousins.

It generates homoglyph, case-anomaly, symbol-swap, and zero-width variants of a base payload so you can poke at normalization bugs, WAF bypasses, and weird backend parsing behavior without sending anything to a server.

Live demo: https://unifuzz.shubhankargaur.xyz/

![UniFuzz PoC](unifuzz-PoC.gif)

## Why this exists

Because Unicode is basically:

"same same"

backend: "absolutely not"

Filters, validators, WAFs, and normalization layers often disagree about what two strings really mean. UniFuzz gives you a fast offline way to mutate payloads and export them in formats that are actually useful during testing.

## What it does

- Homoglyph substitutions across multiple Unicode families
- Case anomaly mutations for tricky parser and normalization behavior
- Symbol mutation support for XSS and path traversal style payloads
- Zero-width insertion mode for signature bypass experiments
- Output modes for raw text, URL encoded, double URL encoded, Unicode escapes, and HTML entities
- Filterable results with grid and table views
- Copy-all, JSON copy, and text export actions

## Presets

- Auth Bypass: for when `admin` should not become "close enough to admin"
- WAF Evasion: for when your payload needs a fake moustache and sunglasses


## How to use

1. Enter a base payload such as admin, login, script, ../, or a custom test string.
2. Enable the mutation types you want to explore.
3. Pick an output format.
4. Hit generate.
5. Watch the payload list turn into a tiny Unicode menace.
6. Filter, copy, or export what you need.

## Good for

- Checking Unicode normalization edge cases
- Exploring WAF signature bypasses
- Testing auth and routing logic for canonicalization bugs
- Building fuzzing wordlists for Burp, ffuf, or custom pipelines

## What to test with it

If you are wondering where this actually becomes useful, start here:

- Authentication and identity flows: `admin` vs `аdmin`, duplicate accounts, login confusion, account recovery weirdness
- Business logic abuse: coupon reuse, referral abuse, promo code duplication, invite code bypasses
- Access control checks: Unicode mismatches in usernames, object IDs, tenant names, or route parameters
- Input validation and filters: regex bypasses, allowlist gaps, WAF rules, XSS payload obfuscation like `<script>` becoming `<sсript>`
- Unicode normalization bugs: NFC, NFD, NFKC, and NFKD inconsistencies, broken uniqueness checks, duplicate database entries
- Domain and redirect validation: homograph-style issues, redirect allowlist bypasses, visually similar hostnames
- Mobile and API edge cases: frontend vs backend normalization mismatch, JSON parsing differences, token or header comparison bugs
- Rate-limit and anti-abuse controls: repeated signup, OTP abuse, duplicate prevention bypasses using Unicode variants
- File upload and extension checks: cases like `shell.php` vs `shell.pһp` where the extension looks right until it really does not
- Case plus Unicode combos: mixed-case identity confusion, case-insensitive comparisons with Unicode edge behavior

## Quick test ideas

- Try usernames like `admin`, `support`, `root`, or `billing`
- Try coupon or promo strings like `SAVE10`, `WELCOME`, or referral codes
- Try payloads like `../`, `<script>`, `/admin`, `.php`, `.json`, or email-style identifiers
- Try anything your target compares, normalizes, stores uniquely, or uses in authorization decisions

## Tiny example

Input:

```text
admin
```

Possible output:

```text
аdmin
admіn
аdmіn
```

Same vibe to a human.

Potentially a very different story to the application.

## Notes

- UniFuzz runs fully in the browser.
- No payloads are sent to a backend by the app itself.
- Results are only as useful as the target system's Unicode handling, so verify behavior against the actual application under test.

## Tiny disclaimer

This is a research and testing tool.

Use it where you have permission.

Do not become the reason a blue team drinks extra coffee.


---

- Made with ❤️ from India
