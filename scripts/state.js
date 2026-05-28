// ─────────────────────────────────────────────
//  STATE
// ─────────────────────────────────────────────
let currentTemplate   = null
const repeatableState = {}
const formSnapshots   = {}
let restoringSnapshot = false

let calConfig = null
const calState = {
  gains:    [0], nextGain:  1,
  locs:     {},
  blocks:   {},
  nextMeas:  0,
  nextBlock: 0,
}
function resetCalState() {
  calState.gains    = [0]; calState.nextGain  = 1
  calState.locs     = {};  calState.blocks    = {}
  calState.nextMeas = 0;   calState.nextBlock = 0
}

const notesTableState = {
  nextIdx:          0,
  rows:             [],
  predefinedEvents: [],
}
let calBlockTegadermDefault = 'Tegaderm'
function resetNotesState() {
  notesTableState.nextIdx          = 0
  notesTableState.rows             = []
  notesTableState.predefinedEvents = []
}

const icpState = {
  measRows:     [],
  etvGroups:    [],
  cpcGroups:    [],
  rowCounter:   0,
  groupCounter: 0,
  notes:        [],
  noteCounter:  0,
}
function resetIcpState() {
  icpState.measRows     = []
  icpState.etvGroups    = []
  icpState.cpcGroups    = []
  icpState.rowCounter   = 0
  icpState.groupCounter = 0
  icpState.notes        = []
  icpState.noteCounter  = 0
}
