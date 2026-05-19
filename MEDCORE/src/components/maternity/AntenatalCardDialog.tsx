import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import type { Mother } from "./types";

interface Props {
  open: boolean;
  onClose: () => void;
  mother: Mother;
}

const previousIllnesses = [
  "Rheumatic Fever", "Cardiac Disease", "Kidney Disease", "Hypertension",
  "Tuberculosis", "Asthma", "Sexually Transmitted Diseases",
  "Sickle Cell Disease", "Epilepsy", "Diabetes",
];

const obgynHistory = [
  "Ectopic Pregnancy", "D and C", "Cesarean Section",
  "Vacuum Extraction", "Forceps Extraction", "Retained Placenta", "PPH",
];

const surgicalHistory = [
  "Operations", "Blood Transfusions", "Skeletal Deformity", "Pelvis Femur Features",
];

const familyHistoryItems = [
  "Diabetes", "Hypertension", "Sickle Cell Disease", "Epilepsy", "Twins",
];

const AntenatalCardDialog = ({ open, onClose, mother }: Props) => {
  const { toast } = useToast();

  const [personalDetails, setPersonalDetails] = useState({
    occupation: "", education: "", tribe: "", maritalStatus: "",
    nextOfKin: "", nokRelationship: "", nokOccupation: "", nokPhone: "",
    deliveryPlace: "", afterDeliveryPlace: "",
    gravida: mother.gravida, para: mother.para, abortions: mother.abortions,
    bloodGroup: mother.bloodGroup, rhesus: mother.rhesus,
  });

  const [prevIllness, setPrevIllness] = useState<Record<string, boolean>>({});
  const [obgyn, setObgyn] = useState<Record<string, boolean>>({});
  const [surgical, setSurgical] = useState<Record<string, boolean>>({});
  const [social, setSocial] = useState({ smoking: false, alcohol: false, husbandHealth: "" });
  const [family, setFamily] = useState<Record<string, boolean>>({});

  const [menstrual, setMenstrual] = useState({
    lengthOfMenses: "", amountOfFlow: "", familyPlanning: "", whyNoFP: "",
  });

  const [pregnancy, setPregnancy] = useState({
    lnmp: mother.lnmp, edd: "", gestationPeriod: "",
    hospitalized: "", bleeding: "", vomiting: "", fevers: "",
  });

  const [physical, setPhysical] = useState<Record<string, string>>({
    height: "", temperature: "", weight: "", pulse: "",
    oralThrush: "", teeth: "", neck: "", breasts: "", legs: "",
    deformities: "", lymphGlands: "", herpesZoster: "",
    nutritionalStatus: "", anaemia: "", eyes: "",
    mucousMembranes: "", nails: "", palms: "", heart: "", lungs: "",
  });

  const [pelvic, setPelvic] = useState({ vulva: "", vagina: "", cervix: "", moniliasis: "" });

  const handleSubmit = () => {
    toast({ title: "Antenatal details updated successfully!", description: `Saved for ${mother.name}` });
    onClose();
  };

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-sm font-heading font-semibold text-primary border-b border-border pb-1 mt-4 mb-2">{children}</h3>
  );

  const CheckboxGroup = ({ items, state, toggle }: { items: string[]; state: Record<string, boolean>; toggle: (k: string) => void }) => (
    <div className="grid grid-cols-2 gap-2">
      {items.map((item) => (
        <label key={item} className="flex items-center gap-2 text-sm cursor-pointer">
          <Checkbox checked={!!state[item]} onCheckedChange={() => toggle(item)} />
          {item}
        </label>
      ))}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="font-heading">Antenatal Card</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[75vh] px-4 pb-4">
          <div className="space-y-3">
            {/* Patient Info */}
            <SectionTitle>Patient Information</SectionTitle>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Name</Label><Input value={mother.name} readOnly className="bg-muted" /></div>
              <div><Label>Age</Label><Input value={String(mother.age)} readOnly className="bg-muted" /></div>
              <div><Label>Address</Label><Input value={mother.address} readOnly className="bg-muted" /></div>
              <div><Label>Religion</Label><Input value={mother.religion} readOnly className="bg-muted" /></div>
              <div className="col-span-2"><Label>Phone Number</Label><Input value={mother.phone} readOnly className="bg-muted" /></div>
            </div>

            {/* Other Personal Details */}
            <SectionTitle>Other Personal Details</SectionTitle>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: "occupation", label: "Occupation" },
                { key: "education", label: "Education" },
                { key: "tribe", label: "Tribe" },
              ].map(({ key, label }) => (
                <div key={key}>
                  <Label>{label}</Label>
                  <Input value={(personalDetails as any)[key]} onChange={(e) => setPersonalDetails({ ...personalDetails, [key]: e.target.value })} />
                </div>
              ))}
              <div>
                <Label>Marital Status</Label>
                <Select value={personalDetails.maritalStatus} onValueChange={(v) => setPersonalDetails({ ...personalDetails, maritalStatus: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {["Single", "Married", "Widow"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {[
                { key: "nextOfKin", label: "Next of Kin" },
                { key: "nokRelationship", label: "Relationship with Next of Kin" },
                { key: "nokOccupation", label: "Next of Kin's Occupation" },
                { key: "nokPhone", label: "Next of Kin's Phone Number" },
                { key: "deliveryPlace", label: "Where Will You Deliver" },
                { key: "afterDeliveryPlace", label: "Where Will You Go After Delivery" },
                { key: "gravida", label: "Gravida (Number of Pregnancies)" },
                { key: "para", label: "Para (Number of Live Births)" },
                { key: "abortions", label: "Abortions" },
              ].map(({ key, label }) => (
                <div key={key}>
                  <Label>{label}</Label>
                  <Input value={(personalDetails as any)[key]} onChange={(e) => setPersonalDetails({ ...personalDetails, [key]: e.target.value })} />
                </div>
              ))}
              <div>
                <Label>Blood Group</Label>
                <Select value={personalDetails.bloodGroup} onValueChange={(v) => setPersonalDetails({ ...personalDetails, bloodGroup: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {["A", "B", "AB", "O"].map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Rhesus Factor</Label>
                <Select value={personalDetails.rhesus} onValueChange={(v) => setPersonalDetails({ ...personalDetails, rhesus: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Positive">Positive</SelectItem>
                    <SelectItem value="Negative">Negative</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Previous Illness */}
            <SectionTitle>Previous Illness</SectionTitle>
            <CheckboxGroup items={previousIllnesses} state={prevIllness} toggle={(k) => setPrevIllness({ ...prevIllness, [k]: !prevIllness[k] })} />

            {/* OB/GYN History */}
            <SectionTitle>OB/GYN History</SectionTitle>
            <CheckboxGroup items={obgynHistory} state={obgyn} toggle={(k) => setObgyn({ ...obgyn, [k]: !obgyn[k] })} />

            {/* Surgical History */}
            <SectionTitle>Surgical History</SectionTitle>
            <CheckboxGroup items={surgicalHistory} state={surgical} toggle={(k) => setSurgical({ ...surgical, [k]: !surgical[k] })} />

            {/* Social History */}
            <SectionTitle>Social History</SectionTitle>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm"><Checkbox checked={social.smoking} onCheckedChange={() => setSocial({ ...social, smoking: !social.smoking })} /> Smoking</label>
              <label className="flex items-center gap-2 text-sm"><Checkbox checked={social.alcohol} onCheckedChange={() => setSocial({ ...social, alcohol: !social.alcohol })} /> Alcohol</label>
              <div><Label>Health of Husband</Label><Input value={social.husbandHealth} onChange={(e) => setSocial({ ...social, husbandHealth: e.target.value })} /></div>
            </div>

            {/* Family History */}
            <SectionTitle>Family History</SectionTitle>
            <CheckboxGroup items={familyHistoryItems} state={family} toggle={(k) => setFamily({ ...family, [k]: !family[k] })} />

            {/* Menstrual & Contraceptive */}
            <SectionTitle>Menstrual and Contraceptive History</SectionTitle>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Length of Menses (Days)</Label><Input value={menstrual.lengthOfMenses} onChange={(e) => setMenstrual({ ...menstrual, lengthOfMenses: e.target.value })} /></div>
              <div>
                <Label>Amount of Flow</Label>
                <Select value={menstrual.amountOfFlow} onValueChange={(v) => setMenstrual({ ...menstrual, amountOfFlow: v })}>
                  <SelectTrigger><SelectValue placeholder="Select Amount of Flow" /></SelectTrigger>
                  <SelectContent>
                    {["No Menses At All", "Normal", "Mild", "Moderate", "Heavy"].map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Any Family Planning Ever Used</Label><Input value={menstrual.familyPlanning} onChange={(e) => setMenstrual({ ...menstrual, familyPlanning: e.target.value })} /></div>
              <div><Label>If Never Used, Describe Why</Label><Input value={menstrual.whyNoFP} onChange={(e) => setMenstrual({ ...menstrual, whyNoFP: e.target.value })} /></div>
            </div>

            {/* Present Pregnancy */}
            <SectionTitle>Present Pregnancy</SectionTitle>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>First Day of LNMP</Label><Input type="date" value={pregnancy.lnmp} onChange={(e) => setPregnancy({ ...pregnancy, lnmp: e.target.value })} /></div>
              <div><Label>EDD</Label><Input type="date" value={pregnancy.edd} onChange={(e) => setPregnancy({ ...pregnancy, edd: e.target.value })} /></div>
              <div><Label>Period of Gestation</Label><Input value={pregnancy.gestationPeriod} onChange={(e) => setPregnancy({ ...pregnancy, gestationPeriod: e.target.value })} /></div>
              <div><Label>Hospitalized? (details)</Label><Input value={pregnancy.hospitalized} onChange={(e) => setPregnancy({ ...pregnancy, hospitalized: e.target.value })} /></div>
              <div><Label>Any Bleeding</Label><Input value={pregnancy.bleeding} onChange={(e) => setPregnancy({ ...pregnancy, bleeding: e.target.value })} /></div>
              <div><Label>Any Vomiting</Label><Input value={pregnancy.vomiting} onChange={(e) => setPregnancy({ ...pregnancy, vomiting: e.target.value })} /></div>
              <div className="col-span-2"><Label>Fevers, Cough, Flu, Weight Loss, or Other Disease</Label><Input value={pregnancy.fevers} onChange={(e) => setPregnancy({ ...pregnancy, fevers: e.target.value })} /></div>
            </div>

            {/* Physical Examination */}
            <SectionTitle>Physical Examination</SectionTitle>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.keys(physical).map((key) => (
                <div key={key}>
                  <Label className="capitalize">{key.replace(/([A-Z])/g, " $1")}</Label>
                  <Input value={physical[key]} onChange={(e) => setPhysical({ ...physical, [key]: e.target.value })} />
                </div>
              ))}
            </div>

            {/* Pelvic Examination */}
            <SectionTitle>Pelvic Examination</SectionTitle>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(pelvic).map(([key, val]) => (
                <div key={key}>
                  <Label className="capitalize">{key}</Label>
                  <Input value={val} onChange={(e) => setPelvic({ ...pelvic, [key]: e.target.value })} />
                </div>
              ))}
            </div>

            <div className="flex gap-2 justify-end pt-4 pb-2">
              <Button variant="outline" onClick={onClose}>Close</Button>
              <Button onClick={handleSubmit}>Submit Antenatal Details</Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default AntenatalCardDialog;
