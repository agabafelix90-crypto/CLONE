import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Mother } from "./types";

interface Props {
  open: boolean;
  onClose: () => void;
  onAdd: (mother: Mother) => void;
}

const AddMotherDialog = ({ open, onClose, onAdd }: Props) => {
  const [form, setForm] = useState({ name: "", age: "", phone: "", address: "", religion: "" });

  const handleSubmit = () => {
    if (!form.name.trim() || !form.age.trim()) return;
    const mother: Mother = {
      id: `M-${Date.now()}`,
      name: form.name.trim().toUpperCase(),
      age: parseInt(form.age) || 0,
      phone: form.phone.trim(),
      edd: "Not yet on ANC",
      status: "Just Come",
      address: form.address.trim(),
      religion: form.religion,
      gravida: "", para: "", abortions: "", bloodGroup: "", rhesus: "", lnmp: "",
    };
    onAdd(mother);
    setForm({ name: "", age: "", phone: "", address: "", religion: "" });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Add New Mother</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Full Name *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. MULUGI IMMACULATE" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Age *</Label>
              <Input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} placeholder="26" />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="07XXXXXXXX" />
            </div>
          </div>
          <div>
            <Label>Address</Label>
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div>
            <Label>Religion</Label>
            <Select value={form.religion} onValueChange={(v) => setForm({ ...form, religion: v })}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {["Christian", "Muslim", "Hindu", "Other"].map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!form.name.trim() || !form.age.trim()}>Add Mother</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddMotherDialog;
