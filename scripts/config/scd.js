// ─────────────────────────────────────────────
//  SCD — Sickle Cell Disease
// ─────────────────────────────────────────────
const SCD_CONFIG = {
  label:       "SCD",
  fullLabel:   "Sickle Cell Disease",
  style: {
    card:    "border-rose-400 bg-rose-50",
    label:   "text-rose-600",
    dot:     "bg-rose-500",
    section: "border-l-rose-300",
  },
  cohortOptions: ["SCD Infant Cohort", "SCD Transfusion", "SCD Gene Therapy", "SCD Control"],
  cohortSectionMap: {
    "SCD Infant Cohort": ["session_record", "device_config", "calibration"],
    "SCD Transfusion":   ["session_record", "device_config", "calibration"],
    "SCD Gene Therapy":  ["session_record", "device_config", "scd_checklist", "scd_stages", "scd_fastrack", "calibration"],
    "SCD Control":       ["session_record", "device_config", "calibration"],
  },
  specificSections: [
    {
      id:          "scd_checklist",
      title:       "Checklist",
      type:        "checklist",
      insertAfter: "device_config",
      icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
                 d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
             </svg>`,
      items: [
        { id: "ecg",      label: "ECG" },
        { id: "bp",       label: "Before and after BP" },
        { id: "finapres", label: "Finapres" },
        { id: "tiepie",   label: "TiePie" },
        { id: "fastrak",  label: "Fastrak" },
      ]
    },
    {
      id:          "scd_stages",
      title:       "Stages",
      type:        "stages_table",
      insertAfter: "scd_checklist",
      icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
                 d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
             </svg>`,
      rows: [
        { id: "sitting_1",   label: "Sitting",              type: "time_range" },
        { id: "standing",    label: "Standing",             type: "time_range" },
        { id: "squats",      label: "Squats",               type: "time_range" },
        { id: "breathing_1", label: "Breathing Exercise 1", type: "breathing"  },
        { id: "breathing_2", label: "Breathing Exercise 2", type: "breathing"  },
        { id: "breathing_3", label: "Breathing Exercise 3", type: "breathing"  },
        { id: "sitting_2",   label: "Sitting",              type: "time_range" },
        { id: "standing_2",  label: "Standing",             type: "time_range" },
      ]
    },
    {
      id:          "scd_fastrack",
      title:       "Fastrack",
      type:        "fastrack",
      insertAfter: "scd_stages",
      icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
                 d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
                 d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
             </svg>`,
      checkItems: [
        { id: "left_ear",  label: "Left Ear"  },
        { id: "right_ear", label: "Right Ear" },
        { id: "nose",      label: "Nose"      },
      ],
      ranges: [
        { id: "hair_line",     label: "Hair line"                    },
        { id: "left_eyebrow",  label: "Left eyebrow"                 },
        { id: "right_eyebrow", label: "Right Eyebrow"                },
        { id: "dcs_nirs",      label: "DCS/NIRS source and detectors" },
        { id: "probe_edge",    label: "Probe edge"                   },
      ]
    },
  ]
}
