// Cursor utilities mapping for table interactions
// Exported mapping: keyword -> { appearance, bestUsedFor }
const cursorInfo = {
  default: { appearance: 'Arrow', bestUsedFor: 'Normal cells' },
  pointer: { appearance: 'Hand / Pointing finger', bestUsedFor: 'Clickable rows, buttons, links' },
  cell: { appearance: 'Thick crosshair', bestUsedFor: 'Selecting individual cells' },
  'col-resize': { appearance: 'Left-right arrows', bestUsedFor: 'Resizing table columns' },
  'row-resize': { appearance: 'Up-down arrows', bestUsedFor: 'Resizing table rows' },
  text: { appearance: 'I-beam', bestUsedFor: 'Editable text cells' },
  move: { appearance: 'Move / Hand with fingers', bestUsedFor: 'Draggable rows or reordering' },
  grab: { appearance: 'Move / Hand with fingers', bestUsedFor: 'Draggable rows or reordering' },
  grabbing: { appearance: 'Closed hand', bestUsedFor: 'While dragging' },
  wait: { appearance: 'Hourglass / Spinner', bestUsedFor: 'Loading data' },
  progress: { appearance: 'Hourglass / Spinner', bestUsedFor: 'Loading data' },
  'not-allowed': { appearance: 'Circle with line', bestUsedFor: 'Disabled actions' },
  crosshair: { appearance: '+ sign', bestUsedFor: 'Precise selection' },
};

module.exports = cursorInfo;
export default cursorInfo;
