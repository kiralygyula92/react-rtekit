import { Fragment, useEffect, useState } from 'react';
import { useEditorContext, useLocalization, useRteSlots } from '../context.js';
import { resolveMessage } from '../localization.js';
import { Popover } from '../ui/Popover.js';
import { toolbarControl } from './anchor.js';

/**
 * Table chrome: the size picker and the controls for the table the caret is in
 *.
 *
 * Cell navigation, selection and column resizing belong to the engine — the
 * table plugin already does them, and reimplementing them here would be a second,
 * worse copy. This is the part an author points at.
 *
 * @module
 */

/** The picker's maximum size. */
const MAX_DIMENSION = 10;

export function TableUi() {
  const editor = useEditorContext();
  const t = useLocalization();
  const { slots } = useRteSlots();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [inTable, setInTable] = useState(false);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  // The toolbar item dispatches `insertTable` with no payload to mean "ask me".
  useEffect(
    () =>
      editor.registerCommand('insertTable', (ctx, next) => {
        if (ctx.payload?.rows && ctx.payload.cols) {
          next();
          return true;
        }
        setPickerOpen(true);
        return true;
      }),
    [editor],
  );

  // Whether the caret is inside a table decides whether the controls show at all.
  useEffect(() => {
    const update = (): void => {
      const content = editor.engine.contentElement;
      const selection = window.getSelection?.();
      const node = selection?.anchorNode ?? null;
      const element = node instanceof Element ? node : node?.parentElement;
      const cell = element?.closest?.('td, th') ?? null;
      setInTable(cell !== null && content.contains(cell));
      setAnchor(cell as HTMLElement | null);
    };
    const off = editor.on('selectionChange', update);
    update();
    return off;
  }, [editor]);

  const TableToolbar = slots.TableToolbar;
  return (
    <>
      {pickerOpen ? (
        <Popover
          open
          anchor={toolbarControl(editor, 'table') ?? editor.engine.contentElement}
          onClose={() => {
            setPickerOpen(false);
          }}
          label={resolveMessage(t.table.insert)}
        >
          <TableSizePicker
            onPick={(rows, cols) => {
              editor.exec('insertTable', { rows, cols });
              setPickerOpen(false);
              editor.focus('restore');
            }}
          />
        </Popover>
      ) : null}

      {inTable && anchor ? (
        <Popover
          open
          anchor={anchor}
          placement="bottom-start"
          onClose={() => {
            setInTable(false);
          }}
          label={resolveMessage(t.table.insert)}
          noPadding
        >
          {/*
           * A menu, in the same rows every other menu in the editor uses. These were
           * eight text buttons on a wrapping line: accented, so every option read as a
           * link, and ordered by nothing in particular, so "Delete table" sat next to
           * "Header row" and the two destructive items were mixed in with the rest.
           * Grouped and stacked, the list can be read down rather than searched.
           */}
          <TableToolbar role="menu" aria-label={resolveMessage(t.toolbar.table)}>
            {(
              [
                [
                  ['addRowBefore', t.table.addRowBefore],
                  ['addRowAfter', t.table.addRowAfter],
                ],
                [
                  ['addColumnBefore', t.table.addColumnBefore],
                  ['addColumnAfter', t.table.addColumnAfter],
                ],
                [['toggleHeaderRow', t.table.headerRow]],
                [
                  ['deleteRow', t.table.deleteRow],
                  ['deleteColumn', t.table.deleteColumn],
                  ['deleteTable', t.table.deleteTable],
                ],
              ] as const
            ).map((group, groupIndex) => (
              // Positional groups; their contents are what identifies them.
              <Fragment key={`group-${groupIndex}`}>
                {groupIndex > 0 ? (
                  <div className="rte-table-toolbar__separator" role="separator" />
                ) : null}
                {group.map(([command, label]) => (
                  <button
                    key={command}
                    type="button"
                    role="menuitem"
                    className="rte-menu__item"
                    onMouseDown={(event) => {
                      // The caret stays in the cell the command applies to.
                      event.preventDefault();
                    }}
                    onClick={() => {
                      editor.exec(command);
                    }}
                  >
                    {resolveMessage(label)}
                  </button>
                ))}
              </Fragment>
            ))}
          </TableToolbar>
        </Popover>
      ) : null}
    </>
  );
}

/** A 10×10 hover grid, which is how every editor asks for a table size. */
function TableSizePicker({ onPick }: { onPick: (rows: number, cols: number) => void }) {
  const t = useLocalization();
  const [hover, setHover] = useState({ rows: 1, cols: 1 });

  return (
    <div className="rte-table-picker">
      <div
        className="rte-table-picker__grid"
        role="grid"
        // The cells are the tab stops: a grid that traps focus on its container has
        // nowhere useful to put the caret.
        tabIndex={-1}
        aria-label={resolveMessage(t.table.insert)}
        onMouseLeave={() => {
          setHover({ rows: 1, cols: 1 });
        }}
      >
        {Array.from({ length: MAX_DIMENSION }, (_, row) => (
          // Positional by nature: the grid is a fixed 10×10 of coordinates.
          <div key={`row-${row}`} className="rte-table-picker__row" role="row">
            {Array.from({ length: MAX_DIMENSION }, (_, col) => {
              const rows = row + 1;
              const cols = col + 1;
              const active = rows <= hover.rows && cols <= hover.cols;
              return (
                <button
                  key={`cell-${col}`}
                  type="button"
                  role="gridcell"
                  className="rte-table-picker__cell"
                  data-active={active}
                  aria-label={resolveMessage(t.table.size, { rows, columns: cols })}
                  onMouseEnter={() => {
                    setHover({ rows, cols });
                  }}
                  onFocus={() => {
                    setHover({ rows, cols });
                  }}
                  onClick={() => {
                    onPick(rows, cols);
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
      <p className="rte-table-picker__label" aria-live="polite">
        {resolveMessage(t.table.size, { rows: hover.rows, columns: hover.cols })}
      </p>
    </div>
  );
}
