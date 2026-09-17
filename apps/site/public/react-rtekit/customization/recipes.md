---
pluginId: react-rtekit
pathname: /react-rtekit/customization/recipes/
title: Recipes
description: Short worked answers to the customizations people actually ask for.
archetype: I
section: customization
---

# Recipes

Short answers to the customizations that actually get asked for.

## Put the toolbar at the bottom

```tsx
<RichTextEditor toolbarPosition="bottom" />
```

On mobile it docks above the on-screen keyboard rather than being pushed off-screen.

## Show a word count instead of characters

```tsx
<RichTextEditor showCounter countUnit="words" maxLength={500} />
```

## Block a paste instead of cleaning it

```tsx
<RichTextEditor handlers={{ onPaste: (ctx) => { if (tooLarge(ctx.html)) return; ctx.next(); } }} />
```

A handler that never calls `next()` cancels the default behaviour.

## Open links in a new tab by default

```tsx
<RichTextEditor linkDefaults={{ target: '_blank' }} />
```

`rel="noopener noreferrer"` is added by the sanitizer regardless.

## Render the value somewhere else

```tsx
<RteContentView value={value} />
```

## Get at the editor imperatively

```tsx
const ref = useRef<EditorInstance>(null);
<RichTextEditor editorRef={ref} />;
ref.current?.focus('end');
```
