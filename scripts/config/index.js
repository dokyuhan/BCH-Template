// ─────────────────────────────────────────────
//  TEMPLATES
//
//  To add a new template:
//  1. Create scripts/config/mytemplate.js defining MY_CONFIG = { ... }
//  2. Add it here: mykey: MY_CONFIG
//  3. Add the script tag in index.html before this file
// ─────────────────────────────────────────────
const TEMPLATES = {
  pda:           PDA_CONFIG,
  pbi:           PBI_CONFIG,
  scd:           SCD_CONFIG,
  icp:           ICP_CONFIG,
  hydrocephalus: HYDROCEPHALUS_CONFIG,
}
