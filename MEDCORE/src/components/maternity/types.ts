export interface Mother {
  id: string;
  name: string;
  age: number;
  phone: string;
  edd: string;
  status: "Just Come" | "On Antenatal" | "Post Natal" | "In Labour" | "Discharged";
  address: string;
  religion: string;
  gravida: string;
  para: string;
  abortions: string;
  bloodGroup: string;
  rhesus: string;
  lnmp: string;
}

export interface ObstetricEntry {
  id: string;
  pregnancy: string;
  year: string;
  abortionsBelow12: string;
  abortionsAbove12: string;
  preMature: string;
  fullTerm: string;
  thirdStage: string;
  purePerium: string;
  aliveSBNND: string;
  sex: string;
  birthWeight: string;
  immunization: string;
  healthConditions: string;
}

export interface AntenatalProgressEntry {
  id: string;
  date: string;
  weeksAmenorrhoea: string;
  fundalHeight: string;
  presentation: string;
  positionHe: string;
  relationPPBrim: string;
  foetalHeart: string;
  weight: string;
  hp: string;
  varienceOedema: string;
  urine: string;
  ttip: string;
  netUse: string;
  complaints: string;
  returnDate: string;
  examinerName: string;
}

export interface FHREntry { id: string; time: string; rate: string; }
export interface VEEntry { id: string; time: string; dilation: string; descent: string; }
export interface ContractionEntry { id: string; time: string; frequency: string; duration: string; strength: string; }
export interface VitalsEntry { id: string; time: string; bp: string; pulse: string; temp: string; }
export interface UrineEntry { id: string; time: string; volume: string; protein: string; acetone: string; }
