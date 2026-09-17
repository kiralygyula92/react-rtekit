/**
 * Legacy Quill markup captured from the legacy application.
 *
 * These strings are the contract: whatever the interop layer does, every one of them
 * must open, edit and save without visible loss. Round-trip tests in
 * `test/interop/quill.test.ts` assert exactly that.
 */

export interface QuillFixture {
  /** Stable id used in test names and on the `html-interop` demo page. */
  id: string;
  /** What this fixture is proving. */
  description: string;
  html: string;
}

export const QUILL_FIXTURES: QuillFixture[] = [
  {
    id: 'default-email-body',
    description: 'The default e-mail body the legacy editor shipped, merge tags and all',
    html:
      '<p>Hi {first_name}, </p><p>Your next review is due {due_date}. Here is your ' +
      'summary from {report_date}. Someone from the team will be in touch to go through ' +
      'it with you. </p><p>Thank you, </p><p>{company_name} </p><p>{company_address}</p>',
  },
  {
    id: 'align-classes',
    description: 'Alignment expressed as ql-align-* classes',
    html:
      '<p>left by default</p>' +
      '<p class="ql-align-center">centered</p>' +
      '<p class="ql-align-right">right</p>' +
      '<p class="ql-align-justify">justified text that wraps</p>',
  },
  {
    id: 'align-inline-style',
    description: 'Alignment expressed as an inline style instead of a class',
    html: '<p style="text-align: center">centered by style</p><p style="text-align:right">right</p>',
  },
  {
    id: 'bullet-list',
    description: 'Bullet list with the data-list attribute Quill 2 emits',
    html: '<ul><li data-list="bullet">one</li><li data-list="bullet">two</li></ul>',
  },
  {
    id: 'ordered-list',
    description: 'Ordered list with data-list="ordered"',
    html: '<ol><li data-list="ordered">first</li><li data-list="ordered">second</li></ol>',
  },
  {
    id: 'check-list',
    description: 'Quill check list: data-list unchecked/checked',
    html: '<ul><li data-list="unchecked">todo</li><li data-list="checked">done</li></ul>',
  },
  {
    id: 'nested-bullets',
    description: 'Nested bullets expressed as ql-indent-N on flat list items',
    html:
      '<ul><li data-list="bullet">top</li>' +
      '<li data-list="bullet" class="ql-indent-1">nested</li>' +
      '<li data-list="bullet" class="ql-indent-2">deeper</li>' +
      '<li data-list="bullet">back to top</li></ul>',
  },
  {
    id: 'colored-spans',
    description: 'Colour applied as an inline style on a span',
    html: '<p><span style="color: #FF0000">red</span> and <span style="color:#0000FF">blue</span></p>',
  },
  {
    id: 'marks',
    description: 'The six formats the old editor supported',
    html: '<p><strong>bold</strong> <em>italic</em> <u>underline</u></p>',
  },
  {
    id: 'size-classes',
    description: 'ql-size-* classes mapped through interop.quill.sizeMap',
    html: '<p><span class="ql-size-large">large</span> <span class="ql-size-small">small</span></p>',
  },
  {
    id: 'empty-paragraph',
    description: 'What an empty Quill editor produces — must count as empty (fixes R2)',
    html: '<p><br></p>',
  },
  {
    id: 'empty-paragraphs-multiple',
    description: 'Several empty paragraphs are still an empty document',
    html: '<p><br></p><p><br></p>',
  },
  {
    id: 'nbsp-paragraph',
    description: 'A non-breaking space is real content, so this is NOT empty',
    html: '<p>&nbsp;</p>',
  },
  {
    id: 'indented-paragraph',
    description: 'ql-indent-N on a paragraph maps onto our indent levels',
    html: '<p class="ql-indent-1">one step</p><p class="ql-indent-3">three steps</p>',
  },
  {
    id: 'editor-artefacts',
    description: 'Quill UI artefacts that must be dropped entirely',
    html: '<p>text<span class="ql-cursor">﻿</span><span class="ql-ui" contenteditable="false"></span></p>',
  },
  {
    id: 'mixed-formatting-in-list',
    description: 'Marks, colour and alignment combined inside a list',
    html:
      '<ul><li data-list="bullet"><strong>bold item</strong></li>' +
      '<li data-list="bullet"><span style="color: #008000">green item</span></li></ul>' +
      '<p class="ql-align-center"><u>centered underline</u></p>',
  },
  {
    id: 'link',
    description: 'An anchor produced by Quill',
    html: '<p>See <a href="https://example.com" target="_blank">our site</a>.</p>',
  },
  {
    id: 'full-message',
    description: 'A realistic message combining everything the legacy editor could produce',
    html:
      '<p class="ql-align-center"><strong>Quarterly summary</strong></p>' +
      '<p>Hi {first_name},</p>' +
      '<p><span style="color: #FF0000">Action needed:</span> your account needs attention.</p>' +
      '<ul><li data-list="bullet">Review the attached figures</li><li data-list="bullet">Reply by Friday</li></ul>' +
      '<p><br></p>' +
      '<p>Thank you,</p><p>{company_name}</p>',
  },
];

/** Look one up by id. Throws rather than returning `undefined`, so tests fail loudly. */
export function quillFixture(id: string): QuillFixture {
  const found = QUILL_FIXTURES.find((fixture) => fixture.id === id);
  if (!found) throw new Error(`Unknown Quill fixture: ${id}`);
  return found;
}

/** The exact default message body shipped by the legacy application. */
export const DEFAULT_EMAIL_BODY = quillFixture('default-email-body').html;
