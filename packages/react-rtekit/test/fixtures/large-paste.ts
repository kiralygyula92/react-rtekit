/**
 * A large Word clipboard payload, for the paste performance budget.
 *
 * Generated rather than checked in, for the same reason as the 100 KB document: a
 * 200 KB fixture in the repository is a 200 KB diff nobody can read. The shape is what
 * matters — `mso-*` declarations on every span, `<o:p>` fillers, `mso-list`
 * paragraphs and conditional comments — because those are what the cleanup has to
 * chew through, and they are most of the bytes in a real Word paste.
 */

const WORDS = [
  'invoice', 'quarterly', 'schedule', 'account', 'summary', 'contract', 'allocation', 'forecast',
  'dispatch', 'inventory', 'renewal', 'draft', 'reference', 'settlement', 'distribution',
];

/** Deterministic filler, so a run is comparable with the one before it. */
function sentence(seed: number): string {
  const length = 9 + (seed % 7);
  const words: string[] = [];
  for (let index = 0; index < length; index += 1) {
    words.push(WORDS[(seed * 11 + index * 7) % WORDS.length]!);
  }
  const text = words.join(' ');
  return `${text.charAt(0).toUpperCase()}${text.slice(1)}.`;
}

/** The style attribute Word puts on essentially every span it emits. */
const MSO_SPAN =
  "font-size:11.0pt;font-family:&quot;Calibri&quot;,sans-serif;" +
  'mso-fareast-font-family:&quot;Times New Roman&quot;;mso-bidi-font-family:&quot;Times New Roman&quot;;' +
  'color:#1F497D;mso-ansi-language:EN-US;mso-fareast-language:EN-US';

/** The style attribute on a Word paragraph, with its pagination noise. */
const MSO_PARAGRAPH =
  "margin:0in;mso-pagination:widow-orphan;line-height:normal;mso-layout-grid-align:none;text-autospace:none";

/**
 * Builds roughly `targetBytes` of Word clipboard HTML.
 *
 * @param targetBytes how much markup to produce; the paste budget uses 200 KB
 */
export function buildLargeWordPaste(targetBytes = 200_000): string {
  const head =
    '<html xmlns:o="urn:schemas-microsoft-com:office:office" ' +
    'xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">' +
    '<head><meta name=ProgId content=Word.Document><meta name=Generator content="Microsoft Word 15">' +
    '<!--[if gte mso 9]><xml><w:WordDocument><w:View>Normal</w:View></w:WordDocument></xml><![endif]-->' +
    '<style><!-- p.MsoNormal {mso-style-parent:""; margin:0in; font-size:11.0pt; ' +
    'font-family:"Calibri",sans-serif;} --></style></head><body lang=EN-US><!--StartFragment-->';
  const tail = '<!--EndFragment--></body></html>';

  const parts: string[] = [head];
  let size = head.length + tail.length;
  let index = 0;

  while (size < targetBytes) {
    const kind = index % 6;
    let block: string;

    if (kind === 2) {
      // A Word "list": a paragraph pretending to be a bullet, which is the single
      // most expensive thing the cleanup has to reconstruct.
      block =
        `<p class=MsoListParagraphCxSpMiddle style='${MSO_PARAGRAPH};mso-list:l0 level1 lfo1;` +
        `text-indent:-.25in'><span style='font-family:Symbol;mso-fareast-font-family:Symbol'>` +
        `<span style='mso-list:Ignore'>&middot;<span style='font:7.0pt "Times New Roman"'>` +
        `&nbsp;&nbsp;&nbsp;&nbsp;</span></span></span><span style='${MSO_SPAN}'>` +
        `${sentence(index)}<o:p></o:p></span></p>`;
    } else if (kind === 4) {
      block =
        `<p class=MsoNormal style='${MSO_PARAGRAPH}'>` +
        `<b style='mso-bidi-font-weight:normal'><span style='${MSO_SPAN}'>${sentence(index)}</span></b>` +
        `<span style='${MSO_SPAN}'> ${sentence(index + 1)}<o:p></o:p></span></p>`;
    } else {
      block =
        `<p class=MsoNormal style='${MSO_PARAGRAPH}'>` +
        `<span style='${MSO_SPAN}'>${sentence(index)}<o:p></o:p></span></p>`;
    }

    parts.push(block);
    size += block.length;
    index += 1;
  }

  parts.push(tail);
  return parts.join('');
}
