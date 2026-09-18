# Security policy

`react-rtekit` parses, transforms and renders **untrusted HTML**, and its output is
frequently e-mailed to third parties. Sanitization bypasses are therefore treated as
the highest-severity class of bug in this project.

## Reporting a vulnerability

Please do **not** open a public issue for a security problem.

Use GitHub's private vulnerability reporting on this repository
(Security -> Report a vulnerability), which opens a private channel with the
maintainers.

Include, where you can:

- the input (HTML, clipboard payload, or `value`) that triggers the problem;
- the configuration in use, especially `sanitize`, `htmlProfile` and `interop`;
- the observed output and what an attacker could do with it;
- the versions of `react-rtekit` and React.

## What we consider a vulnerability

- Any input that yields executable output through any sanitization profile: a surviving
  `<script>`, an `on*` attribute, a `javascript:` / `vbscript:` / `data:text/html` URL,
  a CSS `expression()` / `url(javascript:)` / `@import`, or an SVG vector.
- Any way to re-enable a hard-blocked tag or attribute through configuration.
- Output that escapes the profile it was asked for -- for example `email` emitting a
  `class`, an `id` or a non-allowlisted CSS property.
- A `target="_blank"` link emitted without `rel="noopener noreferrer"`.

`sanitize: false` is a documented, warned-about opt-out. Problems that require it are
not vulnerabilities.

## Response

We aim to acknowledge a report within three working days, agree a disclosure timeline
with the reporter, ship a patch release for every supported major, and credit the
reporter in the release notes unless they prefer otherwise.

## Supported versions

The current major receives security fixes. The previous major receives them for six
months after the new major's release.
