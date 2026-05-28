// ─────────────────────────────────────────────
//  SHARED CONSTANTS
// ─────────────────────────────────────────────
const INP    = "w-full text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 placeholder-slate-300"
const INP_SM = "w-full text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 placeholder-slate-300"

function buildDelBtn(onclick) {
  return `<button onclick="${onclick}"
    class="flex items-center justify-center text-slate-300 hover:text-red-400 transition-colors shrink-0">
    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
    </svg>
  </button>`
}

function buildAddBtn(label, onclick) {
  return `<button onclick="${onclick}"
    class="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors">
    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/>
    </svg>
    ${label}
  </button>`
}

// ─────────────────────────────────────────────
//  UTILITIES
// ─────────────────────────────────────────────
function esc(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function toIsoDate(val) {
  if (!val) return null
  const [d, m, y] = val.split('-')
  return `${y.slice(-2)}:${m}:${d}`
}

function toIsoDateTime(val) {
  if (!val) return null
  const [date, time] = val.split(' ')
  const [d, m, y] = date.split('-')
  return `${y}-${m}-${d} ${time}`
}

function toUtcDateTime(val) {
  if (!val) return null
  const [date, time] = val.split(' ')
  if (!date || !time) return null
  const [d, m, y] = date.split('-')
  const [h, min, s] = time.split(':')
  const local = new Date(+y, +m - 1, +d, +h, +min, +(s || 0))
  if (isNaN(local.getTime())) return null
  const pad = n => String(n).padStart(2, '0')
  return `${local.getUTCFullYear()}-${pad(local.getUTCMonth()+1)}-${pad(local.getUTCDate())} ${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}:${pad(local.getUTCSeconds())}`
}

function parseFloatOrNull(v) {
  if (v === null || v === undefined || v === '') return null
  const f = parseFloat(v)
  return isNaN(f) ? null : f
}

function jsonCompact(obj) {
  return JSON.stringify(obj, null, 2).replace(
    /\[\n(\s*(?:-?\d+(?:\.\d+)?|"(?:[^"\\]|\\.)*"|null|true|false),?\n)+\s*\]/g,
    match => '[' + (match.match(/(?:-?\d+(?:\.\d+)?|"(?:[^"\\]|\\.)*"|null|true|false)/g) || []).join(', ') + ']'
  )
}

let _batchQueue = null

function fmtFilenameDate(val) {
  if (!val) return 'nodate'
  const [d, m, y] = val.split('-')
  return (m && d && y) ? `${m}-${d}-${y.slice(-2)}` : val
}

function triggerDownload(blob, filename) {
  if (_batchQueue) {
    _batchQueue.push(blob.text().then(content => ({ content, filename })))
    return
  }
  if (window.electronAPI) {
    blob.text().then(content => window.electronAPI.saveFile(content, filename))
    return
  }
  const url = URL.createObjectURL(blob)
  const a   = document.createElement('a')
  a.href     = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 100)
}

function triggerBatchDownload(callback, onSuccess) {
  _batchQueue = []
  callback()
  const promises = _batchQueue
  _batchQueue = null
  Promise.all(promises).then(files => {
    if (window.electronAPI) {
      window.electronAPI.saveFiles(files).then(res => {
        if (res?.success) onSuccess?.()
        else showToast('Export cancelled', true)
      })
    } else {
      files.forEach(({ content, filename }) => {
        const blob = new Blob([content])
        const url  = URL.createObjectURL(blob)
        const a    = document.createElement('a')
        a.href     = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        setTimeout(() => URL.revokeObjectURL(url), 100)
      })
      onSuccess?.()
    }
  })
}

function showToast(msg, isError = false) {
  const toast    = document.getElementById('toast')
  const toastMsg = document.getElementById('toast-msg')
  const icon     = document.getElementById('toast-icon')
  toastMsg.textContent = msg
  icon.classList.toggle('text-red-400',     isError)
  icon.classList.toggle('text-emerald-400', !isError)
  toast.classList.add('visible')
  setTimeout(() => toast.classList.remove('visible'), 3000)
}
