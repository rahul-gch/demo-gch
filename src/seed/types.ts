export type EntityType =
  | "Brand"
  | "Farmer"
  | "Ginner"
  | "Spinner"
  | "Fabric Mill"
  | "Dye House"
  | "Garment Factory"
  | "Logistics Provider"
  | "Certification Body"
  | "Sustainability Partner";

export type ActorType = "Tier 0" | "Tier 1" | "Tier 2" | "Tier 3" | "Tier 4";
export type RiskLevel = "Low" | "Medium" | "High";
export type VerificationStatus = "Verified" | "Pending" | "Incomplete" | "Flagged";

export interface Entity {
  id: string;
  gchNumber: string;
  name: string;
  entityType: EntityType;
  organizationType: string;
  actorType: ActorType;
  country: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
  description: string;
  materials: string[];
  capabilities: string[];
  capacity: string;
  moq: string;
  leadTimeDays: number;
  certifications: string[];
  confidenceScore: number; // 0-100
  riskLevel: RiskLevel;
  evidenceCount: number;
  missingDataCount: number;
  profileCompleteness: number; // 0-100
  verificationStatus: VerificationStatus;
  preferredCommunicationChannel: "Email" | "Phone" | "Platform Message";
  kpiReadiness: number;
  traceabilityReadiness: number;
  matchmakingReadiness: number;
  missingFields: string[];
  recommendedNextAction: string;
}
