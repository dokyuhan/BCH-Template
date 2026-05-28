// ─────────────────────────────────────────────
//  PBI — Pediatric Brain Injury
// ─────────────────────────────────────────────
const PBI_CONFIG = {
  label:       "PBI",
  fullLabel:   "Pediatric Brain Injury",
  style: {
    card:    "border-violet-400 bg-violet-50",
    label:   "text-violet-600",
    dot:     "bg-violet-500",
    section: "border-l-violet-300",
  },
  cohortOptions: ["PBI TH", "PBI non-TH", "PBI control"],
  cohortSectionMap: {
    "PBI TH":      ["session_record", "device_config", "pbi_th_info", "calibration"],
    "PBI non-TH":  ["session_record", "device_config", "calibration"],
    "PBI control": ["session_record", "device_config", "calibration"],
  },
  specificSections: [
    {
      id:          "pbi_th_info",
      title:       "Clinical Information",
      insertAfter: "device_config",
      icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
                 d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
             </svg>`,
      fields: [
        {
          type: "group", cols: 2, labeled: true,
          fields: [
            { id: "encephalopathy_score", label: "Encephalopathy Score", type: "select", required: true,
              options: ["-- Select --", "1","2","3","4","5","6","7","8","9","10","11","12","13","14","15","16","17","18","19","20","21"] },
            { id: "th_phase", label: "Therapeutic Hypothermia Phase", type: "select", required: true,
              options: ["-- Select --", "C1", "C2", "C3", "RW", "NT"] },
          ]
        },
        {
          type: "group", cols: 2, labeled: true,
          fields: [
            { id: "eeg",      label: "EEG",      type: "select", required: true,
              options: ["-- Select --", "True", "False"] },
            { id: "seizures", label: "Seizures", type: "select", required: true,
              options: ["-- Select --", "True", "False"] },
          ]
        },
        { id: "seizure_medication", label: "Seizures/Antibiotics Medication", type: "select", required: false,
          revealOn: "True", revealPlaceholder: "Specify medication...", revealRows: 2,
          options: ["-- Select --", "True", "False"] },
      ]
    },
  ]
}
