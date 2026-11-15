export type AccessTier = "Public" | "Restricted (authorities/repairers)";

export type TabId = "passport" | "repair" | "journey" | "authenticity";

export interface PassportMeta {
  brand: string;
  product: string;
  modelCode: string;
  badgeText: string;
  disclaimer: string;
}

export interface EntityInfo {
  name: string;
  address: string;
  contact?: string;
}

export interface PassportFieldGroup<T> {
  title: string;
  accessTier: AccessTier;
  data: T;
}

export interface IdentityFields {
  passportId: string;
  serialNumber: string;
  batchCode: string;
  manufacturedDate: string;
  nominalVoltage: string;
  ratedCapacity: string;
  energyCapacity: string;
  configuration: string;
  weight: string;
  manufacturer: EntityInfo;
  euResponsiblePerson: EntityInfo;
}

export interface IntegrityFields {
  stateOfHealthPct: number;
  ratedCycleLife: string;
  enclosureRating: string;
  operatingTempRange: string;
  tamperSealState: string;
  bmsFirmwareVersion: string;
}

export interface CareRepairFields {
  chargingWindow: string;
  storageGuidance: string;
  inspectionInterval: string;
  serviceabilityLevel: string;
  safetyNotes: string[];
}

export interface CarbonStage {
  stage: string;
  sharePct: number;
  kgCo2e: number;
}

export interface MaterialShare {
  material: string;
  massSharePct: number;
  recycledSharePct: number;
}

export interface ImpactFields {
  batteryChemistry: string;
  carbonFootprintTotalKg: number;
  carbonPerKwhKg: number;
  carbonLifecycleBreakdown: CarbonStage[];
  materials: MaterialShare[];
}

export interface SparePartPlaceholder {
  partNumber: string;
  name: string;
  placeholderNote: string;
}

interface BaseHotspot {
  id: "cell-pack" | "bms-board" | "fuse" | "latch";
  label: string;
  shortLabel: string;
  svgCoords: { x: number; y: number };
  sparePart: SparePartPlaceholder;
}

export interface UserRepairHotspot extends BaseHotspot {
  id: "fuse" | "latch";
  serviceability: "user";
  safetyTag: string;
  estimatedMinutes: number;
  toolRequired: string;
  repairSteps: string[];
}

export interface AuthorisedOnlyHotspot extends BaseHotspot {
  id: "cell-pack" | "bms-board";
  serviceability: "authorised-only";
  safetyTag: "Authorised service only – do not open the pack";
  safetyNotice: string;
}

export type RepairHotspot = UserRepairHotspot | AuthorisedOnlyHotspot;

export interface SupplyStage {
  step: 1 | 2 | 3 | 4;
  stage: "Raw Material Origin" | "Cell Factory" | "Assembly" | "EU Warehouse";
  facility: string;
  location: string;
  dateWindow: string;
  transportMode: string;
  detail: string;
}

export interface AuthenticityData {
  certificateId: string;
  statusValue: string;
  timestampValue: string;
  digestValue: string;
  demoNote: string;
  recycling: {
    schemeTitle: string;
    takeBackInstruction: string;
    collectionCode: string;
    prepSteps: string[];
  };
}

export interface PassportDocument {
  meta: PassportMeta;
  passportData: {
    identity: PassportFieldGroup<IdentityFields>;
    integrity: PassportFieldGroup<IntegrityFields>;
    careRepair: PassportFieldGroup<CareRepairFields>;
    impact: PassportFieldGroup<ImpactFields>;
  };
  repairView: {
    safetySummary: string;
    hotspots: RepairHotspot[];
  };
  supplyJourney: SupplyStage[];
  authenticity: AuthenticityData;
}
