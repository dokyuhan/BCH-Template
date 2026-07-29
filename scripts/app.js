// ─────────────────────────────────────────────
//  SNAPSHOT  (save / restore per-template state)
// ─────────────────────────────────────────────
function captureFormSnapshot(key) {
  if (!key) return
  const inputs = {}
  const checks = []
  document.querySelectorAll('#form-panel input, #form-panel select, #form-panel textarea').forEach(el => {
    if (el.id) inputs[el.id] = el.value
    if (el.type === 'checkbox') checks.push({ id: el.id, checked: el.checked })
  })
  formSnapshots[key] = { inputs, checks, calState: JSON.parse(JSON.stringify(calState)) }
}

function restoreFormSnapshot(key) {
  const snap = formSnapshots[key]
  if (!snap) return

  restoringSnapshot = true

  Object.assign(calState, JSON.parse(JSON.stringify(snap.calState)))

  calState.gains.forEach((idx, pos) => {
    if (pos === 0) return
    document.getElementById('cal_gain_rows')?.insertAdjacentHTML('beforeend', buildGainRow(idx))
  })
  refreshGainLabels()

  snap.checks.forEach(({ id, checked }) => {
    const el = document.getElementById(id)
    if (el) el.checked = checked
  })
  updateMultiselectLabel('locations')

  renderCalRows()

  snap.checks.forEach(({ id, checked }) => {
    const el = document.getElementById(id)
    if (el) el.checked = checked
  })

  Object.entries(snap.inputs).forEach(([id, val]) => {
    if (!val) return
    const el = document.getElementById(id)
    if (!el) return
    if (el._flatpickr) el._flatpickr.setDate(val, false)
    else el.value = val
  })

  document.querySelectorAll('#form-panel select').forEach(sel => {
    sel.dispatchEvent(new Event('change'))
  })
  initSelectStyles()

  calState.gains.forEach(gainIdx => {
    Object.values(calState.blocks[gainIdx] || {}).flat().forEach(idx => {
      updateMultiselectLabel(`cal_block_${idx}_ch`)
      const allChecked = ['a','b','c','d'].every(ch => document.getElementById(`cal_block_${idx}_ch_${ch}`)?.checked)
      const allEl = document.getElementById(`cal_block_${idx}_ch_all`)
      if (allEl) allEl.checked = allChecked
    })
  })

  Object.values(calState.locs).forEach(({ measIdxs }) => {
    measIdxs.forEach(idx => {
      const gainEl = document.getElementById(`cal_meas_${idx}_gain`)
      if (gainEl?.value) onMeasGainChange(idx, gainEl.value)
    })
  })

  const roomEl      = document.getElementById('room')
  const roomAvailEl = document.getElementById('room_available')
  if (roomEl && roomAvailEl) {
    roomEl.disabled      = !roomAvailEl.checked
    roomEl.style.opacity = roomAvailEl.checked ? '' : '0.5'
  }

  document.querySelectorAll('[data-gated-by]').forEach(el => {
    const gate = document.getElementById(el.dataset.gatedBy)
    if (!gate) return
    const enabled = el.dataset.gateInvert === 'true' ? !gate.checked : gate.checked
    el.disabled      = !enabled
    el.style.opacity = enabled ? '' : '0.5'
    if (el.tagName === 'SELECT') {
      const naOpt        = el.querySelector('option[value="N/A"]')
      const restoredValue = el.value
      if (enabled) {
        naOpt?.remove()
      } else if (!naOpt) {
        el.insertAdjacentHTML('beforeend', '<option value="N/A">N/A</option>')
      }
      el.value = restoredValue
      syncSelectStyle(el)
    }
  })

  restoringSnapshot = false
}

// ─────────────────────────────────────────────
//  SET TEMPLATE
// ─────────────────────────────────────────────
function setTemplate(key) {
  captureFormSnapshot(currentTemplate)
  currentTemplate = key
  renderTemplateSelector()
  renderForm()
  restoreFormSnapshot(key)
  document.getElementById('form-divider').classList.remove('hidden')
  document.getElementById('empty-state').classList.add('hidden')
  document.getElementById('form-layout').classList.remove('hidden')
  document.title = `${TEMPLATES[key].label} — BCH Template`
}

// ─────────────────────────────────────────────
//  VALIDATION
// ─────────────────────────────────────────────
function validateForm() {
  document.querySelectorAll('.field-error').forEach(el => el.classList.remove('field-error'))
  if (!currentTemplate) return false

  const tmpl     = TEMPLATES[currentTemplate]
  const sections = buildSections(tmpl)
  let   valid    = true

  sections.forEach(section => {
    if (!isSectionVisible(section.id)) return
    if (section.repeatable) return

    if (section.type === 'calibration') {
      calState.gains.forEach(idx => {
        [0,1,2,3].forEach(v => {
          const el = document.getElementById(`cal_gain_${idx}_${v}`)
          if (el && !el.value.trim()) { el.classList.add('field-error'); valid = false }
        })
      })
      Object.values(calState.locs).forEach(({ measIdxs }) => {
        measIdxs.forEach(idx => {
          const el = document.getElementById(`cal_meas_${idx}_gain`)
          if (el && !el.value) { el.classList.add('field-error'); valid = false }
        })
      })
      calState.gains.forEach(gainIdx => {
        Object.values(calState.blocks[gainIdx] || {}).flat().forEach(idx => {
          const hasChannel = ['a','b','c','d'].some(ch =>
            document.getElementById(`cal_block_${idx}_ch_${ch}`)?.checked
          )
          if (!hasChannel) {
            document.getElementById(`cal_block_${idx}_ch_wrap`)
              ?.querySelector('button')?.classList.add('field-error')
            valid = false
          }
        })
      })
      return
    }

    if (!section.fields) return

    flattenFields(section.fields).forEach(field => {
      if (!field.required) return
      const el = document.getElementById(field.id)
      if (!el) return
      if (el.disabled) return
      const isEmpty = !el.value.trim() || (el.tagName === 'SELECT' && el.value === '')
      if (isEmpty) {
        el.classList.add('field-error')
        valid = false
        return
      }
      if (el.value === 'Other' && field.allowOther) {
        const otherEl = document.getElementById(field.id + '_other')
        if (otherEl && !otherEl.value.trim()) {
          otherEl.classList.add('field-error')
          valid = false
        }
      }
    })
  })

  if (!valid) showToast('Please fill all required fields', true)
  return valid
}

// ─────────────────────────────────────────────
//  RESET
// ─────────────────────────────────────────────
function resetForm() {
  if (!currentTemplate) return
  delete formSnapshots[currentTemplate]
  Object.keys(repeatableState).forEach(k => { repeatableState[k] = 1 })
  renderForm()
}

// ─────────────────────────────────────────────
//  COHORT → SECTION VISIBILITY
// ─────────────────────────────────────────────
function isSectionVisible(sectionId) {
  const card = document.querySelector(`#form-panel [data-section-id="${sectionId}"]`)
  return !card || card.style.display !== 'none'
}

function onCohortChange(value) {
  const tmpl = TEMPLATES[currentTemplate]
  if (!tmpl?.cohortSectionMap) return

  const visibleIds = value
    ? (tmpl.cohortSectionMap[value] || ['session_record'])
    : ['session_record']

  document.querySelectorAll('#form-panel [data-section-id]').forEach(card => {
    card.style.display = visibleIds.includes(card.dataset.sectionId) ? '' : 'none'
  })

  document.querySelectorAll('#form-panel [data-cohort-only]').forEach(el => {
    el.style.display = el.dataset.cohortOnly === value ? '' : 'none'
  })

  const isPdf = visibleIds.some(id => {
    const allSects = buildSections(tmpl)
    return allSects.find(s => s.id === id)?.type === 'notes_table'
  })
  const exportBtn = document.getElementById('export-btn')
  if (exportBtn) {
    exportBtn.textContent = isPdf ? 'Export PDF' : 'Export'
    exportBtn.className = isPdf
      ? 'bg-sky-700 hover:bg-sky-600 active:bg-sky-800 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors'
      : 'bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors'
  }
}

function onExportClick() {
  const tmpl   = TEMPLATES[currentTemplate]
  const cohort = document.getElementById('cohort')?.value
  const sectionIds = tmpl?.cohortSectionMap?.[cohort] || []
  const isPdf = sectionIds.some(id => buildSections(tmpl).find(s => s.id === id)?.type === 'notes_table')
  if (isPdf) exportPdf()
  else exportAll()
}

// ─────────────────────────────────────────────
//  ROOM AVAILABILITY TOGGLE
// ─────────────────────────────────────────────
function onRoomAvailableChange(checkbox) {
  const roomEl = document.getElementById('room')
  if (!roomEl) return
  if (checkbox.checked) {
    roomEl.disabled      = false
    roomEl.style.opacity = ''
    roomEl.value         = ''
  } else {
    roomEl.disabled      = true
    roomEl.style.opacity = '0.5'
    roomEl.value         = 'N/A'
  }
}

// ─────────────────────────────────────────────
//  GENERIC CHECKBOX-GATED FIELDS (e.g. Hair)
// ─────────────────────────────────────────────
function onGateToggleChange(checkbox) {
  document.querySelectorAll(`[data-gated-by="${checkbox.id}"]`).forEach(el => {
    const enabled = el.dataset.gateInvert === 'true' ? !checkbox.checked : checkbox.checked
    el.disabled      = !enabled
    el.style.opacity = enabled ? '' : '0.5'
    if (el.tagName === 'SELECT') {
      let naOpt = el.querySelector('option[value="N/A"]')
      if (enabled) {
        naOpt?.remove()
        el.value = ''
      } else {
        if (!naOpt) el.insertAdjacentHTML('beforeend', '<option value="N/A">N/A</option>')
        el.value = 'N/A'
      }
      syncSelectStyle(el)
    } else {
      el.value = enabled ? '' : 'N/A'
    }
  })
}

// ─────────────────────────────────────────────
//  BUILDING → ROOM (MegLAB has no room; force N/A)
// ─────────────────────────────────────────────
function onBuildingChange(value) {
  const roomAvailEl = document.getElementById('room_available')
  if (!roomAvailEl) return
  const isMegLab = value === 'MegLAB'

  if (isMegLab) {
    roomAvailEl.checked  = false
    roomAvailEl.disabled = true
    onRoomAvailableChange(roomAvailEl)
  } else if (roomAvailEl.disabled) {
    roomAvailEl.disabled = false
  }
}

// ─────────────────────────────────────────────
//  PROBE TYPE → AUTO-FILL DISTANCES + DEFAULTS
// ─────────────────────────────────────────────
function onProbeTypeChange(value) {
  const distances = PROBE_DISTANCES[value]
  if (distances) {
    distances.nirs.forEach((v, i) => {
      const el = document.getElementById(`nirs_distances_${i}`)
      if (el) el.value = v
    })
    distances.dcs.forEach((v, i) => {
      const el = document.getElementById(`dcs_distances_${i}`)
      if (el) el.value = v
    })
  }

  const isNICU   = value === 'NICUCM1'
  const ventWrap = document.querySelector('[data-field="vent"]')
  if (ventWrap) {
    ventWrap.style.opacity       = isNICU ? '' : '0.4'
    ventWrap.style.pointerEvents = isNICU ? '' : 'none'
    if (!isNICU) {
      const ventEl = document.getElementById('vent')
      if (ventEl) { ventEl.value = ''; syncSelectStyle(ventEl) }
      const ventOther = document.getElementById('vent_other')
      if (ventOther) { ventOther.classList.add('hidden'); ventOther.value = '' }
    }
  }

  const isNB5           = value === 'NB5'
  const tiepieStartWrap = document.querySelector('[data-field="tiepie_start"]')
  const tiepieEndWrap   = document.querySelector('[data-field="tiepie_end"]')
  ;[tiepieStartWrap, tiepieEndWrap].forEach(wrap => {
    if (!wrap) return
    wrap.style.opacity       = isNB5 ? '0.4' : ''
    wrap.style.pointerEvents = isNB5 ? 'none'  : ''
  })
  if (isNB5) {
    document.getElementById('tiepie_start')?._flatpickr?.clear()
    document.getElementById('tiepie_end')?._flatpickr?.clear()
  }

  // Tegaderm defaults: NB5 → False / No Tegaderm; all other probes → True / Tegaderm
  if (!restoringSnapshot && value) {
    const tegadermEl = document.getElementById('tegaderm')
    const devDefault = isNB5 ? 'False' : 'True'
    const blkDefault = isNB5 ? 'No Tegaderm' : 'Tegaderm'
    if (tegadermEl) { tegadermEl.value = devDefault; syncSelectStyle(tegadermEl) }
    calBlockTegadermDefault = blkDefault
    document.querySelectorAll('[id$="_tegaderm"]').forEach(el => {
      if (el.id !== 'tegaderm') { el.value = blkDefault; syncSelectStyle(el) }
    })
  }
}

// ─────────────────────────────────────────────
//  MULTI-SELECT DROPDOWN
// ─────────────────────────────────────────────
function toggleMultiselect(id) {
  document.getElementById(`${id}_dropdown`).classList.toggle('hidden')
}

function updateMultiselectLabel(id) {
  const checked = document.querySelectorAll(`#${id}_dropdown input:checked`)
  const label   = document.getElementById(`${id}_label`)
  if (!label) return
  const values = Array.from(checked).map(c => c.value).filter(v => v !== 'All')
  if (values.length === 0) {
    label.textContent = '-- Select --'
    label.style.color = ''
  } else {
    label.textContent = values.join(', ')
    label.style.color = '#1e293b'
  }
  if (id === 'locations') refreshLocationPickers()
}

document.addEventListener('click', e => {
  document.querySelectorAll('[data-multiselect]').forEach(wrap => {
    if (!wrap.contains(e.target)) {
      wrap.querySelector('[data-ms-dropdown]')?.classList.add('hidden')
    }
  })
})

// ─────────────────────────────────────────────
//  KEYBOARD SHORTCUTS
// ─────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault()
    onExportClick()
  }
})

// ─────────────────────────────────────────────
//  INIT
// ─────────────────────────────────────────────
renderTemplateSelector()
