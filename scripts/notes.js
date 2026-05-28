// ─────────────────────────────────────────────
//  NOTES TABLE SECTION  (PDA Notes)
// ─────────────────────────────────────────────
function buildNotesTableCard(section, tmpl) {
  return `<div class="border-l-4 ${tmpl.style.section} px-5 pt-5 pb-5">
    <div class="flex items-center gap-2.5 mb-4">
      <span class="text-slate-400">${section.icon}</span>
      <h2 class="text-xs font-semibold text-slate-600 uppercase tracking-wider mono">${section.title}</h2>
    </div>
    <div class="overflow-x-auto">
      <table class="w-full text-sm" style="border-collapse:collapse">
        <colgroup>
          <col style="width:200px">
          <col style="width:120px">
          <col>
          <col style="width:28px">
        </colgroup>
        <thead>
          <tr>
            <th class="text-left text-xs font-semibold text-slate-400 mono uppercase tracking-wider pb-2 pr-3">Event</th>
            <th class="text-left text-xs font-semibold text-slate-400 mono uppercase tracking-wider pb-2 pr-3">Time</th>
            <th class="text-left text-xs font-semibold text-slate-400 mono uppercase tracking-wider pb-2">Comments</th>
            <th></th>
          </tr>
        </thead>
        <tbody id="notes-tbody"></tbody>
      </table>
    </div>
    <button onclick="addNotesRow()"
      class="mt-3 text-xs text-slate-500 hover:text-slate-700 border border-dashed border-slate-300 hover:border-slate-400 rounded-lg px-4 py-1.5 transition-colors">
      + Add row
    </button>
  </div>`
}

function initNotesTable(section) {
  notesTableState.predefinedEvents = section.predefinedEvents || []
  section.predefinedEvents.forEach(evt => addNotesRow(evt))
}

function addNotesRow(evtName) {
  evtName = evtName || ''
  const idx  = notesTableState.nextIdx++
  notesTableState.rows.push(idx)

  const tbody = document.getElementById('notes-tbody')
  if (!tbody) return

  const inp    = "w-full text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 placeholder-slate-300"
  const selBase = inp + " select-placeholder"

  const opts = notesTableState.predefinedEvents.map(e =>
    `<option value="${esc(e)}"${e === evtName ? ' selected' : ''}>${esc(e)}</option>`
  ).join('')
  const isPredef = !!evtName && evtName !== '__other__'

  const tr = document.createElement('tr')
  tr.id = `notes-row-${idx}`
  tr.className = 'border-t border-slate-100'
  tr.innerHTML = `
    <td class="py-1.5 pr-3 align-top">
      <select id="notes_evt_${idx}" onchange="onNotesEventChange(${idx}, this)"
        class="${isPredef ? inp : selBase}">
        <option value="">-- Select --</option>
        ${opts}
        <option value="__other__">Other...</option>
      </select>
      <input type="text" id="notes_evt_text_${idx}" class="mt-1 ${inp} hidden" />
    </td>
    <td class="py-1.5 pr-3 align-top">
      <input type="text" id="notes_time_${idx}" class="${inp} cursor-pointer" />
    </td>
    <td class="py-1.5 pr-3 align-top">
      <input type="text" id="notes_cmts_${idx}" class="${inp}" />
    </td>
    <td class="py-1.5 align-top">
      <button onclick="removeNotesRow(${idx})"
        class="text-slate-300 hover:text-red-400 transition-colors text-lg leading-none">×</button>
    </td>`
  tbody.appendChild(tr)
  flatpickr(document.getElementById(`notes_time_${idx}`), {
    noCalendar: true, enableTime: true, enableSeconds: true,
    time_24hr: true, dateFormat: 'H:i:S', allowInput: false,
  })
}

function removeNotesRow(idx) {
  notesTableState.rows = notesTableState.rows.filter(r => r !== idx)
  document.getElementById(`notes-row-${idx}`)?.remove()
}

function onNotesEventChange(idx, select) {
  select.classList.toggle('select-placeholder', !select.value || select.value === '')
  const textInput = document.getElementById(`notes_evt_text_${idx}`)
  if (!textInput) return
  if (select.value === '__other__') {
    textInput.classList.remove('hidden')
    textInput.focus()
  } else {
    textInput.classList.add('hidden')
    textInput.value = ''
  }
}

// ─────────────────────────────────────────────
//  PDF EXPORT  (PDA Notes)
// ─────────────────────────────────────────────
function buildPdfContent() {
  const studyId  = document.getElementById('study_id')?.value.trim()  || '—'
  const cohort   = document.getElementById('cohort')?.value            || '—'
  const date     = toIsoDate(document.getElementById('date')?.value)   || '—'
  const hospital = document.getElementById('hospital')?.value.trim()   || '—'
  const bldRaw   = document.getElementById('building')?.value          || ''
  const bldOther = document.getElementById('building_other')?.value.trim() || ''
  const building      = bldOther || bldRaw || '—'
  const room          = document.getElementById('room')?.value.trim()       || '—'
  const probeHolder   = document.getElementById('probe_holder')?.value.trim()  || '—'
  const computerTech  = document.getElementById('computer_tech')?.value.trim() || '—'

  const msRaw = document.getElementById('meas_start')?.value || ''
  const meRaw = document.getElementById('meas_end')?.value   || ''

  function fmtTime(raw) {
    if (!raw) return null
    const utc = toUtcDateTime(raw)
    const et  = toIsoDateTime(raw)
    return utc ? `${utc} UTC  (ET: ${et})` : (et || null)
  }

  const measRows = msRaw ? `
    <div class="mr full"><span class="ml">Start</span><span class="mv">${esc(fmtTime(msRaw) || '—')}</span></div>
    <div class="mr full"><span class="ml">End</span><span class="mv">${esc(fmtTime(meRaw) || '—')}</span></div>` : ''

  const tableRows = notesTableState.rows.map(idx => {
    const evtSel = document.getElementById(`notes_evt_${idx}`)
    const evtTxt = document.getElementById(`notes_evt_text_${idx}`)
    const evt    = evtSel?.value === '__other__' ? (evtTxt?.value.trim() || 'Other') : (evtSel?.value || '')
    const time   = document.getElementById(`notes_time_${idx}`)?.value.trim() || ''
    const cmts   = document.getElementById(`notes_cmts_${idx}`)?.value.trim() || ''
    return `<tr>
      <td class="ec">${esc(evt)}</td>
      <td class="tc">${esc(time)}</td>
      <td>${esc(cmts)}</td>
    </tr>`
  }).join('')

  return `
    <div class="org">BCH · FNNDSC Neurovascular Lab</div>
    <div class="doc-title">PDA Notes — Procedure Log</div>
    <div class="meta">
      <div class="mr"><span class="ml">Study ID</span><span class="mv">${esc(studyId)}</span></div>
      <div class="mr"><span class="ml">Cohort</span><span class="mv">${esc(cohort)}</span></div>
      <div class="mr"><span class="ml">Date</span><span class="mv">${esc(date)}</span></div>
      <div class="mr"><span class="ml">Hospital</span><span class="mv">${esc(hospital)}</span></div>
      <div class="mr"><span class="ml">Location</span><span class="mv">${esc(building)} / ${esc(room)}</span></div>
      <div class="mr"><span class="ml">Probe Holder</span><span class="mv">${esc(probeHolder)}</span></div>
      <div class="mr"><span class="ml">Computer Tech</span><span class="mv">${esc(computerTech)}</span></div>
      ${measRows}
    </div>
    <div class="sec">Procedure Notes</div>
    <table>
      <thead><tr>
        <th class="ec">Event</th>
        <th class="tc">Time</th>
        <th>Comments</th>
      </tr></thead>
      <tbody>
        ${tableRows || '<tr><td colspan="3" class="empty">No entries recorded</td></tr>'}
      </tbody>
    </table>`
}

function exportPdf() {
  if (!validateForm()) return

  document.getElementById('pdf-print-overlay')?.remove()
  document.getElementById('pdf-print-style')?.remove()

  const styleEl = document.createElement('style')
  styleEl.id = 'pdf-print-style'
  styleEl.textContent = `
    @media print {
      body > *:not(#pdf-print-overlay) { display: none !important; }
      #pdf-print-overlay { display: block !important; position: static !important; }
      @page { margin: 0; }
    }
    #pdf-print-overlay {
      font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #1e293b;
      padding: .75in; box-sizing: border-box; background: white;
    }
    #pdf-print-overlay .org { font-size:9px; letter-spacing:.12em; text-transform:uppercase; color:#64748b; margin-bottom:3px; }
    #pdf-print-overlay .doc-title { font-size:20px; font-weight:700; color:#0f172a; border-bottom:2px solid #0f172a; padding-bottom:10px; margin-bottom:18px; }
    #pdf-print-overlay .meta { display:grid; grid-template-columns:1fr 1fr; gap:5px 28px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:12px 16px; margin-bottom:22px; }
    #pdf-print-overlay .mr { display:flex; align-items:baseline; gap:8px; }
    #pdf-print-overlay .mr.full { grid-column: 1 / -1; }
    #pdf-print-overlay .ml { font-size:9.5px; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:#64748b; white-space:nowrap; min-width:110px; }
    #pdf-print-overlay .mv { font-size:11px; color:#1e293b; }
    #pdf-print-overlay .sec { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.1em; color:#475569; border-bottom:1px solid #cbd5e1; padding-bottom:6px; margin-bottom:10px; }
    #pdf-print-overlay table { width:100%; border-collapse:collapse; }
    #pdf-print-overlay th { background:#f1f5f9; border:1px solid #cbd5e1; padding:7px 10px; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:#64748b; text-align:left; }
    #pdf-print-overlay td { border:1px solid #cbd5e1; padding:7px 10px; font-size:11px; vertical-align:top; }
    #pdf-print-overlay .ec { width:200px; }
    #pdf-print-overlay .tc { width:100px; }
    #pdf-print-overlay .empty { font-style:italic; color:#94a3b8; }`
  document.head.appendChild(styleEl)

  const overlay = document.createElement('div')
  overlay.id = 'pdf-print-overlay'
  overlay.style.display = 'none'
  overlay.innerHTML = buildPdfContent()
  document.body.appendChild(overlay)

  const studyId  = document.getElementById('study_id')?.value.trim() || 'unknown'
  const date     = fmtFilenameDate(document.getElementById('date')?.value)
  const filename = `${studyId}_${date}.pdf`

  const cleanup = () => {
    document.getElementById('pdf-print-overlay')?.remove()
    document.getElementById('pdf-print-style')?.remove()
  }

  if (window.electronAPI?.printToPDF) {
    window.electronAPI.printToPDF(filename).then(res => {
      cleanup()
      if (res?.success) showToast(`Exported ${filename}`)
      else showToast('Export cancelled', true)
    })
  } else {
    overlay.style.display = ''
    window.addEventListener('afterprint', cleanup, { once: true })
    setTimeout(cleanup, 60000)
    window.print()
    showToast(`Exporting ${filename}`)
  }
}
