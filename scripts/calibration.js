// ─────────────────────────────────────────────
//  CALIBRATION SECTION
// ─────────────────────────────────────────────
function getAllSelectedLocations() {
  return Array.from(document.querySelectorAll('#locations_dropdown input:checked')).map(cb => cb.value)
}
function getPatMeasLocations() {
  return getAllSelectedLocations().filter(l => !l.toUpperCase().startsWith('CAL'))
}
function getCalLocations() {
  return getAllSelectedLocations().filter(l => l.toUpperCase().startsWith('CAL'))
}

function refreshLocationPickers() {
  if (restoringSnapshot) return
  rebuildCalRows()
}

function rebuildCalRows() {
  if (!document.getElementById('cal_meas_rows')) return
  const patLocs = getPatMeasLocations()
  const calLocs = getCalLocations()

  const newLocs = {}
  patLocs.forEach(loc => {
    newLocs[loc] = calState.locs[loc] || { measIdxs: [calState.nextMeas++] }
  })
  calState.locs = newLocs

  const newBlocks = {}
  calState.gains.forEach(gainIdx => {
    newBlocks[gainIdx] = {}
    calLocs.forEach(calLoc => {
      const existing = calState.blocks[gainIdx]?.[calLoc]
      newBlocks[gainIdx][calLoc] = existing || [calState.nextBlock++]
    })
  })
  calState.blocks = newBlocks

  renderCalRows()
}

function renderCalRows() {
  const measCont  = document.getElementById('cal_meas_rows')
  const blockCont = document.getElementById('cal_block_rows')
  if (!measCont || !blockCont) return

  const noLoc  = `<p class="text-xs text-slate-400 italic">Select locations in Device Configuration first</p>`
  const addIcon = `<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>`

  // Patient measurement groups
  measCont.innerHTML = ''
  if (!Object.keys(calState.locs).length) { measCont.innerHTML = noLoc }
  else Object.entries(calState.locs).forEach(([patLoc, { measIdxs }], gi) => {
    const slug = patLoc.replace(/[^a-zA-Z0-9]/g, '_')
    const sep  = gi > 0 ? `<div class="border-t border-slate-200 my-3"></div>` : ''
    const rows = measIdxs.map((idx, pos) => buildMeasRow(idx, patLoc, pos)).join('')
    measCont.insertAdjacentHTML('beforeend', `${sep}<div id="cal_meas_group_${slug}">
      ${rows}
      <button onclick="addMeasForLoc('${patLoc}')"
        class="mt-1 flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors pl-8">
        ${addIcon}Add ${patLoc}
      </button>
    </div>`)
  })

  // CAL block groups — per gain (S session), then per CAL location
  blockCont.innerHTML = ''
  const anyBlocks = calState.gains.some(gainIdx => Object.keys(calState.blocks[gainIdx] || {}).length > 0)
  if (!anyBlocks) { blockCont.innerHTML = noLoc }
  else calState.gains.forEach((gainIdx, gainPos) => {
    const gainBlocks = calState.blocks[gainIdx] || {}
    const calLocKeys = Object.keys(gainBlocks)
    if (!calLocKeys.length) return
    const sLabel = `S${gainPos + 1}`
    const sep    = gainPos > 0 ? `<div class="border-t border-slate-200 my-3"></div>` : ''
    let inner = ''
    calLocKeys.forEach((calLoc, ci) => {
      const calSlug = calLoc.replace(/[^a-zA-Z0-9]/g, '_')
      const cSep    = ci > 0 ? `<div class="border-t border-slate-100 my-2"></div>` : ''
      const rows    = gainBlocks[calLoc].map((idx, pos) => buildBlockRow(idx, gainIdx, gainPos, calLoc, pos)).join('')
      inner += `${cSep}<div id="cal_block_${gainIdx}_${calSlug}">
        <p class="mono text-xs text-slate-400 mb-1">${calLoc}</p>
        ${rows}
        <button onclick="addBlockForLoc(${gainIdx},'${calLoc}')"
          class="mt-0.5 flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors pl-8">
          ${addIcon}Add ${calLoc}
        </button>
      </div>`
    })
    blockCont.insertAdjacentHTML('beforeend', `${sep}<div id="cal_block_gain_${gainIdx}">
      <p class="mono text-xs font-semibold text-slate-500 uppercase mb-1.5" id="cal_block_s_${gainIdx}">${sLabel} — Gain ${gainPos + 1}</p>
      ${inner}
    </div>`)
  })

  refreshGainPickers()
}

function buildCalibrationCard(section, tmpl) {
  calConfig = section
  const subH = t => `<p class="mono text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">${t}</p>`
  const sep  = `<div class="border-t border-slate-100 my-4"></div>`
  const addGainBtn = `<button onclick="addGainRow()"
    class="mt-2.5 flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors">
    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/>
    </svg>Add Gain</button>`

  return `<div class="border-l-4 ${tmpl.style.section} px-5 pt-5 pb-5">
    <div class="flex items-center gap-2.5 mb-4">
      <span class="text-slate-400">${section.icon}</span>
      <h2 class="text-xs font-semibold text-slate-600 uppercase tracking-wider mono">${section.title}</h2>
    </div>
    ${subH('Gains')}
    <div id="cal_gain_rows" class="space-y-2">${buildGainRow(0)}</div>
    ${addGainBtn}
    ${sep}
    ${subH('Patient Measurements')}
    <div id="cal_meas_rows"></div>
    ${sep}
    ${subH('CAL Blocks')}
    <div id="cal_block_rows"></div>
  </div>`
}

// ── Gain rows ──────────────────────────────
function buildGainRow(idx) {
  const pos  = calState.gains.indexOf(idx)
  const cell = "w-full text-sm text-center text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 placeholder-slate-300"
  const inputs = [0,1,2,3].map(v =>
    `<input type="text" id="cal_gain_${idx}_${v}" placeholder="—" class="${cell}"
      oninput="this.value=this.value.replace(/[^0-9.-]/g,'')">`
  ).join('')
  return `<div id="cal_gain_row_${idx}" class="flex items-center gap-2">
    <span id="cal_gain_label_${idx}" class="mono text-xs text-slate-400 shrink-0 w-12">Gain ${pos + 1}</span>
    <div class="grid grid-cols-4 gap-1.5 flex-1">${inputs}</div>
    <button id="cal_gain_remove_${idx}" onclick="removeGainRow(${idx})"
      ${calState.gains.length <= 1 ? 'style="display:none"' : ''}
      class="text-slate-300 hover:text-red-400 text-lg leading-none shrink-0 w-5 text-center">×</button>
  </div>`
}

function addGainRow() {
  const idx = calState.nextGain++
  calState.gains.push(idx)
  calState.blocks[idx] = {}
  getCalLocations().forEach(calLoc => { calState.blocks[idx][calLoc] = [calState.nextBlock++] })
  document.getElementById('cal_gain_rows').insertAdjacentHTML('beforeend', buildGainRow(idx))
  refreshGainLabels()
  renderCalRows()
}

function removeGainRow(idx) {
  if (calState.gains.length <= 1) return
  calState.gains = calState.gains.filter(i => i !== idx)
  delete calState.blocks[idx]
  document.getElementById(`cal_gain_row_${idx}`)?.remove()
  refreshGainLabels()
  renderCalRows()
}

function refreshGainLabels() {
  calState.gains.forEach((idx, pos) => {
    const lbl = document.getElementById(`cal_gain_label_${idx}`)
    const btn = document.getElementById(`cal_gain_remove_${idx}`)
    if (lbl) lbl.textContent = `Gain ${pos + 1}`
    if (btn) btn.style.display = calState.gains.length > 1 ? '' : 'none'
  })
}

function refreshGainPickers() {
  if (!document.getElementById('cal_gain_rows')) return
  const opts = '<option value="">— gain —</option>' + calState.gains.map((idx, pos) =>
    `<option value="${idx}">Gain ${pos + 1}</option>`
  ).join('')
  document.querySelectorAll('.cal-gain-picker').forEach(sel => {
    const val = sel.value
    sel.innerHTML = opts
    if ([...sel.options].some(o => o.value === val)) sel.value = val
    syncSelectStyle(sel)
  })
}

function onMeasGainChange(idx, gainIdxStr) {
  const pos   = calState.gains.indexOf(parseInt(gainIdxStr))
  const label = document.getElementById(`cal_meas_slabel_${idx}`)
  if (label) label.textContent = pos >= 0 ? `S${pos + 1})` : 'S?)'
}

function toggleAllChannels(id, allCheckbox) {
  ;['a','b','c','d'].forEach(ch => {
    const el = document.getElementById(`${id}_${ch}`)
    if (el) el.checked = allCheckbox.checked
  })
  updateMultiselectLabel(id)
}

function onChannelChange(id) {
  const allChecked = ['a','b','c','d'].every(ch => document.getElementById(`${id}_${ch}`)?.checked)
  const allEl = document.getElementById(`${id}_all`)
  if (allEl) allEl.checked = allChecked
  updateMultiselectLabel(id)
}

// ── Measurement rows ───────────────────────
function buildMeasRow(idx, patLoc, posInLoc) {
  const sm = "text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2 py-2"
  return `<div id="cal_meas_row_${idx}" class="flex items-center gap-2 mb-1.5">
    <span id="cal_meas_slabel_${idx}" class="mono text-xs text-slate-500 shrink-0 w-7">S?)</span>
    <span id="cal_meas_loc_${idx}" class="mono text-sm text-slate-700 shrink-0">${patLoc}_${posInLoc + 1}</span>
    <select id="cal_meas_${idx}_gain" data-meas-idx="${idx}" class="${sm} cal-gain-picker select-placeholder"
      onchange="onMeasGainChange(${idx}, this.value); syncSelectStyle(this)">
      <option value="">— gain —</option>
    </select>
    <input type="text" id="cal_meas_${idx}_note" placeholder="Comment..." class="${sm} flex-1 min-w-0" />
    <button onclick="removeMeasForLoc('${patLoc}', ${idx})"
      ${posInLoc === 0 ? 'style="visibility:hidden"' : ''}
      class="text-slate-300 hover:text-red-400 text-lg leading-none shrink-0">×</button>
  </div>`
}

function addMeasForLoc(patLoc) {
  const locData = calState.locs[patLoc]
  if (!locData) return
  const idx      = calState.nextMeas++
  locData.measIdxs.push(idx)
  const slug     = patLoc.replace(/[^a-zA-Z0-9]/g, '_')
  const addBtn   = document.querySelector(`#cal_meas_group_${slug} > button`)
  const posInLoc = locData.measIdxs.length - 1
  addBtn?.insertAdjacentHTML('beforebegin', buildMeasRow(idx, patLoc, posInLoc))
  refreshGainPickers()
}

function removeMeasForLoc(patLoc, idx) {
  const locData = calState.locs[patLoc]
  if (!locData) return
  locData.measIdxs = locData.measIdxs.filter(i => i !== idx)
  document.getElementById(`cal_meas_row_${idx}`)?.remove()
  locData.measIdxs.forEach((i, pos) => {
    const span = document.getElementById(`cal_meas_loc_${i}`)
    if (span) span.textContent = `${patLoc}_${pos + 1}`
  })
}

// ── CalBlock rows ──────────────────────────
function buildBlockRow(idx, gainIdx, gainPos, calLoc, posInLoc) {
  const sm     = "text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2 py-2"
  const ndOpts = (calConfig?.ndOptions || []).map(o => `<option value="${o}">${o}</option>`).join('')
  const chLbl  = (id, val, onch) =>
    `<label class="flex items-center gap-2.5 text-sm text-slate-600 cursor-pointer px-2 py-1.5 hover:bg-slate-50 rounded-lg select-none">
      <input type="checkbox" id="${id}" value="${val}" onchange="${onch}"
        class="w-4 h-4 rounded border-slate-300 cursor-pointer accent-slate-800">${val}</label>`
  const chBoxes = [
    chLbl(`cal_block_${idx}_ch_all`,  'All', `toggleAllChannels('cal_block_${idx}_ch', this)`),
    ...['A','B','C','D'].map(ch =>
      chLbl(`cal_block_${idx}_ch_${ch.toLowerCase()}`, ch, `onChannelChange('cal_block_${idx}_ch')`))
  ].join('')
  const tgOpts = ['Tegaderm','No Tegaderm', 'Tegaderm + Reflector'].map(o =>
    `<option value="${o}"${o === calBlockTegadermDefault ? ' selected' : ''}>${o}</option>`
  ).join('')
  return `<div id="cal_block_row_${idx}" class="flex items-center gap-2 flex-wrap mb-1.5">
    <span class="mono text-xs text-slate-500 shrink-0 w-7">S${gainPos + 1})</span>
    <span id="cal_block_loc_${idx}" class="mono text-sm text-slate-700 shrink-0">${calLoc}_${posInLoc + 1}</span>
    <select id="cal_block_${idx}_shape" class="${sm}">
      <option value="Flat">Flat</option><option value="Curved">Curved</option>
    </select>
    <select id="cal_block_${idx}_tegaderm" class="${sm}">${tgOpts}</select>
    <select id="cal_block_${idx}_filter" class="${sm}">${ndOpts}</select>
    <span class="text-xs text-slate-400 shrink-0">ND</span>
    <div class="relative" id="cal_block_${idx}_ch_wrap" data-multiselect>
      <button type="button" onclick="toggleMultiselect('cal_block_${idx}_ch')"
        class="${sm} flex items-center justify-between gap-2">
        <span id="cal_block_${idx}_ch_label" class="text-slate-300">Channels</span>
        <svg class="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
        </svg>
      </button>
      <div id="cal_block_${idx}_ch_dropdown" data-ms-dropdown
        class="hidden absolute z-20 bottom-full mb-1 left-0 bg-white border border-slate-200 rounded-lg shadow-lg p-1.5 space-y-0.5" style="min-width:5rem">
        ${chBoxes}
      </div>
    </div>
    <input type="text" id="cal_block_${idx}_note" placeholder="Comment..." class="${sm} flex-1 min-w-0" />
    <button onclick="removeBlockForLoc(${gainIdx},'${calLoc}',${idx})"
      class="text-slate-300 hover:text-red-400 text-lg leading-none shrink-0">×</button>
  </div>`
}

function addBlockForLoc(gainIdx, calLoc) {
  if (!calState.blocks[gainIdx]?.[calLoc]) return
  const idx      = calState.nextBlock++
  calState.blocks[gainIdx][calLoc].push(idx)
  const calSlug  = calLoc.replace(/[^a-zA-Z0-9]/g, '_')
  const addBtn   = document.querySelector(`#cal_block_${gainIdx}_${calSlug} > button`)
  const posInLoc = calState.blocks[gainIdx][calLoc].length - 1
  const gainPos  = calState.gains.indexOf(gainIdx)
  addBtn?.insertAdjacentHTML('beforebegin', buildBlockRow(idx, gainIdx, gainPos, calLoc, posInLoc))
}

function removeBlockForLoc(gainIdx, calLoc, idx) {
  if (!calState.blocks[gainIdx]?.[calLoc]) return
  calState.blocks[gainIdx][calLoc] = calState.blocks[gainIdx][calLoc].filter(i => i !== idx)
  document.getElementById(`cal_block_row_${idx}`)?.remove()
  calState.blocks[gainIdx][calLoc].forEach((i, pos) => {
    const span = document.getElementById(`cal_block_loc_${i}`)
    if (span) span.textContent = `${calLoc}_${pos + 1}`
  })
}
