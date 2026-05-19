import { forwardRef } from "react";
import PrintedByFooter from "@/components/print/PrintedByFooter";
import PrintableClinicHeader from "@/components/print/PrintableClinicHeader";

interface ReceiptItem {
  drug_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface PharmacyReceiptProps {
  receiptNumber: string;
  patientName: string;
  items: ReceiptItem[];
  totalAmount: number;
  paymentMethod: string;
  date: string;
  soldBy?: string;
}

const PharmacyReceipt = forwardRef<HTMLDivElement, PharmacyReceiptProps>(
  ({ receiptNumber, patientName, items, totalAmount, paymentMethod, date, soldBy }, ref) => {
    return (
      <div
        ref={ref}
        className="bg-white text-black p-4 font-mono text-[11px] leading-tight"
        style={{ width: "302px" }}
      >
        <PrintableClinicHeader />

        {/* ── Receipt Info ── */}
        <div className="mb-3">
          <div className="flex justify-between">
            <span>Receipt #:</span>
            <span className="font-bold">{receiptNumber}</span>
          </div>
          <div className="flex justify-between">
            <span>Date:</span>
            <span>{new Date(date).toLocaleDateString("en-UG", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
          </div>
          <div className="flex justify-between">
            <span>Customer:</span>
            <span>{patientName}</span>
          </div>
          <div className="flex justify-between">
            <span>Payment:</span>
            <span>{paymentMethod}</span>
          </div>
        </div>

        {/* ── Items ── */}
        <div className="border-t border-b border-dashed border-gray-400 py-2 mb-2">
          <div className="flex justify-between font-bold mb-1">
            <span className="flex-1">Item</span>
            <span className="w-8 text-center">Qty</span>
            <span className="w-16 text-right">Price</span>
            <span className="w-16 text-right">Total</span>
          </div>
          {items.map((item, idx) => (
            <div key={idx} className="flex justify-between">
              <span className="flex-1 truncate pr-1">{item.drug_name}</span>
              <span className="w-8 text-center">{item.quantity}</span>
              <span className="w-16 text-right">{Number(item.unit_price).toLocaleString()}</span>
              <span className="w-16 text-right">{Number(item.total_price).toLocaleString()}</span>
            </div>
          ))}
        </div>

        {/* ── Total ── */}
        <div className="flex justify-between font-bold text-sm mb-3 border-b border-dashed border-gray-400 pb-2">
          <span>TOTAL (UGX):</span>
          <span>{Number(totalAmount).toLocaleString()}</span>
        </div>

        {/* ── System Footer ── */}
        <div className="text-center text-[9px] text-gray-500 space-y-0.5">
          {soldBy && <p>Served by: {soldBy}</p>}
          <p className="mt-1 font-bold text-gray-700">Thank you for your patronage!</p>
          <PrintedByFooter />
        </div>
      </div>
    );
  }
);

PharmacyReceipt.displayName = "PharmacyReceipt";
export default PharmacyReceipt;
