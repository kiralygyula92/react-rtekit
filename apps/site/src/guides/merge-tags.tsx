import { Code, Section, SeeAlso } from './Guide';

/** Placeholders the backend substitutes, which survive everything the author does to them. */
export function MergeTags() {
  return (
    <>
      <p className="page__lead">
        Placeholders the backend substitutes, which survive everything the author does to them.
      </p>

      <Section id="config" title="Configuring them">
        <Code label="Merge tags">{`<RichTextEditor
  mergeTags={{
    tags: [
      { key: 'contact_first_name', label: 'Contact first name', group: 'Contact', sample: 'Dana' },
      { key: 'org_name', label: 'Organization name', group: 'Organization', sample: 'Clearwater' },
    ],
    trigger: '{{',
    unknownTagBehaviour: 'warn',
  }}
/>`}</Code>
      </Section>

      <Section id="atomic" title="Why they are nodes">
        <p>
          A merge tag is one atomic node, not a run of text that happens to look like{' '}
          <code>{'{key}'}</code>. Select the whole message and bold it: the tag comes through
          intact. Delete backwards into it: the whole tag goes, not its last letter. A tag whose
          key has been half-deleted is a backend substitution that silently does nothing.
        </p>

        <Code label="Reading them back">{`editor.getMergeTags();                 // ['contact_first_name', 'org_name']
validateMergeTagKeys(html, knownKeys); // the ones you do not recognize`}</Code>
      </Section>

      <Section id="preview" title="Preview">
        <p>
          Preview substitutes sample values without touching the stored value, which still
          carries the keys:
        </p>

        <Code label="Preview">{`editor.getHTML({ mergeTagPreview: { contact_first_name: 'Dana' } });`}</Code>
      </Section>

      <SeeAlso examples={['merge-tags', 'parity-skimmer-email', 'email-output']} guides={['html-interop']} />
    </>
  );
}
