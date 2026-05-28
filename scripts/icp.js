// ─────────────────────────────────────────────
//  ICP — HELPERS
// ─────────────────────────────────────────────
function icpNow() {
  const now = new Date()
  const pad = n => String(n).padStart(2, '0')
  return `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
}

function icpCalcEnd(startStr) {
  const secs = parseInt(document.getElementById('icp_interval')?.value || '30', 10)
  if (!secs || !startStr) return ''
  const parts = startStr.split(':').map(Number)
  if (parts.length !== 3 || parts.some(isNaN)) return ''
  const [h, m, s] = parts
  const total = h * 3600 + m * 60 + s + secs
  const pad   = n => String(n).padStart(2, '0')
  return `${pad(Math.floor(total / 3600) % 24)}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`
}

function icpUpdateEnd(startInput, endId) {
  const end = icpCalcEnd(startInput.value)
  const el  = document.getElementById(endId)
  if (end && el) el.value = end
}

function initIcpTimePicker(startId, endId) {
  const opts    = { noCalendar: true, enableTime: true, enableSeconds: true, time_24hr: true, dateFormat: 'H:i:S', allowInput: false }
  const startEl = document.getElementById(startId)
  const endEl   = document.getElementById(endId)
  if (startEl) flatpickr(startEl, {
    ...opts,
    defaultDate: startEl.value || null,
    onChange: () => {
      const end = icpCalcEnd(startEl.value)
      if (!end) return
      const fp = document.getElementById(endId)?._flatpickr
      fp ? fp.setDate(end, false) : (document.getElementById(endId).value = end)
    }
  })
  if (endEl) flatpickr(endEl, { ...opts, defaultDate: endEl.value || null })
}


// ─────────────────────────────────────────────
//  ICP — TABLE CARD
// ─────────────────────────────────────────────
const ICP_COLS = "grid-template-columns: 190px 115px 115px 1fr 24px"

function icpColHeader() {
  return `<div class="grid gap-3 pb-2 border-b border-slate-200" style="${ICP_COLS}">
    <span class="text-xs font-semibold text-slate-400 mono uppercase tracking-wider">Baseline</span>
    <span class="text-xs font-semibold text-slate-400 mono uppercase tracking-wider">Start Time</span>
    <span class="text-xs font-semibold text-slate-400 mono uppercase tracking-wider">End Time</span>
    <span class="text-xs font-semibold text-slate-400 mono uppercase tracking-wider">BP</span>
    <span></span>
  </div>`
}

function buildIcpTableCard(section, tmpl) {
  return `<div class="border-l-4 ${tmpl.style.section} px-5 pt-5 pb-5">
    <div class="flex items-center gap-2.5 mb-5">
      <span class="text-slate-400">${section.icon}</span>
      <h2 class="text-xs font-semibold text-slate-600 uppercase tracking-wider mono">${section.title}</h2>
      <div class="ml-auto flex items-center gap-2">
        <span class="text-xs text-slate-400 mono uppercase tracking-wider">Interval</span>
        <input type="number" id="icp_interval" min="0" value="30"
          class="w-20 text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-center">
        <span class="text-xs text-slate-400">sec</span>
      </div>
    </div>

    <div class="mb-5">
      <p class="text-xs font-semibold text-slate-500 mono uppercase tracking-wider mb-2">Start of Measurement</p>
      ${icpColHeader()}
      <div id="icp_meas_rows"></div>
      <div class="mt-2">${buildAddBtn('Start of measurement', "addIcpMeasRow()")}</div>
    </div>

    <div class="mb-5">
      <p class="text-xs font-semibold text-slate-500 mono uppercase tracking-wider mb-2">After ETV</p>
      <div id="icp_etv_groups"></div>
      <div class="mt-2">${buildAddBtn('After ETV', "addIcpGroup('etv')")}</div>
    </div>

    <div class="mb-5">
      <p class="text-xs font-semibold text-slate-500 mono uppercase tracking-wider mb-2">After CPC</p>
      <div id="icp_cpc_groups"></div>
      <div class="mt-2">${buildAddBtn('After CPC', "addIcpGroup('cpc')")}</div>
    </div>

    <div class="pt-5 border-t border-slate-100">
      <p class="text-xs font-semibold text-slate-600 uppercase tracking-wider mono mb-3">Notes</p>
      <div class="grid gap-2 pb-2 border-b border-slate-100" style="grid-template-columns: 160px 1fr 24px">
        <span class="text-xs font-semibold text-slate-400 mono uppercase tracking-wider">Time</span>
        <span class="text-xs font-semibold text-slate-400 mono uppercase tracking-wider">Comment</span>
        <span></span>
      </div>
      <div id="icp_notes_rows" class="space-y-2"></div>
      <div class="mt-3">${buildAddBtn('Add note', "addIcpNote()")}</div>
    </div>
  </div>`
}

// ─────────────────────────────────────────────
//  ICP — MEASUREMENT ROWS
// ─────────────────────────────────────────────
function addIcpMeasRow() {
  const idx   = ++icpState.rowCounter
  const n     = icpState.measRows.length + 1
  const start = icpNow()
  const end   = icpCalcEnd(start)
  const label = `Start of measurement ${n}`
  icpState.measRows.push({ idx, label })

  const inp  = INP_SM
  const html = `<div id="icp_meas_${idx}" class="grid gap-3 items-center py-2 border-t border-slate-100" style="${ICP_COLS}">
    <span id="icp_meas_${idx}_label" class="text-sm text-slate-700">${label}</span>
    <input type="text" id="icp_meas_${idx}_start" value="${start}" class="${inp} cursor-pointer">
    <input type="text" id="icp_meas_${idx}_end"   value="${end}"   class="${inp} cursor-pointer">
    <input type="text" id="icp_meas_${idx}_bp" placeholder="—" class="${inp}">
    ${buildDelBtn(`deleteIcpMeasRow(${idx})`)}
  </div>`
  document.getElementById('icp_meas_rows').insertAdjacentHTML('beforeend', html)
  initIcpTimePicker(`icp_meas_${idx}_start`, `icp_meas_${idx}_end`)
}

function deleteIcpMeasRow(idx) {
  document.getElementById(`icp_meas_${idx}`)?.remove()
  icpState.measRows = icpState.measRows.filter(r => r.idx !== idx)
  icpState.measRows.forEach((r, i) => {
    const newLabel = `Start of measurement ${i + 1}`
    r.label = newLabel
    const el = document.getElementById(`icp_meas_${r.idx}_label`)
    if (el) el.textContent = newLabel
  })
}

// ─────────────────────────────────────────────
//  ICP — ETV / CPC GROUPS
// ─────────────────────────────────────────────
function addIcpGroup(type) {
  const gIdx   = ++icpState.groupCounter
  const groups = type === 'etv' ? icpState.etvGroups : icpState.cpcGroups
  const n      = groups.length + 1
  const label = type === 'etv' ? `After ETV ${n}` : `After CPC ${n}`
  const group = { gIdx, label, ventRows: [] }
  if (type === 'etv') icpState.etvGroups.push(group)
  else                icpState.cpcGroups.push(group)

  const html = `<div id="icp_${type}_group_${gIdx}" class="border border-slate-100 rounded-lg p-3 mb-2">
    <div class="flex items-center justify-between mb-2">
      <span id="icp_${type}_group_${gIdx}_label" class="text-sm font-medium text-slate-700">${label}</span>
      ${buildDelBtn(`deleteIcpGroup('${type}',${gIdx})`)}
    </div>
    <div id="icp_${type}_group_${gIdx}_rows"></div>
    <div class="flex gap-5 mt-2">
      ${buildAddBtn('Right Ventricle', `addIcpVentRow('${type}',${gIdx},'right')`)}
      ${buildAddBtn('Left Ventricle',  `addIcpVentRow('${type}',${gIdx},'left')`)}
    </div>
  </div>`
  document.getElementById(`icp_${type}_groups`).insertAdjacentHTML('beforeend', html)
}

function deleteIcpGroup(type, gIdx) {
  document.getElementById(`icp_${type}_group_${gIdx}`)?.remove()
  if (type === 'etv') icpState.etvGroups = icpState.etvGroups.filter(g => g.gIdx !== gIdx)
  else                icpState.cpcGroups = icpState.cpcGroups.filter(g => g.gIdx !== gIdx)
  const prefix = type === 'etv' ? 'After ETV' : 'After CPC'
  const groups = type === 'etv' ? icpState.etvGroups : icpState.cpcGroups
  groups.forEach((g, i) => {
    const newLabel = `${prefix} ${i + 1}`
    g.label = newLabel
    const el = document.getElementById(`icp_${type}_group_${g.gIdx}_label`)
    if (el) el.textContent = newLabel
  })
}

function addIcpVentRow(type, gIdx, side) {
  const rIdx  = ++icpState.rowCounter
  const start = icpNow()
  const end   = icpCalcEnd(start)
  const label = side === 'right' ? 'Right Ventricle' : 'Left Ventricle'
  const group = (type === 'etv' ? icpState.etvGroups : icpState.cpcGroups).find(g => g.gIdx === gIdx)
  if (group) group.ventRows.push({ rIdx, side })

  const inp     = "w-full text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 placeholder-slate-300"
  const startId = `icp_${type}_${gIdx}_vent_${rIdx}_start`
  const endId   = `icp_${type}_${gIdx}_vent_${rIdx}_end`
  const html = `<div id="icp_${type}_${gIdx}_vent_${rIdx}"
    class="grid gap-3 items-center py-1.5 border-t border-slate-100" style="${ICP_COLS}">
    <span class="text-sm text-slate-500 pl-1">${label}</span>
    <input type="text" id="${startId}" value="${start}" class="${inp} cursor-pointer">
    <input type="text" id="${endId}"   value="${end}"   class="${inp} cursor-pointer">
    <input type="text" id="icp_${type}_${gIdx}_vent_${rIdx}_bp" placeholder="—" class="${inp}">
    ${buildDelBtn(`deleteIcpVentRow('${type}',${gIdx},${rIdx})`)}
  </div>`
  document.getElementById(`icp_${type}_group_${gIdx}_rows`).insertAdjacentHTML('beforeend', html)
  initIcpTimePicker(startId, endId)
}

function deleteIcpVentRow(type, gIdx, rIdx) {
  document.getElementById(`icp_${type}_${gIdx}_vent_${rIdx}`)?.remove()
  const groups = type === 'etv' ? icpState.etvGroups : icpState.cpcGroups
  const group  = groups.find(g => g.gIdx === gIdx)
  if (group) group.ventRows = group.ventRows.filter(r => r.rIdx !== rIdx)
}

// ─────────────────────────────────────────────
//  ICP — NOTES
// ─────────────────────────────────────────────
function addIcpNote() {
  const idx  = ++icpState.noteCounter
  icpState.notes.push(idx)
  const inp  = INP_SM
  const html = `<div id="icp_note_${idx}" class="grid gap-2 mt-2 items-center" style="grid-template-columns: 160px 1fr 24px">
    <input type="text" id="icp_note_${idx}_time"    placeholder="HH:MM:SS" class="${inp} cursor-pointer">
    <input type="text" id="icp_note_${idx}_comment" placeholder="Comment…" class="${inp}">
    ${buildDelBtn(`deleteIcpNote(${idx})`)}
  </div>`
  document.getElementById('icp_notes_rows').insertAdjacentHTML('beforeend', html)
  flatpickr(document.getElementById(`icp_note_${idx}_time`), {
    noCalendar: true, enableTime: true, enableSeconds: true,
    time_24hr: true, dateFormat: 'H:i:S', allowInput: false,
  })
}

function deleteIcpNote(idx) {
  document.getElementById(`icp_note_${idx}`)?.remove()
  icpState.notes = icpState.notes.filter(i => i !== idx)
}
