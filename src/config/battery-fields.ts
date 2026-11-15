export type FieldGroupId = "identity" | "integrity" | "careRepair" | "impact";

export type FieldSubSection = "general" | "repair" | "supply" | "recycling";

export type FieldAccessTier = "public" | "restricted";

export type FieldInputType = "text" | "number" | "textarea";

export interface BatteryFieldDefinition {
  key: string;
  label: string;
  group: FieldGroupId;
  subSection: FieldSubSection;
  tier: FieldAccessTier;
  required: boolean;
  type: FieldInputType;
  unit?: string;
  placeholder?: string;
  hint?: string;
}

export const WORKING_FIELD_LIST_NOTICE =
  "Working field list. Check against the official regulation.";

export const PUBLIC_MANUFACTURER_NOTICE =
  "Information provided by the manufacturer. Not verified by us.";

export const FIELD_GROUP_META: Record<
  FieldGroupId,
  { title: string; subtitle: string }
> = {
  identity: {
    title: "Identity",
    subtitle: "Model identification, manufacturer, and EU responsible operator details",
  },
  integrity: {
    title: "Integrity",
    subtitle: "Electrical ratings, durability baselines, and service diagnostics",
  },
  careRepair: {
    title: "Care & Repair",
    subtitle: "Safe charging, storage guidance, spare parts, and repair boundaries",
  },
  impact: {
    title: "Impact & Provenance",
    subtitle: "Cell chemistry, carbon footprint, materials, supply notes, and end-of-life",
  },
};

/**
 * Editable working field list inspired by Regulation (EU) 2023/1542 Annex XIII.
 * Not an official regulatory schema — edit entries here without altering core UI/extractor logic.
 */
export const BATTERY_FIELDS: readonly BatteryFieldDefinition[] = [
  // ── Identity (9 fields) ─────────────────────────────────────────────
  {
    key: "battery_model_name",
    label: "Battery model name",
    group: "identity",
    subSection: "general",
    tier: "public",
    required: true,
    type: "text",
    placeholder: "e.g. TrailPack 36V-500",
  },
  {
    key: "model_code",
    label: "Model code / SKU",
    group: "identity",
    subSection: "general",
    tier: "public",
    required: true,
    type: "text",
    placeholder: "e.g. TP-36V-14S4P",
  },
  {
    key: "manufacturer_name",
    label: "Manufacturer legal name",
    group: "identity",
    subSection: "general",
    tier: "public",
    required: true,
    type: "text",
    placeholder: "e.g. NordBike Energy GmbH",
  },
  {
    key: "manufacturer_address",
    label: "Manufacturer registered address",
    group: "identity",
    subSection: "general",
    tier: "public",
    required: true,
    type: "text",
    placeholder: "Street, city, postal code, country",
  },
  {
    key: "eu_responsible_person",
    label: "EU responsible economic operator",
    group: "identity",
    subSection: "general",
    tier: "public",
    required: true,
    type: "text",
    placeholder: "Operator name placed on the EU market",
  },
  {
    key: "eu_responsible_address",
    label: "EU responsible operator address",
    group: "identity",
    subSection: "general",
    tier: "public",
    required: true,
    type: "text",
    placeholder: "EU street address and contact",
  },
  {
    key: "manufacturing_place",
    label: "Manufacturing plant location",
    group: "identity",
    subSection: "general",
    tier: "public",
    required: true,
    type: "text",
    placeholder: "City and country of pack assembly",
  },
  {
    key: "batch_or_serial_format",
    label: "Batch / serial number identifier format",
    group: "identity",
    subSection: "general",
    tier: "public",
    required: false,
    type: "text",
    placeholder: "e.g. YYMM-PLANT-NNNNN",
  },
  {
    key: "weight_kg",
    label: "Battery pack mass",
    group: "identity",
    subSection: "general",
    tier: "public",
    required: true,
    type: "number",
    unit: "kg",
    placeholder: "e.g. 3.1",
  },

  // ── Integrity (8 fields) ────────────────────────────────────────────
  {
    key: "battery_category",
    label: "Battery category",
    group: "integrity",
    subSection: "general",
    tier: "public",
    required: true,
    type: "text",
    placeholder: "e.g. LMT battery (e-bike)",
  },
  {
    key: "nominal_voltage_v",
    label: "Nominal voltage",
    group: "integrity",
    subSection: "general",
    tier: "public",
    required: true,
    type: "number",
    unit: "V",
    placeholder: "e.g. 36",
  },
  {
    key: "rated_capacity_ah",
    label: "Rated capacity",
    group: "integrity",
    subSection: "general",
    tier: "public",
    required: true,
    type: "number",
    unit: "Ah",
    placeholder: "e.g. 14.5",
  },
  {
    key: "rated_energy_wh",
    label: "Rated energy capacity",
    group: "integrity",
    subSection: "general",
    tier: "public",
    required: true,
    type: "number",
    unit: "Wh",
    placeholder: "e.g. 522",
  },
  {
    key: "expected_cycle_life",
    label: "Expected cycle life to reference SoH",
    group: "integrity",
    subSection: "general",
    tier: "public",
    required: true,
    type: "number",
    unit: "cycles",
    placeholder: "e.g. 800 cycles to 80% SoH",
  },
  {
    key: "enclosure_ip_rating",
    label: "Enclosure ingress protection rating",
    group: "integrity",
    subSection: "general",
    tier: "public",
    required: false,
    type: "text",
    placeholder: "e.g. IP65",
  },
  {
    key: "bms_firmware_version",
    label: "BMS firmware & parameter reference",
    group: "integrity",
    subSection: "general",
    tier: "restricted",
    required: false,
    type: "text",
    placeholder: "Authority & authorised repairer diagnostic ref",
  },
  {
    key: "internal_test_report_ref",
    label: "Durability / UN transport test report ref",
    group: "integrity",
    subSection: "general",
    tier: "restricted",
    required: false,
    type: "text",
    placeholder: "Restricted reference ID for authorities",
  },

  // ── Care & Repair (5 fields; drives conditional Repair tab when filled) ──
  {
    key: "safe_charging_window",
    label: "Charging temperature & charger window",
    group: "careRepair",
    subSection: "repair",
    tier: "public",
    required: false,
    type: "textarea",
    placeholder: "e.g. Charge between 0°C and 40°C using 42V DC max 4A charger",
  },
  {
    key: "storage_and_handling_notes",
    label: "Storage & safe handling notes",
    group: "careRepair",
    subSection: "repair",
    tier: "public",
    required: false,
    type: "textarea",
    placeholder: "e.g. Store at 40–60% charge in dry 10–20°C environment",
  },
  {
    key: "external_spare_parts",
    label: "External spare parts list (user-accessible)",
    group: "careRepair",
    subSection: "repair",
    tier: "public",
    required: false,
    type: "textarea",
    placeholder: "e.g. External blade fuse 30A (SKU F-30A), housing latch kit",
  },
  {
    key: "spare_parts_ordering_channel",
    label: "Spare parts ordering contact / portal",
    group: "careRepair",
    subSection: "repair",
    tier: "public",
    required: false,
    type: "text",
    placeholder: "Email or spare parts catalogue URL",
  },
  {
    key: "dismantling_manual_ref",
    label: "Authorised workshop dismantling manual ref",
    group: "careRepair",
    subSection: "repair",
    tier: "restricted",
    required: false,
    type: "text",
    placeholder: "Restricted technical dismantling document reference",
  },

  // ── Impact: General (4 fields) ───────────────────────────────────────
  {
    key: "battery_chemistry",
    label: "Electrochemical cell chemistry",
    group: "impact",
    subSection: "general",
    tier: "public",
    required: true,
    type: "text",
    placeholder: "e.g. Li-ion NMC 811 / LFP",
  },
  {
    key: "carbon_footprint_kg_co2e",
    label: "Total carbon footprint (lifecycle estimate)",
    group: "impact",
    subSection: "general",
    tier: "public",
    required: true,
    type: "number",
    unit: "kg CO2e",
    placeholder: "e.g. 64.5",
  },
  {
    key: "critical_raw_materials",
    label: "Key raw materials declaration",
    group: "impact",
    subSection: "general",
    tier: "public",
    required: false,
    type: "textarea",
    placeholder: "Summary of Co, Ni, Li, graphite shares or ranges",
  },
  {
    key: "recycled_content_summary",
    label: "Recycled active material shares",
    group: "impact",
    subSection: "general",
    tier: "public",
    required: false,
    type: "textarea",
    placeholder: "Recycled content share notes if declared",
  },

  // ── Impact: Supply sub-section (3 fields; drives conditional Supply tab) ──
  {
    key: "supply_raw_material_origin",
    label: "Raw material origin regions",
    group: "impact",
    subSection: "supply",
    tier: "public",
    required: false,
    type: "text",
    placeholder: "Regions disclosed by supplier",
  },
  {
    key: "supply_cell_factory_region",
    label: "Cell production facility / region",
    group: "impact",
    subSection: "supply",
    tier: "public",
    required: false,
    type: "text",
    placeholder: "Cell factory city or country",
  },
  {
    key: "supply_eu_warehouse",
    label: "EU importer / distribution hub",
    group: "impact",
    subSection: "supply",
    tier: "public",
    required: false,
    type: "text",
    placeholder: "EU warehouse or fulfilment location",
  },

  // ── Impact: Recycling / End-of-life sub-section (2 fields) ───────────
  {
    key: "takeback_and_collection_instructions",
    label: "End-of-life return & collection instructions",
    group: "impact",
    subSection: "recycling",
    tier: "public",
    required: true,
    type: "textarea",
    placeholder: "How users and dealers return spent packs; no unsorted disposal",
  },
  {
    key: "end_of_life_hazard_notes",
    label: "Hazardous substance & extinguishing / handling notes",
    group: "impact",
    subSection: "recycling",
    tier: "public",
    required: false,
    type: "textarea",
    placeholder: "Fire safety, damaged pack insulation, and operator notes",
  },
] as const;

export const BATTERY_FIELD_MAP: Record<string, BatteryFieldDefinition> =
  Object.fromEntries(BATTERY_FIELDS.map((field) => [field.key, field]));
