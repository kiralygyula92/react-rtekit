/**
 * Word, Google Docs and Excel clipboard payloads (03 §3, 09 §2).
 *
 * Trimmed but structurally faithful: the `mso-*` declarations, the `<o:p>` elements,
 * the conditional comments, the `mso-list` paragraph lists and the Google Docs
 * `docs-internal-guid` wrapper are all reproduced, because those are exactly what the
 * cleanup has to survive.
 */

export interface OfficeFixture {
  id: string;
  source: 'word' | 'gdocs' | 'excel';
  description: string;
  html: string;
}

export const OFFICE_FIXTURES: OfficeFixture[] = [
  {
    id: 'word-paragraphs',
    source: 'word',
    description: 'Two Word paragraphs with mso styling and an <o:p> filler',
    html: `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
<head><meta name=ProgId content=Word.Document><style><!-- p.MsoNormal {mso-style-parent:""; margin:0in; font-size:11.0pt; font-family:"Calibri",sans-serif;} --></style></head>
<body lang=EN-US><!--StartFragment-->
<p class=MsoNormal style='margin:0in;mso-pagination:widow-orphan'><span style='font-size:11.0pt;font-family:"Calibri",sans-serif;mso-fareast-font-family:"Times New Roman";color:#1F497D'>First paragraph<o:p></o:p></span></p>
<p class=MsoNormal style='margin:0in'><b style='mso-bidi-font-weight:normal'><span style='font-size:11.0pt'>Bold text</span></b><span style='font-size:11.0pt'> and normal.<o:p></o:p></span></p>
<!--EndFragment--></body></html>`,
  },
  {
    id: 'word-list',
    source: 'word',
    description: 'A Word bullet list, which is really styled paragraphs with mso-list',
    html: `<html xmlns:o="urn:schemas-microsoft-com:office:office"><body><!--StartFragment-->
<p class=MsoListParagraphCxSpFirst style='margin-left:.5in;mso-add-space:auto;text-indent:-.25in;mso-list:l0 level1 lfo1'><![if !supportLists]><span style='font-family:Symbol;mso-fareast-font-family:Symbol'><span style='mso-list:Ignore'>&middot;<span style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></span></span><![endif]>First item<o:p></o:p></p>
<p class=MsoListParagraphCxSpMiddle style='margin-left:.5in;text-indent:-.25in;mso-list:l0 level1 lfo1'><![if !supportLists]><span style='font-family:Symbol'><span style='mso-list:Ignore'>&middot;<span style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></span></span><![endif]>Second item<o:p></o:p></p>
<p class=MsoListParagraphCxSpLast style='margin-left:1.0in;text-indent:-.25in;mso-list:l0 level2 lfo1'><![if !supportLists]><span style='font-family:"Courier New"'><span style='mso-list:Ignore'>o<span style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></span></span><![endif]>Nested item<o:p></o:p></p>
<!--EndFragment--></body></html>`,
  },
  {
    id: 'word-conditional-comments',
    source: 'word',
    description: 'Conditional comments and an empty span wrapper',
    html: `<!--[if gte mso 9]><xml><o:OfficeDocumentSettings><o:AllowPNG/></o:OfficeDocumentSettings></xml><![endif]-->
<p class=MsoNormal><span lang=EN-US style='mso-ansi-language:EN-US'></span><span>Text after empty spans</span></p>`,
  },
  {
    id: 'gdocs-paragraphs',
    source: 'gdocs',
    description: 'Google Docs wrapper with its id-carrying <b> and per-span styling',
    html: `<meta charset="utf-8"><b style="font-weight:normal;" id="docs-internal-guid-1a2b3c"><p dir="ltr" style="line-height:1.38;margin-top:0pt;margin-bottom:0pt;"><span style="font-size:11pt;font-family:Arial,sans-serif;color:#000000;background-color:transparent;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre-wrap;">Plain sentence.</span></p><p dir="ltr" style="line-height:1.38;margin-top:0pt;margin-bottom:0pt;"><span style="font-size:11pt;font-family:Arial,sans-serif;color:#ff0000;font-weight:700;white-space:pre-wrap;">Red and bold.</span></p></b>`,
  },
  {
    id: 'gdocs-list',
    source: 'gdocs',
    description: 'Google Docs bullet list',
    html: `<meta charset="utf-8"><b style="font-weight:normal;" id="docs-internal-guid-9f8e7d"><ul style="margin-top:0;margin-bottom:0;padding-inline-start:48px;"><li dir="ltr" style="list-style-type:disc;font-size:11pt;font-family:Arial,sans-serif;color:#000000;"><p dir="ltr" style="line-height:1.38;margin-top:0pt;margin-bottom:0pt;"><span style="font-size:11pt;white-space:pre-wrap;">Alpha</span></p></li><li dir="ltr" style="list-style-type:disc;font-size:11pt;"><p dir="ltr" style="margin-top:0pt;margin-bottom:0pt;"><span style="white-space:pre-wrap;">Beta</span></p></li></ul></b>`,
  },
  {
    id: 'gdocs-link',
    source: 'gdocs',
    description: 'Google Docs link, wrapped in the usual redirect',
    html: `<meta charset="utf-8"><span style="font-size:11pt;"><a href="https://www.google.com/url?q=https://example.com&amp;sa=D&amp;source=docs" style="text-decoration:none;"><span style="color:#1155cc;text-decoration:underline;">example</span></a></span>`,
  },
  {
    id: 'excel-table',
    source: 'excel',
    description: 'An Excel range paste: a table full of mso attributes',
    html: `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><style>td {mso-number-format:General;}</style></head><body>
<table border=0 cellpadding=0 cellspacing=0 width=192 style='border-collapse:collapse;table-layout:fixed;width:144pt'>
<col width=96 span=2 style='width:72pt'>
<tr height=20 style='height:15.0pt'><td height=20 class=xl65 width=96 style='height:15.0pt;width:72pt'>Name</td><td class=xl65 width=96>Value</td></tr>
<tr height=20><td class=xl66>Chlorine</td><td class=xl66 align=right x:num>1.5</td></tr>
</table></body></html>`,
  },
];

/** Look one up by id. */
export function officeFixture(id: string): OfficeFixture {
  const found = OFFICE_FIXTURES.find((fixture) => fixture.id === id);
  if (!found) throw new Error(`Unknown office fixture: ${id}`);
  return found;
}

/** Substrings that must not survive the office cleanup. */
export const FORBIDDEN_AFTER_CLEANUP = [
  'mso-',
  '<o:p',
  'MsoNormal',
  'MsoListParagraph',
  'docs-internal-guid',
  '[if !supportLists]',
  'xmlns:o=',
  'x:num',
] as const;
