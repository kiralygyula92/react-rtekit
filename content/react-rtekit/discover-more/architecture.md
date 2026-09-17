---
pluginId: react-rtekit
pathname: /react-rtekit/discover-more/architecture/
title: Architecture
description: The decisions behind the engine adapter, the sanitizer, the interop profiles and the slot system.
archetype: I
section: discover-more
---

# Architecture

The decisions that shaped the package, each recorded as an ADR in the repository.

## An engine adapter, not a wrapper

An `EditorEngine` interface owns the document layer, and Lexical is the default adapter behind it. Nothing outside `src/engines/` imports Lexical and none of it reaches the public API — verified by a grep that returns nothing.

The point is not that a second engine is coming. It is that the public API describes editing rather than describing Lexical, so a change in the engine is not a breaking change in the package.

## An in-house HTML parser

The sanitizer cannot use the browser's parser, because parsing untrusted HTML to inspect it is the mutation-XSS vector it is trying to close. So the package carries its own parser, which is most of the core bundle's size and is not negotiable.

## Sanitization at every boundary

Five entry points, one sanitizer, and hard rules no configuration reaches. The alternative — sanitizing at the edges and trusting the middle — is how editors ship XSS holes.

## Interop profiles rather than a migration

Reading legacy Quill markup as it is means adoption does not require a data migration, which is the single largest cost of replacing an editor.

## Slots and middleware rather than configuration flags

A flag anticipates a need; a slot does not have to. Forty-six replaceable parts and eighteen interception points cover cases nobody thought of, which a growing list of booleans never does.

The ADRs are in [docs/adr](https://github.com/kiralygyula92/react-rtekit/tree/main/docs/adr).
