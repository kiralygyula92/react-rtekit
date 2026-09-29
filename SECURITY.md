# Security policy

## Supported versions

The current major receives security fixes. The previous major receives them for six months after
the new major's release.

## Reporting a vulnerability

Please do **not** open a public issue. Report vulnerabilities privately through
[GitHub security advisories](https://github.com/kiralygyula92/react-rtekit/security/advisories/new).
Include, where you can:

- the input (HTML, clipboard payload, or `value`) that triggers the problem;
- the configuration in use, especially `sanitize`, `htmlProfile` and `interop`;
- the observed output and what an attacker could do with it;
- the versions of `react-rtekit` and React.

You can expect an acknowledgement within three working days. We agree a disclosure timeline with
the reporter, ship a patch release for every supported major, and credit the reporter in the
release notes unless they prefer otherwise.

## Scope and hardening

`react-rtekit` parses, transforms and renders **untrusted HTML**, and its output is frequently
emailed to third parties. Sanitization bypasses are therefore treated as the highest-severity class
of bug in this project. We consider these vulnerabilities:

- Any input that yields executable output through any sanitization profile: a surviving
  `<script>`, an `on*` attribute, a `javascript:` / `vbscript:` / `data:text/html` URL, a CSS
  `expression()` / `url(javascript:)` / `@import`, or an SVG vector.
- Any way to re-enable a hard-blocked tag or attribute through configuration.
- Output that escapes the profile it was asked for: for example `email` emitting a `class`, an
  `id` or a non-allowlisted CSS property.
- A `target="_blank"` link emitted without `rel="noopener noreferrer"`.

`sanitize: false` is a documented, warned-about opt-out. Problems that require it are not
vulnerabilities.
