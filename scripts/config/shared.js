// ─────────────────────────────────────────────
//  SHARED SECTIONS
//  Appear in every template. Order here = order in form.
// ─────────────────────────────────────────────
const SHARED_SECTIONS = [

  {
    id:    "session_record",
    title: "Session Record",
    icon:  `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>`,
    fields: [
      {
        type: "group", cols: 2, labeled: true,
        fields: [
          { id: "study_id", label: "Study ID", type: "text", required: true, forceUpperCase: true },
          { id: "cohort",   label: "Cohort",   type: "select", required: true, optionsFrom: "cohortOptions", onChange: "onCohortChange" },
        ]
      },
      { id: "date", label: "Date", type: "date", required: true },
      {
        type: "group", cols: 3, labeled: true,
        fields: [
          { id: "hospital", label: "Hospital", type: "text", required: true, defaultValue: "BCH" },
          {
            id: "building", label: "Building", type: "select", required: true, allowOther: true,
            onChange: "onBuildingChange",
            options: ["-- Select --", "Hale 11 (NICU)", "Hale 6 (Cathlab)", "Hale 3 (OR)", "Main 3 (OR)", "MegLAB", "Other"]
          },
          { id: "room", label: "Room", type: "text", required: true },
        ]
      },
      {
        type: "group", cols: 2, labeled: true,
        fields: [
          { id: "meas_start", label: "Measurement Start", type: "datetime", required: false, hint: "ET" },
          { id: "meas_end",   label: "Measurement End",   type: "datetime", required: false, hint: "ET" },
        ]
      },
      { id: "probe_holder",  label: "Probe Holder",  type: "text", required: true },
      { id: "computer_tech", label: "Computer Tech", type: "text", required: true },
    ]
  },

  {
    id:    "device_config",
    title: "Device Configuration",
    icon:  `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
                d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/>
            </svg>`,
    fields: [
      {
        type: "group", cols: 2, labeled: true,
        fields: [
          { id: "device_type", label: "Device Type", type: "select", required: true,
            defaultValue: "MetaOx1",
            options: ["-- Select --", "MetaOx", "MetaOx1"] },
          { id: "probe_type", label: "Probe Type", type: "select", required: true,
            options: ["-- Select --", "NICUCM1", "NB5", "TLCM1", "PEDSCM1"],
            onChange: "onProbeTypeChange" },
        ]
      },
      {
        type: "group", cols: 2, labeled: true,
        fields: [
          { id: "power_before", label: "Power Before", type: "power_measurement", required: true },
          { id: "power_after",  label: "Power After",  type: "power_measurement", required: true },
        ]
      },
      {
        type: "group", cols: 2, labeled: true,
        fields: [
          { id: "tiepie_start", label: "Tiepie Start", type: "datetime", required: false, hint: "ET" },
          { id: "tiepie_end",   label: "Tiepie End",   type: "datetime", required: false, hint: "ET" },
        ]
      },
      {
        type: "group", cols: 2, labeled: true,
        fields: [
          { id: "dcs_flip",   label: "DCS Flip",           type: "select",      required: true,
            options: ["-- Select --", "True", "False"] },
          { id: "locations",  label: "Locations Measured",  type: "multiselect", required: true,
            options: ["LF", "RF", "C3 (left)", "C4 (right)", "CAL1034", "CAL2127"] },
        ]
      },
      { id: "nirs_distances", label: "NIRS Distances", type: "distances", count: 4, readonly: true },
      { id: "dcs_distances",  label: "DCS Distances",  type: "distances", count: 8, readonly: true },
      {
        type: "group", cols: 3, labeled: true,
        fields: [
          { id: "vent", label: "Vent", type: "select", required: false,
            revealOn: "True", revealPlaceholder: "Specify vent type...",
            options: ["-- Select --", "True", "False"] },
          { id: "room_light", label: "Room Light", type: "select", required: false,
            options: ["-- Select --", "Off", "Low", "Normal", "Bright"] },
          { id: "tegaderm", label: "Tegaderm", type: "select", required: false,
            options: ["-- Select --", "True", "False"] },
        ]
      },
      { id: "session_notes", label: "Notes", type: "textarea", rows: 3, required: false, placeholder: "Additional notes..." },
    ]
  },

  {
    id:    "calibration",
    title: "Calibration",
    type:  "calibration",
    icon:  `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/>
            </svg>`,
    ndOptions: ["No filter", "0.1", "0.2", "0.3", "0.4", "0.5", "0.6", "0.7", "0.8", "0.9", "1.0", "1.1", "1.2", "1.3", "1.4", "1.5"],
  },

]

// ─────────────────────────────────────────────
//  PROBE DISTANCES
//  Keys must match probe_type options exactly.
//  nirs → 4 values  |  dcs → 8 values
// ─────────────────────────────────────────────
const PROBE_DISTANCES = {
  "NICUCM1": { nirs: [1.5, 2, 2.5, 3],    dcs: [0.5, 2, 2, 2, 2, 2, 2, 2] },
  "NB5":     { nirs: [1.5, 2, 2.5, 3],    dcs: [0.5, 2, 2, 2, 2, 2, 2, 2] },
  "TLCM1":   { nirs: [1, 1.5, 3, 4],      dcs: [1, 3, 3, 3, 3, 3, 3, 3]   },
  "PEDSCM1": { nirs: [1, 1.5, 2.5, 3.5],  dcs: [1, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5] },
}
