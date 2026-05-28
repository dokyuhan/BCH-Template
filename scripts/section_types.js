// ─────────────────────────────────────────────
//  CHECKLIST SECTION
// ─────────────────────────────────────────────
function buildChecklistCard(section, tmpl) {
  const items = section.items.map(item => `
    <label class="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
      ${item.label}
      <input type="checkbox" id="${section.id}_${item.id}"
        class="w-4 h-4 rounded border-slate-300 cursor-pointer accent-slate-800">
    </label>`
  ).join('')

  return `<div class="border-l-4 ${tmpl.style.section} px-5 pt-5 pb-5">
    <div class="flex items-center gap-2.5 mb-4">
      <span class="text-slate-400">${section.icon}</span>
      <h2 class="text-xs font-semibold text-slate-600 uppercase tracking-wider mono">${section.title}</h2>
    </div>
    <div class="flex flex-wrap gap-x-8 gap-y-3">
      ${items}
    </div>
  </div>`
}

// ─────────────────────────────────────────────
//  STAGES TABLE SECTION
// ─────────────────────────────────────────────
function buildStagesTableCard(section, tmpl) {
  const inp = INP_SM

  const rows = section.rows.map(row => {
    if (row.type === 'time_range') {
      return `<tr class="border-t border-slate-100">
        <td class="py-2 pr-3 text-sm text-slate-700 whitespace-nowrap">${row.label}</td>
        <td class="py-2 pr-2"><input type="text" data-timepicker="time" id="${section.id}_${row.id}_start" placeholder="HH:MM:SS" class="${inp} cursor-pointer"></td>
        <td class="py-2 pr-2"><input type="text" data-timepicker="time" id="${section.id}_${row.id}_end"   placeholder="HH:MM:SS" class="${inp} cursor-pointer"></td>
        <td class="py-2">    <input type="text"           id="${section.id}_${row.id}_comment" class="${inp}"></td>
      </tr>`
    }
    if (row.type === 'breathing') {
      return `<tr class="border-t border-slate-100">
        <td class="py-2 pr-3 text-sm text-slate-700 whitespace-nowrap">${row.label}</td>
        <td class="py-2 pr-2"><input type="text" id="${section.id}_${row.id}_duration" placeholder="Duration" class="${inp}"></td>
        <td class="py-2 pr-2">
          <label class="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none whitespace-nowrap">
            <input type="checkbox" id="${section.id}_${row.id}_rec_done"
              class="w-4 h-4 rounded border-slate-300 cursor-pointer accent-slate-800">
            Rec. done
          </label>
        </td>
        <td class="py-2"><input type="text" id="${section.id}_${row.id}_comment" class="${inp}"></td>
      </tr>`
    }
    return ''
  }).join('')

  return `<div class="border-l-4 ${tmpl.style.section} px-5 pt-5 pb-5">
    <div class="flex items-center gap-2.5 mb-4">
      <span class="text-slate-400">${section.icon}</span>
      <h2 class="text-xs font-semibold text-slate-600 uppercase tracking-wider mono">${section.title}</h2>
    </div>
    <div class="overflow-x-auto">
      <table class="w-full text-sm" style="border-collapse:collapse">
        <colgroup>
          <col style="width:160px">
          <col style="width:120px">
          <col style="width:140px">
          <col>
        </colgroup>
        <thead>
          <tr>
            <th class="text-left text-xs font-semibold text-slate-400 mono uppercase tracking-wider pb-2 pr-3"> Stage </th>
            <th class="text-left text-xs font-semibold text-slate-400 mono uppercase tracking-wider pb-2 pr-2"> Start </th>
            <th class="text-left text-xs font-semibold text-slate-400 mono uppercase tracking-wider pb-2 pr-2"> End </th>
            <th class="text-left text-xs font-semibold text-slate-400 mono uppercase tracking-wider pb-2"> Comment </th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </div>`
}

// ─────────────────────────────────────────────
//  FASTRACK SECTION
// ─────────────────────────────────────────────
function buildFastrackCard(section, tmpl) {
  const numInp = "text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 w-28 text-center placeholder-slate-300"

  const checks = section.checkItems.map(item => `
    <label class="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
      ${item.label}
      <input type="checkbox" id="${section.id}_${item.id}"
        class="w-4 h-4 rounded border-slate-300 cursor-pointer accent-slate-800">
    </label>`
  ).join('')

  const rangeRows = section.ranges.map(range => `
    <tr class="border-t border-slate-100">
      <td class="py-2 pr-32 text-sm text-slate-700 whitespace-nowrap">${range.label}</td>
      <td class="py-2 pr-2">
        <input type="text" id="${section.id}_${range.id}_initial" placeholder="0"
          oninput="this.value=this.value.replace(/[^0-9.-]/g,'')"
          class="${numInp}">
      </td>
      <td class="py-2 text-sm text-slate-400 text-center">—</td>
      <td class="py-2 pl-2">
        <input type="text" id="${section.id}_${range.id}_final" placeholder="0"
          oninput="this.value=this.value.replace(/[^0-9.-]/g,'')"
          class="${numInp}">
      </td>
    </tr>`
  ).join('')

  return `<div class="border-l-4 ${tmpl.style.section} px-5 pt-5 pb-5">
    <div class="flex items-center gap-2.5 mb-4">
      <span class="text-slate-400">${section.icon}</span>
      <h2 class="text-xs font-semibold text-slate-600 uppercase tracking-wider mono">${section.title}</h2>
    </div>
    <div class="flex flex-wrap gap-x-8 gap-y-3 mb-5">
      ${checks}
    </div>
    <table class="text-sm" style="border-collapse:collapse">
      <thead>
        <tr>
          <th class="text-left text-xs font-semibold text-slate-400 mono uppercase tracking-wider pb-2">Location</th>
          <th class="text-left text-xs font-semibold text-slate-400 mono uppercase tracking-wider pb-2" style="width:112px">Initial Range</th>
          <th style="width:60px"></th>
          <th class="text-left text-xs font-semibold text-slate-400 mono uppercase tracking-wider pb-2" style="width:112px">Final Range</th>
        </tr>
      </thead>
      <tbody>${rangeRows}</tbody>
    </table>
  </div>`
}
