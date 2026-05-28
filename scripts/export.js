// ─────────────────────────────────────────────
//  FIELD VALUE HELPERS
// ─────────────────────────────────────────────
function getFieldExportValue(field) {
  if (field.type === 'date') {
    return toIsoDate(document.getElementById(field.id)?.value.trim()) || '—'
  }
  if (field.type === 'datetime') {
    const raw = document.getElementById(field.id)?.value.trim()
    if (!raw) return '—'
    const utc = toUtcDateTime(raw)
    const et  = toIsoDateTime(raw)
    return utc ? `${utc} UTC  (ET: ${et})` : (et || '—')
  }
  if (field.type === 'power_measurement') {
    const val = document.getElementById(`${field.id}_value`)?.value.trim()
    const cur = document.getElementById(`${field.id}_current`)?.value.trim()
    if (!val && !cur) return '—'
    return `${val || '—'} mW @ ${cur || '—'} A`
  }
  if (field.type === 'distances') {
    const vals = Array.from({ length: field.count }, (_, i) =>
      document.getElementById(`${field.id}_${i}`)?.value.trim() || '—'
    )
    return vals.join(', ')
  }
  if (field.type === 'multiselect') {
    const checked = field.options.filter(opt => {
      const optId = `${field.id}_${opt.replace(/\s+/g, '_').toLowerCase()}`
      return document.getElementById(optId)?.checked
    })
    return checked.length ? checked.join(', ') : '—'
  }
  const el  = document.getElementById(field.id)
  let   val = el ? el.value.trim() : ''
  const triggerVal = field.allowOther ? 'Other' : (field.revealOn || null)
  if (triggerVal && val === triggerVal) {
    const custom = document.getElementById(`${field.id}_other`)?.value.trim()
    val = custom ? `${triggerVal} (${custom})` : triggerVal
  }
  return val || '—'
}

function getFieldJsonValue(field) {
  if (field.type === 'power_measurement') {
    const raw_v = document.getElementById(`${field.id}_value`)?.value.trim()   || ''
    const raw_c = document.getElementById(`${field.id}_current`)?.value.trim() || ''
    return {
      value_mw:  parseFloatOrNull(raw_v),
      current_a: parseFloatOrNull(raw_c),
    }
  }
  if (field.type === 'distances') {
    return Array.from({ length: field.count }, (_, i) =>
      parseFloatOrNull(document.getElementById(`${field.id}_${i}`)?.value.trim())
    )
  }
  if (field.type === 'multiselect') {
    return field.options.filter(opt =>
      document.getElementById(`${field.id}_${opt.replace(/\s+/g, '_').toLowerCase()}`)?.checked
    )
  }
  if (field.type === 'textarea') {
    return document.getElementById(field.id)?.value.trim() || null
  }
  if (field.type === 'date') {
    return toIsoDate(document.getElementById(field.id)?.value.trim())
  }
  if (field.type === 'datetime') {
    return toUtcDateTime(document.getElementById(field.id)?.value.trim())
  }
  const el  = document.getElementById(field.id)
  let   val = el ? el.value.trim() : null
  const triggerVal = field.allowOther ? 'Other' : (field.revealOn || null)
  if (triggerVal && val === triggerVal) {
    const custom = document.getElementById(`${field.id}_other`)?.value.trim()
    if (custom) val = custom
  }
  return val || null
}

// ─────────────────────────────────────────────
//  EXPORT TO .TXT
// ─────────────────────────────────────────────
function exportTxt(silent = false) {
  if (!silent) {
    if (!currentTemplate) { showToast('Select a template first', true); return }
    if (!validateForm()) return
  }

  const tmpl     = TEMPLATES[currentTemplate]
  const sections = buildSections(tmpl)

  const lines = [
    'DATA ACQUISITION LOG',
    '='.repeat(40),
    `Template  : ${tmpl.label}`,
    '',
  ]

  sections.forEach(section => {
    if (!isSectionVisible(section.id)) return
    lines.push(section.title.toUpperCase())
    lines.push('-'.repeat(40))

    if (section.repeatable) {
      const rowCount = repeatableState[section.id] || 1
      for (let i = 0; i < rowCount; i++) {
        section.rowFields.forEach(f => {
          const el  = document.getElementById(`${section.id}_${f.id}_${i}`)
          const val = el ? el.value.trim() : ''
          lines.push(`${`${f.label} (${i + 1})`.padEnd(26, ' ')}: ${val || '—'}`)
        })
      }
    } else if (section.type === 'notes_table') {
      notesTableState.rows.forEach((idx, i) => {
        const evtSel = document.getElementById(`notes_evt_${idx}`)
        const evtTxt = document.getElementById(`notes_evt_text_${idx}`)
        const evt    = evtSel?.value === '__other__' ? (evtTxt?.value.trim() || 'Other') : (evtSel?.value || '—')
        const time   = document.getElementById(`notes_time_${idx}`)?.value || '—'
        const cmts   = document.getElementById(`notes_cmts_${idx}`)?.value.trim() || '—'
        lines.push(`${String(i + 1).padEnd(4)}${evt.padEnd(32)}${time.padEnd(10)}${cmts}`)
      })
    } else if (section.type === 'checklist') {
      section.items.forEach(item => {
        const done = document.getElementById(`${section.id}_${item.id}`)?.checked
        lines.push(`${item.label.padEnd(26, ' ')}: ${done ? 'Done' : '—'}`)
      })
    } else if (section.type === 'stages_table') {
      const timeRows  = section.rows.filter(r => r.type === 'time_range')
      const breathRows = section.rows.filter(r => r.type === 'breathing')
      if (timeRows.length) {
        lines.push(`${'Stage'.padEnd(24)}${'Start'.padEnd(12)}${'End'.padEnd(12)}Comment`)
        timeRows.forEach(row => {
          const start   = document.getElementById(`${section.id}_${row.id}_start`)?.value.trim()   || '—'
          const end     = document.getElementById(`${section.id}_${row.id}_end`)?.value.trim()     || '—'
          const comment = document.getElementById(`${section.id}_${row.id}_comment`)?.value.trim() || '—'
          lines.push(`${row.label.padEnd(24)}${start.padEnd(12)}${end.padEnd(12)}${comment}`)
        })
      }
      if (breathRows.length) {
        if (timeRows.length) lines.push('')
        lines.push(`${'Stage'.padEnd(24)}${'Duration'.padEnd(12)}${'Rec.Done'.padEnd(12)}Comment`)
        breathRows.forEach(row => {
          const dur     = document.getElementById(`${section.id}_${row.id}_duration`)?.value.trim() || '—'
          const rec     = document.getElementById(`${section.id}_${row.id}_rec_done`)?.checked
          const comment = document.getElementById(`${section.id}_${row.id}_comment`)?.value.trim()  || '—'
          lines.push(`${row.label.padEnd(24)}${dur.padEnd(12)}${(rec ? 'Done' : '—').padEnd(12)}${comment}`)
        })
      }
    } else if (section.type === 'icp_table') {
      const interval = document.getElementById('icp_interval')?.value.trim()
      if (interval) lines.push(`Interval: ${interval} sec`)

      const icpVentLine = (type, g, vr) => {
        const label = vr.side === 'right' ? 'Right Ventricle' : 'Left Ventricle'
        const s = document.getElementById(`icp_${type}_${g.gIdx}_vent_${vr.rIdx}_start`)?.value.trim() || '—'
        const e = document.getElementById(`icp_${type}_${g.gIdx}_vent_${vr.rIdx}_end`)?.value.trim()   || '—'
        const b = document.getElementById(`icp_${type}_${g.gIdx}_vent_${vr.rIdx}_bp`)?.value.trim()    || '—'
        lines.push(`  ${label.padEnd(24)}${s.padEnd(12)}${e.padEnd(12)}${b}`)
      }

      if (icpState.measRows.length) {
        lines.push('')
        lines.push('START OF MEASUREMENT')
        lines.push(`${'Baseline'.padEnd(26)}${'Start'.padEnd(12)}${'End'.padEnd(12)}BP`)
        icpState.measRows.forEach(r => {
          const start = document.getElementById(`icp_meas_${r.idx}_start`)?.value.trim() || '—'
          const end   = document.getElementById(`icp_meas_${r.idx}_end`)?.value.trim()   || '—'
          const bp    = document.getElementById(`icp_meas_${r.idx}_bp`)?.value.trim()    || '—'
          lines.push(`${r.label.padEnd(26)}${start.padEnd(12)}${end.padEnd(12)}${bp}`)
        })
      }
      if (icpState.etvGroups.length) {
        lines.push('')
        lines.push('AFTER ETV')
        icpState.etvGroups.forEach(g => {
          lines.push(g.label)
          g.ventRows.forEach(vr => icpVentLine('etv', g, vr))
        })
      }
      if (icpState.cpcGroups.length) {
        lines.push('')
        lines.push('AFTER CPC')
        icpState.cpcGroups.forEach(g => {
          lines.push(g.label)
          g.ventRows.forEach(vr => icpVentLine('cpc', g, vr))
        })
      }
      if (icpState.notes.length) {
        lines.push('')
        lines.push('NOTES')
        lines.push(`${'Time'.padEnd(14)}Comment`)
        icpState.notes.forEach(idx => {
          const time    = document.getElementById(`icp_note_${idx}_time`)?.value.trim()    || '—'
          const comment = document.getElementById(`icp_note_${idx}_comment`)?.value.trim() || '—'
          lines.push(`${time.padEnd(14)}${comment}`)
        })
      }
    } else if (section.type === 'fastrack') {
      section.checkItems.forEach(item => {
        const done = document.getElementById(`${section.id}_${item.id}`)?.checked
        lines.push(`${item.label.padEnd(26, ' ')}: ${done ? 'Done' : '—'}`)
      })
      lines.push('')
      section.ranges.forEach(range => {
        const initial = document.getElementById(`${section.id}_${range.id}_initial`)?.value.trim() || '—'
        const final_  = document.getElementById(`${section.id}_${range.id}_final`)?.value.trim()   || '—'
        lines.push(`${range.label.padEnd(32, ' ')}${initial.padStart(8)}   —   ${final_}`)
      })
    } else if (section.type === 'calibration') {
      calState.gains.forEach((gainIdx, pos) => {
        const vals = [0,1,2,3].map(v =>
          document.getElementById(`cal_gain_${gainIdx}_${v}`)?.value.trim() || '—'
        )
        lines.push(`${'Gain ' + (pos + 1)}`.padEnd(26, ' ') + `: ${vals.join(', ')}`)
      })
      lines.push('')
      Object.entries(calState.locs).forEach(([patLoc, { measIdxs }], gi) => {
        if (gi > 0) lines.push('')
        lines.push(`${patLoc}:`)
        measIdxs.forEach((idx, posInLoc) => {
          const gainVal  = document.getElementById(`cal_meas_${idx}_gain`)?.value
          const gainPos  = gainVal ? calState.gains.indexOf(parseInt(gainVal)) : -1
          const gainVals = gainPos >= 0
            ? [0,1,2,3].map(v => document.getElementById(`cal_gain_${calState.gains[gainPos]}_${v}`)?.value.trim() || '—').join(', ')
            : '—'
          const note   = document.getElementById(`cal_meas_${idx}_note`)?.value.trim() || ''
          const sLabel = gainPos >= 0 ? `S${gainPos + 1}` : 'S?'
          lines.push(`  ${sLabel}) ${patLoc}_${posInLoc + 1} - (${gainVals})${note ? ` [${note}]` : ''}`)
        })
      })
      lines.push('')
      let firstGain = true
      calState.gains.forEach((gainIdx, gainPos) => {
        const gainBlocks = calState.blocks[gainIdx] || {}
        if (!Object.keys(gainBlocks).length) return
        if (!firstGain) lines.push('')
        firstGain = false
        const gainVals = [0,1,2,3].map(v =>
          document.getElementById(`cal_gain_${gainIdx}_${v}`)?.value.trim() || '—'
        ).join(', ')
        lines.push(`S${gainPos + 1} (Gain ${gainPos + 1}) — (${gainVals}):`)
        Object.entries(gainBlocks).forEach(([calLoc, indices], ci) => {
          if (ci > 0) lines.push('')
          lines.push(`  ${calLoc}:`)
          indices.forEach((idx, posInLoc) => {
            const shape    = document.getElementById(`cal_block_${idx}_shape`)?.value    || '—'
            const tegaderm = document.getElementById(`cal_block_${idx}_tegaderm`)?.value || ''
            const filter   = document.getElementById(`cal_block_${idx}_filter`)?.value   || '—'
            const channels = ['A','B','C','D']
              .filter(ch => document.getElementById(`cal_block_${idx}_ch_${ch.toLowerCase()}`)?.checked)
              .join(', ')
            const note  = document.getElementById(`cal_block_${idx}_note`)?.value.trim() || ''
            const tgStr = tegaderm === 'Tegaderm' ? ', Tegaderm' : ''
            lines.push(`    ${calLoc}_${posInLoc + 1} - ${shape}${tgStr}, ${filter} ND, Ch: ${channels || '—'}${note ? ` [${note}]` : ''}`)
          })
        })
      })
    } else {
      flattenFields(section.fields).forEach(field => {
        if (field.type === 'textarea') {
          const raw = document.getElementById(field.id)?.value || ''
          const tLines = raw.trim() ? raw.split('\n') : ['—']
          tLines.forEach((l, i) => {
            lines.push(i === 0 ? `${field.label.padEnd(26, ' ')}: ${l}` : ' '.repeat(28) + l)
          })
        } else if (field.revealOn && !field.allowOther) {
          const val = document.getElementById(field.id)?.value.trim() || ''
          lines.push(`${field.label.padEnd(26, ' ')}: ${val || '—'}`)
          if (val === field.revealOn) {
            const notes = document.getElementById(`${field.id}_other`)?.value.trim()
            if (notes) lines.push(`${notes}`)
          }
        } else {
          lines.push(`${field.label.padEnd(26, ' ')}: ${getFieldExportValue(field)}`)
        }
      })
    }

    lines.push('')
  })

  lines.push('='.repeat(40))
  lines.push('END OF LOG')

  const studyId  = document.getElementById('study_id')?.value.trim() || 'unknown'
  const date     = fmtFilenameDate(document.getElementById('date')?.value)
  const filename = `${studyId}_${date}.txt`

  triggerDownload(new Blob([lines.join('\n')], { type: 'text/plain' }), filename)
  if (!silent) showToast(`Exported ${filename}`)
}

// ─────────────────────────────────────────────
//  EXPORT TO .JSON
// ─────────────────────────────────────────────
function exportJson() {
  const tmpl     = TEMPLATES[currentTemplate]
  const sections = buildSections(tmpl)

  const output = {
    meta: { template: tmpl.label }
  }

  sections.forEach(section => {
    if (!isSectionVisible(section.id)) return
    if (section.repeatable) {
      const rowCount = repeatableState[section.id] || 1
      output[section.id] = Array.from({ length: rowCount }, (_, i) => {
        const row = {}
        section.rowFields.forEach(f => {
          row[f.id] = document.getElementById(`${section.id}_${f.id}_${i}`)?.value.trim() || null
        })
        return row
      })

    } else if (section.type === 'calibration') {
      const gainsList = calState.gains.map((gainIdx, pos) => ({
        gain:   pos + 1,
        values: [0,1,2,3].map(v => parseFloatOrNull(document.getElementById(`cal_gain_${gainIdx}_${v}`)?.value.trim())),
      }))

      const patMeasList = []
      Object.entries(calState.locs).forEach(([patLoc, { measIdxs }]) => {
        measIdxs.forEach((idx, posInLoc) => {
          const gainVal = document.getElementById(`cal_meas_${idx}_gain`)?.value
          const gainPos = gainVal ? calState.gains.indexOf(parseInt(gainVal)) : -1
          const gainIdx = gainPos >= 0 ? calState.gains[gainPos] : null
          patMeasList.push({
            location:    patLoc,
            label:       `${patLoc}_${posInLoc + 1}`,
            session:     gainPos >= 0 ? `S${gainPos + 1}` : null,
            gain:        gainPos >= 0 ? gainPos + 1 : null,
            gain_values: gainIdx !== null
              ? [0,1,2,3].map(v => parseFloatOrNull(document.getElementById(`cal_gain_${gainIdx}_${v}`)?.value.trim()))
              : null,
            note: document.getElementById(`cal_meas_${idx}_note`)?.value.trim() || null,
          })
        })
      })

      const calBlocksList = []
      calState.gains.forEach((gainIdx, gainPos) => {
        const gainValues = [0,1,2,3].map(v =>
          parseFloatOrNull(document.getElementById(`cal_gain_${gainIdx}_${v}`)?.value.trim())
        )
        Object.entries(calState.blocks[gainIdx] || {}).forEach(([calLoc, indices]) => {
          indices.forEach((idx, posInLoc) => {
            const filterRaw   = document.getElementById(`cal_block_${idx}_filter`)?.value   || ''
            const tegadermRaw = document.getElementById(`cal_block_${idx}_tegaderm`)?.value || ''
            calBlocksList.push({
              label:        `${calLoc}_${posInLoc + 1}`,
              session:      `S${gainPos + 1}`,
              gain:         gainPos + 1,
              gain_values:  gainValues,
              cal_location: calLoc,
              shape:        document.getElementById(`cal_block_${idx}_shape`)?.value || null,
              tegaderm:     tegadermRaw === 'Tegaderm' ? true : (tegadermRaw === 'No Tegaderm' ? false : null),
              filter_nd:    filterRaw && filterRaw !== 'No filter' ? parseFloatOrNull(filterRaw) : null,
              channels:     ['A','B','C','D'].filter(ch =>
                document.getElementById(`cal_block_${idx}_ch_${ch.toLowerCase()}`)?.checked
              ),
              note: document.getElementById(`cal_block_${idx}_note`)?.value.trim() || null,
            })
          })
        })
      })

      output[section.id] = {
        gains:                gainsList,
        patient_measurements: patMeasList,
        cal_blocks:           calBlocksList,
      }

    } else if (section.type === 'notes_table') {
      output[section.id] = notesTableState.rows.map(idx => {
        const evtSel = document.getElementById(`notes_evt_${idx}`)
        const evtTxt = document.getElementById(`notes_evt_text_${idx}`)
        const evt    = evtSel?.value === '__other__' ? (evtTxt?.value.trim() || 'Other') : (evtSel?.value || null)
        return {
          event:    evt,
          time:     document.getElementById(`notes_time_${idx}`)?.value || null,
          comments: document.getElementById(`notes_cmts_${idx}`)?.value.trim() || null,
        }
      })

    } else if (section.type === 'checklist') {
      output[section.id] = {}
      section.items.forEach(item => {
        output[section.id][item.id] = document.getElementById(`${section.id}_${item.id}`)?.checked ?? false
      })

    } else if (section.type === 'stages_table') {
      output[section.id] = section.rows.map(row => {
        if (row.type === 'time_range') {
          return {
            stage:   row.id,
            label:   row.label,
            start:   document.getElementById(`${section.id}_${row.id}_start`)?.value.trim()   || null,
            end:     document.getElementById(`${section.id}_${row.id}_end`)?.value.trim()     || null,
            comment: document.getElementById(`${section.id}_${row.id}_comment`)?.value.trim() || null,
          }
        }
        if (row.type === 'breathing') {
          return {
            stage:          row.id,
            label:          row.label,
            duration:       document.getElementById(`${section.id}_${row.id}_duration`)?.value.trim() || null,
            recording_done: document.getElementById(`${section.id}_${row.id}_rec_done`)?.checked ?? false,
            comment:        document.getElementById(`${section.id}_${row.id}_comment`)?.value.trim()  || null,
          }
        }
        return null
      }).filter(Boolean)

    } else if (section.type === 'icp_table') {
      const interval = parseInt(document.getElementById('icp_interval')?.value || '30', 10) || null

      const measurements = icpState.measRows.map(r => ({
        label: r.label,
        start: document.getElementById(`icp_meas_${r.idx}_start`)?.value.trim() || null,
        end:   document.getElementById(`icp_meas_${r.idx}_end`)?.value.trim()   || null,
        bp:    document.getElementById(`icp_meas_${r.idx}_bp`)?.value.trim()    || null,
      }))

      const mapGroups = (groups, type) => groups.map(g => ({
        label:      g.label,
        ventricles: g.ventRows.map(vr => ({
          side:  vr.side,
          start: document.getElementById(`icp_${type}_${g.gIdx}_vent_${vr.rIdx}_start`)?.value.trim() || null,
          end:   document.getElementById(`icp_${type}_${g.gIdx}_vent_${vr.rIdx}_end`)?.value.trim()   || null,
          bp:    document.getElementById(`icp_${type}_${g.gIdx}_vent_${vr.rIdx}_bp`)?.value.trim()    || null,
        }))
      }))

      const notes = icpState.notes.map(idx => ({
        time:    document.getElementById(`icp_note_${idx}_time`)?.value.trim()    || null,
        comment: document.getElementById(`icp_note_${idx}_comment`)?.value.trim() || null,
      }))

      output[section.id] = {
        interval_sec: interval,
        measurements,
        etv:   mapGroups(icpState.etvGroups, 'etv'),
        cpc:   mapGroups(icpState.cpcGroups, 'cpc'),
        notes,
      }

    } else if (section.type === 'fastrack') {
      const checks = {}
      section.checkItems.forEach(item => {
        checks[item.id] = document.getElementById(`${section.id}_${item.id}`)?.checked ?? false
      })
      const ranges = {}
      section.ranges.forEach(range => {
        ranges[range.id] = {
          initial: parseFloatOrNull(document.getElementById(`${section.id}_${range.id}_initial`)?.value.trim()),
          final:   parseFloatOrNull(document.getElementById(`${section.id}_${range.id}_final`)?.value.trim()),
        }
      })
      output[section.id] = { checks, ranges }

    } else {
      output[section.id] = {}
      flattenFields(section.fields).forEach(field => {
        if (field.type === 'datetime') {
          const raw = document.getElementById(field.id)?.value.trim()
          output[section.id][field.id + '_utc'] = getFieldJsonValue(field)
          output[section.id][field.id + '_et']  = toIsoDateTime(raw)
        } else if (field.revealOn && !field.allowOther) {
          const val = document.getElementById(field.id)?.value.trim() || null
          const boolMap = { 'True': true, 'False': false }
          output[section.id][field.id] = boolMap[val] !== undefined ? boolMap[val] : (val || null)
          const notes = val === field.revealOn
            ? (document.getElementById(`${field.id}_other`)?.value.trim() || null)
            : null
          output[section.id][field.id + '_notes'] = notes
        } else {
          output[section.id][field.id] = getFieldJsonValue(field)
        }
      })
    }
  })

  const studyId  = document.getElementById('study_id')?.value.trim() || 'unknown'
  const date     = fmtFilenameDate(document.getElementById('date')?.value)
  const filename = `${studyId}_${date}.json`

  triggerDownload(new Blob([jsonCompact(output)], { type: 'application/json' }), filename)
}

// ─────────────────────────────────────────────
//  EXPORT ALL
// ─────────────────────────────────────────────
function exportAll() {
  if (!currentTemplate) { showToast('Select a template first', true); return }
  if (!validateForm()) return

  const label   = TEMPLATES[currentTemplate].label
  const studyId = document.getElementById('study_id')?.value.trim() || 'unknown'
  const date    = document.getElementById('date')?.value || 'nodate'

  triggerBatchDownload(
    () => { exportTxt(true); exportJson() },
    () => showToast(`Exported ${label}_${studyId}_${date} (txt + json)`)
  )
}
