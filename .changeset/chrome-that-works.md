---
'react-rtekit': minor
---

Fix the chrome: inline marks, the selection toolbar, the overflow menu, tables, check
lists and the popovers.

A sweep over every control in the `full` preset, prompted by a report that "not all
toolbar buttons work". Each of these was a feature that shipped, had a button, had
documentation, and did nothing or did it invisibly.

**Inline marks were never styled.** The engine renders a mark as a class, and no rule in
the stylesheet matched any of them. Bold and italic also get `<strong>` and `<em>`, so
they inherited the browser's styling and looked fine; underline, strikethrough, code,
subscript and superscript arrive as a bare `<span>` and rendered as plain text. Text that
was both underlined and struck through showed only the strikethrough, because the pair
has a theme entry of its own that replaces the two individual classes.

**The toolbar that follows the selection.** It had no styling at all — a transparent strip
of buttons over the prose — carried every group in the docked toolbar rather than the
items that ask for the `bubble` surface, and was positioned without ever measuring itself,
so it hung off whichever edge of the window the selection was near. It now measures,
clamps and flips, and it is off by default wherever a toolbar is already docked.

**The overflow menu.** Its button had no icon and no label, so the only route to the
hidden half of the toolbar was a blank box; the measurement could conclude that fewer
groups fit but never that more did, so narrowing the window collapsed the toolbar for
good; and the hidden groups were laid out as non-wrapping rows that ran out through the
side of the card.

**Dead commands.** `toggleSourceView` was a method on the editor and an entry in the item
table that nothing joined up, so the button dispatched into nothing. The emoji button was
wired to `insertEmoji` with no character to insert, and the picker behind it was a slot
whose default rendered an empty `<div>`; there is now a searchable picker. The table
controls were passed to a slot with the same defect, so a table, once inserted, could not
be deleted.

**Tables** came out with the first row *and* the first column shaded, because a bare
`true` means both to the engine. New tables have no header cells unless asked for.

**Check lists** rendered as bulleted lists with nothing to tick: the rules looked for a
child element that neither the engine nor the serializer has ever produced.

**Popovers** were placed under their anchor whatever the height of either and never
flipped or clamped vertically, so on a short window the link editor and image dialog
opened past the bottom of the screen. The link editor, image dialog, table picker and
find-and-replace panel anchored to the content element rather than to the control that
opened them. Fullscreen sat above the popover layer, so every menu opened from a
fullscreen editor rendered behind it, and its button looked identical whether fullscreen
was on or off.

**Inserting a picture from the device** now works without a backend. The file picker used
to appear only when the host supplied `onUpload`; it is always offered, and with no
handler the file is embedded as a `data:` URL rather than silently discarded.

The `standard` sanitize profile accepts `data:` URLs for PNG, JPEG, GIF and WebP, which is
what lets that embedded image survive. Those four are pixels and cannot execute anything;
`data:image/svg+xml` and `data:text/html` remain blocked in every profile, whatever the
configuration says. `strict` and `email` still take no data URL at all, and
`sanitize={{ allowDataUrls: false }}` holds `standard` to the same line.
