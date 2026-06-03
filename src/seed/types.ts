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

export interface CertificationDetail {
  category: string;
  name: string;
  lastVerified: string;
  expiryDate: string;
  status: "Verified" | "Pending" | "Expired";
}

export interface Contact {
  name: string;
  email: string;
  phone: string;
  role: string;
}

export interface Entity {
  id: string;
  gchNumber: string;
  name: string;
  entityType: EntityType;
  rawEntityType: string;
  organizationType: string;
  actorType: ActorType;
  country: string;
  region: string;
  city: string;
  address: string;
  zipCode: string;
  latitude: number;
  longitude: number;
  description: string;
  comments: string;
  materials: string[];
  capabilities: string[];
  capacity: string;
  moq: string;
  leadTimeDays: number;
  certifications: string[];
  certificationDetails: CertificationDetail[];
  governance: string;
  traceabilityNotes: string;
  contacts: Contact[];
  confidenceScore: number;
  riskLevel: RiskLevel;
  evidenceCount: number;
  verifiedCertCount: number;
  expiredCertCount: number;
  missingDataCount: number;
  profileCompleteness: number;
  verificationStatus: VerificationStatus;
  preferredCommunicationChannel: "Email" | "Phone" | "Platform Message";
  kpiReadiness: number;
  traceabilityReadiness: number;
  matchmakingReadiness: number;
  missingFields: string[];
  recommendedNextAction: string;
}
