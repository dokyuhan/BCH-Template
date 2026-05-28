// ─────────────────────────────────────────────
//  ICP — Intracranial Pressure
// ─────────────────────────────────────────────
const ICP_CONFIG = {
  label:       "ICP",
  fullLabel:   "Intracranial Pressure",
  style: {
    card:    "border-amber-400 bg-amber-50",
    label:   "text-amber-600",
    dot:     "bg-amber-500",
    section: "border-l-amber-300",
  },
  cohortOptions: ["ICP"],
  cohortSectionMap: {
    "ICP": ["session_record", "device_config", "icp_checklist", "icp_measurements", "calibration"],
  },
  specificSections: [
    {
      id:          "icp_checklist",
      title:       "Checklist",
      type:        "checklist",
      insertAfter: "device_config",
      icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
                 d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
             </svg>`,
      items: [
        { id: "tiepie",    label: "TIEPIE"    },
        { id: "evolution", label: "Evolution" },
      ]
    },
    {
      id:          "icp_measurements",
      title:       "Measurements",
      type:        "icp_table",
      insertAfter: "icp_checklist",
      icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
                 d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
             </svg>`,
    },
  ]
}
