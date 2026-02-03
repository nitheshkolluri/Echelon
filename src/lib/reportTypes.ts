export interface SWOTData {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface FinalReportData {
  feasibilityScore: number;
  verdict: string;
  summary: string;
  comparison: Array<{ attribute: string; user: number; leader: number }>;
  positioningMap?: any[];
  successDrivers: Array<{ factor: string; score: number }>;
  headToHead?: any;
  swot: SWOTData;
  recommendation: string;
}