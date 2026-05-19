import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { Mother } from "./types";

interface Props {
  open: boolean;
  onClose: () => void;
  mother: Mother;
}

const deliveryTypes = [
  "Spontaneous Vaginal Delivery (SVD)",
  "Cesarean Section (C/S)",
  "Vacuum Extraction",
  "Forceps Delivery",
  "Breech Delivery",
  "Water Birth",
];

const complications = [
  "Post-Partum Hemorrhage (PPH)",
  "Perineal Tear (1st Degree)",
  "Perineal Tear (2nd Degree)",
  "Perineal Tear (3rd/4th Degree)",
  "Episiotomy",
  "Retained Placenta",
  "Cord Prolapse",
  "Shoulder Dystocia",
  "Uterine Rupture",
  "Eclampsia",
  "Maternal Fever/Infection",
  "None",
];

const LabourOutcomesDialog = ({ open, onClose, mother }: Props) => {
  const { toast } = useToast();

  const [delivery, setDelivery] = useState({
    type: "",
    dateOfDelivery: "",
    timeOfDelivery: "",
    durationFirstStage: "",
    durationSecondStage: "",
    durationThirdStage: "",
    placentaComplete: "",
    bloodLoss: "",
    deliveredBy: "",
  });

  const [baby, setBaby] = useState({
    sex: "",
    birthWeight: "",
    length: "",
    headCircumference: "",
    chestCircumference: "",
    condition: "",
    cried: "",
    resuscitation: "",
    breastfeedingInitiated: "",
    vitaminKGiven: "",
    bcgGiven: "",
    opv0Given: "",
  });

  const [apgar, setApgar] = useState({
    oneMin: { heartRate: "", respiration: "", muscleTone: "", reflexResponse: "", color: "" },
    fiveMin: { heartRate: "", respiration: "", muscleTone: "", reflexResponse: "", color: "" },
    tenMin: { heartRate: "", respiration: "", muscleTone: "", reflexResponse: "", color: "" },
  });

  const [selectedComplications, setSelectedComplications] = useState<Record<string, boolean>>({});

  const [discharge, setDischarge] = useState({
    motherCondition: "",
    babyCondition: "",
    dateOfDischarge: "",
    adviceGiven: "",
    followUpDate: "",
    dischargedBy: "",
    remarks: "",
  });

  const getApgarTotal = (scores: Record<string, string>) =>
    Object.values(scores).reduce((sum, v) => sum + (parseInt(v) || 0), 0);

  const handleSubmit = () => {
    toast({ title: "Labour outcomes saved", description: `Saved for ${mother.name}` });
    onClose();
  };

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-sm font-heading font-semibold text-primary border-b border-border pb-1 mt-4 mb-2">{children}</h3>
  );

  const ApgarRow = ({
    label,
    scores,
    onChange,
  }: {
    label: string;
    scores: Record<string, string>;
    onChange: (key: string, value: string) => void;
  }) => (
    <div className="grid grid-cols-6 gap-2 items-center">
      <span className="text-xs font-medium text-muted-foreground col-span-1">{label}</span>
      {["heartRate", "respiration", "muscleTone", "reflexResponse", "color"].map((key) => (
        <Select key={key} value={scores[key]} onValueChange={(v) => onChange(key, v)}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="0-2" />
          </SelectTrigger>
          <SelectContent>
            {["0", "1", "2"].map((n) => (
              <SelectItem key={n} value={n}>{n}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="font-heading">🤰 Labour Outcomes — {mother.name}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[75vh] px-4 pb-4">
          <div className="space-y-3">
            {/* Delivery Details */}
            <SectionTitle>Delivery Details</SectionTitle>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Delivery Type</Label>
                <Select value={delivery.type} onValueChange={(v) => setDelivery({ ...delivery, type: v })}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {deliveryTypes.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Date of Delivery</Label>
                <Input type="date" value={delivery.dateOfDelivery} onChange={(e) => setDelivery({ ...delivery, dateOfDelivery: e.target.value })} />
              </div>
              <div>
                <Label>Time of Delivery</Label>
                <Input type="time" value={delivery.timeOfDelivery} onChange={(e) => setDelivery({ ...delivery, timeOfDelivery: e.target.value })} />
              </div>
              <div>
                <Label>Estimated Blood Loss (ml)</Label>
                <Input value={delivery.bloodLoss} onChange={(e) => setDelivery({ ...delivery, bloodLoss: e.target.value })} placeholder="e.g. 300" />
              </div>
              <div>
                <Label>Duration 1st Stage</Label>
                <Input value={delivery.durationFirstStage} onChange={(e) => setDelivery({ ...delivery, durationFirstStage: e.target.value })} placeholder="e.g. 8 hrs" />
              </div>
              <div>
                <Label>Duration 2nd Stage</Label>
                <Input value={delivery.durationSecondStage} onChange={(e) => setDelivery({ ...delivery, durationSecondStage: e.target.value })} placeholder="e.g. 45 min" />
              </div>
              <div>
                <Label>Duration 3rd Stage</Label>
                <Input value={delivery.durationThirdStage} onChange={(e) => setDelivery({ ...delivery, durationThirdStage: e.target.value })} placeholder="e.g. 10 min" />
              </div>
              <div>
                <Label>Placenta Complete?</Label>
                <Select value={delivery.placentaComplete} onValueChange={(v) => setDelivery({ ...delivery, placentaComplete: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label>Delivered By</Label>
                <Input value={delivery.deliveredBy} onChange={(e) => setDelivery({ ...delivery, deliveredBy: e.target.value })} placeholder="Name of midwife / doctor" />
              </div>
            </div>

            {/* Baby Details */}
            <SectionTitle>Baby Details</SectionTitle>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Sex</Label>
                <Select value={baby.sex} onValueChange={(v) => setBaby({ ...baby, sex: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Ambiguous">Ambiguous</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Birth Weight (kg)</Label>
                <Input value={baby.birthWeight} onChange={(e) => setBaby({ ...baby, birthWeight: e.target.value })} placeholder="e.g. 3.2" />
              </div>
              <div>
                <Label>Length (cm)</Label>
                <Input value={baby.length} onChange={(e) => setBaby({ ...baby, length: e.target.value })} placeholder="e.g. 50" />
              </div>
              <div>
                <Label>Head Circumference (cm)</Label>
                <Input value={baby.headCircumference} onChange={(e) => setBaby({ ...baby, headCircumference: e.target.value })} placeholder="e.g. 35" />
              </div>
              <div>
                <Label>Chest Circumference (cm)</Label>
                <Input value={baby.chestCircumference} onChange={(e) => setBaby({ ...baby, chestCircumference: e.target.value })} placeholder="e.g. 33" />
              </div>
              <div>
                <Label>Condition at Birth</Label>
                <Select value={baby.condition} onValueChange={(v) => setBaby({ ...baby, condition: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Alive & Well">Alive & Well</SelectItem>
                    <SelectItem value="Alive - Needs Resuscitation">Alive - Needs Resuscitation</SelectItem>
                    <SelectItem value="Fresh Stillbirth">Fresh Stillbirth</SelectItem>
                    <SelectItem value="Macerated Stillbirth">Macerated Stillbirth</SelectItem>
                    <SelectItem value="Neonatal Death">Neonatal Death</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Baby Cried at Birth?</Label>
                <Select value={baby.cried} onValueChange={(v) => setBaby({ ...baby, cried: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Immediately">Immediately</SelectItem>
                    <SelectItem value="After Stimulation">After Stimulation</SelectItem>
                    <SelectItem value="After Resuscitation">After Resuscitation</SelectItem>
                    <SelectItem value="Did Not Cry">Did Not Cry</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Resuscitation Done?</Label>
                <Select value={baby.resuscitation} onValueChange={(v) => setBaby({ ...baby, resuscitation: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Not Needed">Not Needed</SelectItem>
                    <SelectItem value="Suction Only">Suction Only</SelectItem>
                    <SelectItem value="Bag & Mask">Bag & Mask</SelectItem>
                    <SelectItem value="Full Resuscitation">Full Resuscitation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Breastfeeding Initiated?</Label>
                <Select value={baby.breastfeedingInitiated} onValueChange={(v) => setBaby({ ...baby, breastfeedingInitiated: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Within 1 Hour">Within 1 Hour</SelectItem>
                    <SelectItem value="After 1 Hour">After 1 Hour</SelectItem>
                    <SelectItem value="Not Initiated">Not Initiated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Vitamin K Given?</Label>
                <Select value={baby.vitaminKGiven} onValueChange={(v) => setBaby({ ...baby, vitaminKGiven: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>BCG Given?</Label>
                <Select value={baby.bcgGiven} onValueChange={(v) => setBaby({ ...baby, bcgGiven: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>OPV-0 Given?</Label>
                <Select value={baby.opv0Given} onValueChange={(v) => setBaby({ ...baby, opv0Given: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* APGAR Scores */}
            <SectionTitle>APGAR Scores</SectionTitle>
            <Card>
              <CardContent className="p-3 space-y-2">
                <div className="grid grid-cols-6 gap-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                  <span />
                  <span>Heart Rate</span>
                  <span>Respiration</span>
                  <span>Muscle Tone</span>
                  <span>Reflex</span>
                  <span>Color</span>
                </div>
                <ApgarRow
                  label="1 min"
                  scores={apgar.oneMin}
                  onChange={(k, v) => setApgar({ ...apgar, oneMin: { ...apgar.oneMin, [k]: v } })}
                />
                <ApgarRow
                  label="5 min"
                  scores={apgar.fiveMin}
                  onChange={(k, v) => setApgar({ ...apgar, fiveMin: { ...apgar.fiveMin, [k]: v } })}
                />
                <ApgarRow
                  label="10 min"
                  scores={apgar.tenMin}
                  onChange={(k, v) => setApgar({ ...apgar, tenMin: { ...apgar.tenMin, [k]: v } })}
                />
                <div className="grid grid-cols-3 gap-4 pt-2 border-t border-border mt-2">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">1 min total</p>
                    <p className="text-lg font-heading font-bold text-foreground">{getApgarTotal(apgar.oneMin)}/10</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">5 min total</p>
                    <p className="text-lg font-heading font-bold text-foreground">{getApgarTotal(apgar.fiveMin)}/10</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">10 min total</p>
                    <p className="text-lg font-heading font-bold text-foreground">{getApgarTotal(apgar.tenMin)}/10</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Complications */}
            <SectionTitle>Complications</SectionTitle>
            <div className="grid grid-cols-2 gap-2">
              {complications.map((c) => (
                <label key={c} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={!!selectedComplications[c]}
                    onCheckedChange={() => setSelectedComplications({ ...selectedComplications, [c]: !selectedComplications[c] })}
                  />
                  {c}
                </label>
              ))}
            </div>

            {/* Discharge Summary */}
            <SectionTitle>Discharge Summary</SectionTitle>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Mother's Condition at Discharge</Label>
                <Select value={discharge.motherCondition} onValueChange={(v) => setDischarge({ ...discharge, motherCondition: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Good">Good</SelectItem>
                    <SelectItem value="Fair">Fair</SelectItem>
                    <SelectItem value="Poor">Poor</SelectItem>
                    <SelectItem value="Referred">Referred</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Baby's Condition at Discharge</Label>
                <Select value={discharge.babyCondition} onValueChange={(v) => setDischarge({ ...discharge, babyCondition: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Good">Good</SelectItem>
                    <SelectItem value="Fair">Fair</SelectItem>
                    <SelectItem value="Poor">Poor</SelectItem>
                    <SelectItem value="NICU Admission">NICU Admission</SelectItem>
                    <SelectItem value="Referred">Referred</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Date of Discharge</Label>
                <Input type="date" value={discharge.dateOfDischarge} onChange={(e) => setDischarge({ ...discharge, dateOfDischarge: e.target.value })} />
              </div>
              <div>
                <Label>Follow-Up Date</Label>
                <Input type="date" value={discharge.followUpDate} onChange={(e) => setDischarge({ ...discharge, followUpDate: e.target.value })} />
              </div>
              <div className="col-span-2">
                <Label>Advice Given</Label>
                <textarea
                  className="w-full min-h-[50px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Post-delivery care advice, family planning counseling..."
                  value={discharge.adviceGiven}
                  onChange={(e) => setDischarge({ ...discharge, adviceGiven: e.target.value })}
                />
              </div>
              <div>
                <Label>Discharged By</Label>
                <Input value={discharge.dischargedBy} onChange={(e) => setDischarge({ ...discharge, dischargedBy: e.target.value })} placeholder="Name" />
              </div>
              <div>
                <Label>Remarks</Label>
                <Input value={discharge.remarks} onChange={(e) => setDischarge({ ...discharge, remarks: e.target.value })} />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4 pb-2">
              <Button variant="outline" onClick={onClose}>Close</Button>
              <Button onClick={handleSubmit}>Submit Labour Outcomes</Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default LabourOutcomesDialog;
