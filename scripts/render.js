// ─────────────────────────────────────────────
//  SECTION BUILDER REGISTRY
//  Register new section types here — no other
//  file needs to change when adding a new type.
// ─────────────────────────────────────────────
const SECTION_BUILDERS = {
  calibration:  (...a) => buildCalibrationCard(...a),
  notes_table:  (...a) => buildNotesTableCard(...a),
  checklist:    (...a) => buildChecklistCard(...a),
  stages_table: (...a) => buildStagesTableCard(...a),
  fastrack:     (...a) => buildFastrackCard(...a),
  icp_table:    (...a) => buildIcpTableCard(...a),
}

// ─────────────────────────────────────────────
//  TEMPLATE SELECTOR
// ─────────────────────────────────────────────
function renderTemplateSelector() {
  const container = document.getElementById('template-selector')

  const compact = !!currentTemplate
  const section = document.getElementById('template-section')
  const label   = document.getElementById('template-section-label')
  if (section) section.className = compact ? 'shrink-0 mb-3' : 'shrink-0 mb-5'
  if (label)   label.className   = compact
    ? 'mono text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2'
    : 'mono text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4'

  container.innerHTML = Object.entries(TEMPLATES).map(([key, tmpl]) => {
    const isSelected = currentTemplate === key
    const cardClass  = isSelected
      ? `border-2 ${tmpl.style.card} shadow-md`
      : "border-2 border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"

    const indicator = isSelected
      ? `<span class="w-4 h-4 rounded-full ${tmpl.style.dot} flex items-center justify-center shrink-0">
           <svg class="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
           </svg>
         </span>`
      : `<span class="w-4 h-4 rounded-full border-2 border-slate-200 shrink-0"></span>`

    if (compact) {
      return `
        <button onclick="setTemplate('${key}')"
          class="template-card text-left rounded-lg px-3 py-2 flex items-center gap-2 transition-all duration-150 ${cardClass}">
          <span class="mono text-sm font-semibold ${isSelected ? tmpl.style.label : 'text-slate-600'}">
            ${tmpl.label}
          </span>
          ${indicator}
        </button>`
    }

    const labelSize = tmpl.label.length > 8 ? 'text-base' : tmpl.label.length > 5 ? 'text-xl' : 'text-3xl'
    return `
      <button onclick="setTemplate('${key}')"
        class="template-card text-left rounded-xl px-5 pt-4 pb-5 w-56 flex flex-col gap-2 transition-all duration-150 ${cardClass}">
        <div class="flex items-start justify-between gap-2">
          <span class="mono ${labelSize} font-bold leading-tight ${isSelected ? tmpl.style.label : 'text-slate-700'}">
            ${tmpl.label}
          </span>
          ${indicator}
        </div>
        <div>
          ${tmpl.fullLabel   ? `<p class="text-sm font-medium text-slate-600 leading-snug">${tmpl.fullLabel}</p>` : ''}
          ${tmpl.description ? `<p class="text-xs text-slate-400 mt-0.5 leading-snug">${tmpl.description}</p>`   : ''}
        </div>
      </button>`
  }).join('')
}

// ─────────────────────────────────────────────
//  RENDER FORM
// ─────────────────────────────────────────────
function renderForm() {
  if (!currentTemplate) return

  resetCalState()
  resetNotesState()
  resetIcpState()

  const tmpl     = TEMPLATES[currentTemplate]
  const sections = buildSections(tmpl)
  const panel    = document.getElementById('form-panel')

  panel.innerHTML = ''

  sections.forEach(section => {
    const card = document.createElement('div')
    card.className = 'bg-white border border-slate-200 rounded-xl overflow-hidden'
    card.dataset.sectionId = section.id

    const builder = SECTION_BUILDERS[section.type]
    if (section.repeatable) {
      card.innerHTML = buildRepeatableCard(section, tmpl)
    } else if (builder) {
      card.innerHTML = builder(section, tmpl)
    } else {
      card.innerHTML = `
        <div class="border-l-4 ${tmpl.style.section} px-5 pt-5 pb-5">
          <div class="flex items-center gap-2.5 mb-4">
            <span class="text-slate-400">${section.icon}</span>
            <h2 class="text-xs font-semibold text-slate-600 uppercase tracking-wider mono">
              ${section.title}
            </h2>
          </div>
          <div class="space-y-4">
            ${section.fields.map(f => buildField(f)).join('')}
          </div>
        </div>`
    }

    panel.appendChild(card)
  })

  // For cohort-gated templates: hide everything except session_record until cohort is chosen
  if (tmpl.cohortSectionMap) {
    document.querySelectorAll('#form-panel [data-section-id]').forEach(card => {
      if (card.dataset.sectionId !== 'session_record') card.style.display = 'none'
    })
  }

  const actions = document.createElement('div')
  actions.className = 'flex items-center justify-end gap-2 pt-1 pb-2'
  actions.innerHTML = `
    <button onclick="resetForm()"
      class="text-sm text-slate-400 hover:text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors">
      ↺ Reset
    </button>
    <button id="export-btn" onclick="onExportClick()"
      class="bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors">
      Export
    </button>`
  panel.appendChild(actions)

  const notesSect = sections.find(s => s.type === 'notes_table')
  if (notesSect) initNotesTable(notesSect)

  initTimePickers()
  onProbeTypeChange(document.getElementById('probe_type')?.value || '')
  initSelectStyles()
  refreshGainPickers()
  refreshLocationPickers()
}

// ─────────────────────────────────────────────
//  BUILD SECTIONS
// ─────────────────────────────────────────────
function buildSections(tmpl) {
  const base = tmpl.sharedSections
    ? SHARED_SECTIONS.filter(s => tmpl.sharedSections.includes(s.id))
    : [...SHARED_SECTIONS]
  tmpl.specificSections.forEach(specific => {
    if (specific.insertAfter) {
      const idx = base.findIndex(s => s.id === specific.insertAfter)
      if (idx !== -1) { base.splice(idx + 1, 0, specific); return }
    }
    base.push(specific)
  })
  return base
}

// ─────────────────────────────────────────────
//  FLATTEN FIELDS
// ─────────────────────────────────────────────
function flattenFields(fields) {
  return fields.flatMap(f => f.type === 'group' ? f.fields : [f])
}

// ─────────────────────────────────────────────
//  BUILD FIELD
// ─────────────────────────────────────────────
function buildField(field, { noLabel = false } = {}) {

  // ── Group ──
  if (field.type === 'group') {
    const requiredMark = field.required
      ? `<span class="text-red-400 ml-0.5">*</span>`
      : ''
    const groupLabel = field.label
      ? `<p class="text-xs font-semibold text-slate-500 mb-1.5 mono uppercase tracking-wide">${field.label}${requiredMark}</p>`
      : ''
    const childNoLabel = !field.labeled
    return `<div>
      ${groupLabel}
      <div class="grid grid-cols-${field.cols || 2} gap-3">
        ${field.fields.map(f => buildField(f, { noLabel: childNoLabel })).join('')}
      </div>
    </div>`
  }

  // ── Label ──
  const requiredMark = field.required
    ? `<span class="text-red-400 ml-0.5">*</span>`
    : ''
  const hintBadge = field.hint
    ? ` <span class="normal-case font-normal tracking-normal text-slate-400">(${field.hint})</span>`
    : ''
  const label = noLabel ? '' : `
    <label for="${field.id}"
      class="block text-xs font-semibold text-slate-500 mb-1.5 mono uppercase tracking-wide">
      ${field.label}${hintBadge}${requiredMark}
    </label>`

  const base = INP

  // ── Input ──
  let input
  if (field.type === 'select') {
    const rawList = field.optionsFrom
      ? (TEMPLATES[currentTemplate]?.[field.optionsFrom] || [])
      : field.options.slice(1)
    const placeholder = field.optionsFrom ? '-- Select --' : field.options[0]
    const opts = `<option value="">${placeholder}</option>` +
      rawList.map(o => `<option value="${o}" ${field.defaultValue === o ? 'selected' : ''}>${o}</option>`).join('')
    const otherId    = `${field.id}_other`
    const triggerVal = field.allowOther ? 'Other' : (field.revealOn || null)
    const handlers   = []
    if (triggerVal)     handlers.push(`toggleOtherInput(this, '${otherId}', '${triggerVal}')`)
    if (field.onChange) handlers.push(`${field.onChange}(this.value)`)
    handlers.push(`syncSelectStyle(this)`)
    const onChange   = `onchange="${handlers.join('; ')}"`
    const extraInput = triggerVal
      ? (field.revealRows
          ? `<textarea id="${otherId}" rows="${field.revealRows}" placeholder="${field.revealPlaceholder || 'Please specify...'}"
               class="${base} mt-2 hidden resize-none"></textarea>`
          : `<input type="text" id="${otherId}" placeholder="${field.revealPlaceholder || 'Please specify...'}"
               class="${base} mt-2 hidden" />`)
      : ''
    input = `<select id="${field.id}" class="${base} select-placeholder" ${field.required ? 'required' : ''} ${onChange}>${opts}</select>${extraInput}`
  } else if (field.type === 'textarea') {
    input = `<textarea id="${field.id}" rows="${field.rows || 3}" placeholder="${field.placeholder || ''}"
               class="${base} resize-none" ${field.required ? 'required' : ''}></textarea>`
  } else if (field.type === 'date') {
    input = `<input type="text" id="${field.id}" data-timepicker="date"
               class="${base} cursor-pointer" ${field.required ? 'required' : ''}
               placeholder="DD-MM-YYYY" />`
  } else if (field.type === 'time') {
    input = `<input type="text" id="${field.id}" data-timepicker="time"
               class="${base} cursor-pointer" ${field.required ? 'required' : ''}
               placeholder="HH:MM:SS" />`
  } else if (field.type === 'datetime') {
    input = `<input type="text" id="${field.id}" data-timepicker="datetime"
               class="${base} cursor-pointer" ${field.required ? 'required' : ''}
               placeholder="DD-MM-YYYY HH:MM:SS" />`
  } else if (field.type === 'power_measurement') {
    const sm = "text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 placeholder-slate-300 w-24"
    input = `<div class="flex items-center gap-2">
      <input type="text" id="${field.id}_value"   placeholder="0.000" class="${sm}" />
      <span class="text-sm text-slate-400 whitespace-nowrap">mW @</span>
      <input type="text" id="${field.id}_current" placeholder="0.000" class="${sm}" />
      <span class="text-sm text-slate-400">A</span>
    </div>`
  } else if (field.type === 'multiselect') {
    const labelId = `${field.id}_label`
    const dropId  = `${field.id}_dropdown`
    const boxes = field.options.map(opt => {
      const optId = `${field.id}_${opt.replace(/\s+/g, '_').toLowerCase()}`
      return `<label class="flex items-center gap-2.5 text-sm text-slate-600 cursor-pointer px-2 py-1.5 hover:bg-slate-50 rounded-lg select-none">
        <input type="checkbox" id="${optId}" value="${opt}"
          onchange="updateMultiselectLabel('${field.id}')"
          class="w-4 h-4 rounded border-slate-300 cursor-pointer accent-slate-800" />
        ${opt}
      </label>`
    }).join('')
    input = `<div class="relative" id="${field.id}_wrap" data-multiselect>
      <button type="button" onclick="toggleMultiselect('${field.id}')"
        class="${base} flex items-center justify-between text-left">
        <span id="${labelId}" class="text-slate-300 truncate">-- Select --</span>
        <svg class="w-4 h-4 text-slate-400 shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
        </svg>
      </button>
      <div id="${dropId}" data-ms-dropdown class="hidden absolute z-20 top-full mt-1 left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg p-1.5 space-y-0.5">
        ${boxes}
      </div>
    </div>`
  } else if (field.type === 'distances') {
    const ro   = field.readonly
    const cell = `w-full text-sm text-center border border-slate-200 rounded-lg px-2 py-2.5 placeholder-slate-300 ${ro ? 'bg-slate-100 text-slate-500 cursor-default' : 'bg-slate-50 text-slate-800'}`
    const inputs = Array.from({ length: field.count }, (_, i) =>
      `<input type="text" id="${field.id}_${i}" placeholder="—" class="${cell}" ${ro ? 'readonly' : ''} />`
    ).join('')
    input = `<div class="grid grid-cols-${field.count} gap-2">${inputs}</div>`
  } else {
    const upperAttr = field.forceUpperCase ? `oninput="this.value=this.value.toUpperCase()"` : ''
    input = `<input type="${field.type}" id="${field.id}"
               value="${field.defaultValue || ''}"
               placeholder="${field.placeholder || ''}"
               class="${base}" ${field.required ? 'required' : ''} ${upperAttr} />`
  }

  return `<div data-field="${field.id}">${label}${input}</div>`
}

// ─────────────────────────────────────────────
//  REPEATABLE SECTION
// ─────────────────────────────────────────────
function buildRepeatableCard(section, tmpl) {
  repeatableState[section.id] = repeatableState[section.id] || 1
  const rowCount = repeatableState[section.id]
  const base     = INP

  const colHeaders = `
    <div class="grid grid-cols-${section.rowFields.length} gap-2 mb-1.5">
      ${section.rowFields.map(f =>
        `<p class="text-xs font-semibold text-slate-400 mono uppercase tracking-wide">${f.label}</p>`
      ).join('')}
    </div>`

  const rows = Array.from({ length: rowCount }, (_, i) =>
    buildRepeatableRow(section, i, base)
  ).join('')

  return `
    <div class="border-l-4 ${tmpl.style.section} px-5 pt-5 pb-5">
      <div class="flex items-center gap-2.5 mb-4">
        <span class="text-slate-400">${section.icon}</span>
        <h2 class="text-xs font-semibold text-slate-600 uppercase tracking-wider mono">${section.title}</h2>
      </div>
      ${colHeaders}
      <div id="${section.id}_rows" class="space-y-2">
        ${rows}
      </div>
      <button onclick="addRepeatableRow('${section.id}')"
        class="mt-3 flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/>
        </svg>
        Add row
      </button>
    </div>`
}

function buildRepeatableRow(section, rowIndex, base) {
  base = base || INP
  const inputs = section.rowFields.map(f => {
    const id = `${section.id}_${f.id}_${rowIndex}`
    return `<input type="text" id="${id}" placeholder="${f.placeholder || ''}" class="${base}" />`
  }).join('')
  return `<div class="grid grid-cols-${section.rowFields.length} gap-2">${inputs}</div>`
}

function addRepeatableRow(sectionId) {
  const tmpl     = TEMPLATES[currentTemplate]
  const sections = buildSections(tmpl)
  const section  = sections.find(s => s.id === sectionId)
  if (!section) return

  repeatableState[sectionId] = (repeatableState[sectionId] || 1) + 1
  const rowIndex  = repeatableState[sectionId] - 1
  const container = document.getElementById(`${sectionId}_rows`)
  if (container) container.insertAdjacentHTML('beforeend', buildRepeatableRow(section, rowIndex))
}

// ─────────────────────────────────────────────
//  SELECT PLACEHOLDER STYLE
// ─────────────────────────────────────────────
function syncSelectStyle(sel) {
  sel.classList.toggle('select-placeholder', sel.value === '')
}

function initSelectStyles() {
  document.querySelectorAll('#form-panel select').forEach(syncSelectStyle)
}

// ─────────────────────────────────────────────
//  TOGGLE "OTHER" INPUT
// ─────────────────────────────────────────────
function toggleOtherInput(select, otherId, triggerValue = 'Other') {
  const other = document.getElementById(otherId)
  if (!other) return
  if (select.value === triggerValue) {
    other.classList.remove('hidden')
    other.focus()
  } else {
    other.classList.add('hidden')
    other.value = ''
    other.classList.remove('field-error')
  }
}

// ─────────────────────────────────────────────
//  TIME PICKERS (Flatpickr)
// ─────────────────────────────────────────────
function initTimePickers() {
  document.querySelectorAll('[data-timepicker]').forEach(el => {
    if (el._flatpickr) el._flatpickr.destroy()
    const type       = el.dataset.timepicker
    const isDatetime = type === 'datetime'
    const isTime     = type === 'time'
    const isDate     = type === 'date'
    const opts = {
      enableTime:    isDatetime || isTime,
      noCalendar:    isTime,
      dateFormat:    isDatetime ? 'd-m-Y H:i:S' : (isDate ? 'd-m-Y' : 'H:i:S'),
      time_24hr:     true,
      enableSeconds: isDatetime || isTime,
      allowInput:    false,
    }
    if (el.id === 'meas_start') {
      opts.onClose = ([date]) => {
        const endPicker = document.getElementById('meas_end')?._flatpickr
        if (endPicker) endPicker.set('minDate', date || null)
      }
    }
    if (el.id === 'tiepie_start') {
      opts.onClose = ([date]) => {
        const endPicker = document.getElementById('tiepie_end')?._flatpickr
        if (endPicker) endPicker.set('minDate', date || null)
      }
    }
    flatpickr(el, opts)
  })
}
