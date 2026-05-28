// ─────────────────────────────────────────────
//  PDA — Patent Ductus Arteriosus
// ─────────────────────────────────────────────
const PDA_CONFIG = {
  label:       "PDA",
  fullLabel:   "Patent Ductus Arteriosus",
  style: {
    card:    "border-blue-400 bg-blue-50",
    label:   "text-blue-600",
    dot:     "bg-blue-500",
    section: "border-l-blue-300",
  },
  cohortOptions: ["PDA NIRS", "PDA Notes"],
  cohortSectionMap: {
    "PDA NIRS":  ["session_record", "device_config", "patient_info", "calibration"],
    "PDA Notes": ["session_record", "procedural_notes"],
  },
  specificSections: [
    {
      id:          "patient_info",
      title:       "Patient Information",
      insertAfter: "device_config",
      icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
                 d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
             </svg>`,
      fields: [
        {
          type: "group", cols: 2, labeled: true,
          fields: [
            { id: "hair_color",  label: "Hair Color",  type: "select", required: false,
              options: ["-- Select --", "Brown", "Blonde", "White", "Black", "Red"] },
            { id: "hair_amount", label: "Hair Amount", type: "select", required: false,
              options: ["-- Select --", "None", "Minimal", "Moderate", "Excessive"] },
          ]
        },
      ]
    },
    {
      id:    "procedural_notes",
      title: "Procedure Notes",
      type:  "notes_table",
      icon:  `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
              </svg>`,
      predefinedEvents: [
        "Start procedure",
        "Insertion of the catheter",
        "Insertion of the device",
        "Measurement of the arterial BP",
        "Start device placement",
        "End device placement",
      ],
    }
  ]
}
