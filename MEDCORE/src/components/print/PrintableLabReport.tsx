import { forwardRef } from "react";
import PrintableClinicHeader from "./PrintableClinicHeader";
import PrintedByFooter from "./PrintedByFooter";
import { format } from "date-fns";

export type LabInterpretation = "positive" | "negative" | "low" | "relatively_low" | "normal" | "relatively_high" | "high";

export const INTERPRETATION_LABELS: Record<LabInterpretation, { label: string; color: string }> = {
  positive: { label: "POSITIVE", color: "#dc2626" },
  negative: { label: "NEGATIVE", color: "#15803d" },
  low: { label: "LOW", color: "#dc2626" },
  relatively_low: { label: "RELATIVELY LOW", color: "#ea580c" },
  normal: { label: "NORMAL", color: "#15803d" },
  relatively_high: { label: "RELATIVELY HIGH", color: "#ea580c" },
  high: { label: "HIGH", color: "#dc2626" },
};

// Qualitative tests where positive/negative applies (presence/absence in sample)
export const QUALITATIVE_TESTS = [
  "Malaria RDT", "HIV Test", "Hepatitis B", "Pregnancy Test",
  "Widal Test", "Hepatitis C", "Syphilis (VDRL/RPR)", "COVID-19 RDT",
  "TB (Gene Xpert)", "H. Pylori Antigen",
];

export function isQualitativeTest(testName: string): boolean {
  return QUALITATIVE_TESTS.some(q => testName.toLowerCase().includes(q.toLowerCase()));
}

interface PrintableLabReportProps {
  patientName: string;
  patientAge?: number;
  patientGender?: string;
  testName: string;
  category: string;
  result: string | null;
  normalRange: string | null;
  interpretation: LabInterpretation;
  notes: string | null;
  orderedDate: string;
  completedDate: string | null;
}

const PrintableLabReport = forwardRef<HTMLDivElement, PrintableLabReportProps>(
  ({ patientName, patientAge, patientGender, testName, category, result, normalRange, interpretation, notes, orderedDate, completedDate }, ref) => {
    const interpInfo = INTERPRETATION_LABELS[interpretation] || INTERPRETATION_LABELS.normal;

    return (
      <div
        ref={ref}
        id="lab-print-area"
        className="bg-white text-black p-10 font-sans"
        style={{ width: "210mm", minHeight: "297mm", maxWidth: "210mm" }}
      >
        <PrintableClinicHeader />

        <h1 className="text-center text-lg font-bold uppercase tracking-widest mt-4 mb-6 border-b-2 border-black pb-2">
          Laboratory Report
        </h1>

        {/* Patient Info */}
        <table className="w-full text-sm mb-6" style={{ borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td className="font-semibold py-1 pr-4 w-40">Patient Name:</td>
              <td className="py-1">{patientName}</td>
              <td className="font-semibold py-1 pr-4 w-24">Gender:</td>
              <td className="py-1">{patientGender || "—"}</td>
            </tr>
            <tr>
              <td className="font-semibold py-1 pr-4">Age:</td>
              <td className="py-1">{patientAge ? `${patientAge} years` : "—"}</td>
              <td className="font-semibold py-1 pr-4">Date Ordered:</td>
              <td className="py-1">{format(new Date(orderedDate), "dd/MM/yyyy HH:mm")}</td>
            </tr>
            <tr>
              <td className="font-semibold py-1 pr-4">Date Completed:</td>
              <td className="py-1" colSpan={3}>
                {completedDate ? format(new Date(completedDate), "dd/MM/yyyy HH:mm") : "Pending"}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Test Details */}
        <table className="w-full text-sm border border-gray-400 mb-6" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-400 px-3 py-2 text-left font-semibold">Test Name</th>
              <th className="border border-gray-400 px-3 py-2 text-left font-semibold">Category</th>
              <th className="border border-gray-400 px-3 py-2 text-left font-semibold">Result</th>
              <th className="border border-gray-400 px-3 py-2 text-left font-semibold">Reference Range</th>
              <th className="border border-gray-400 px-3 py-2 text-center font-semibold">Interpretation</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-400 px-3 py-2">{testName}</td>
              <td className="border border-gray-400 px-3 py-2">{category}</td>
              <td className="border border-gray-400 px-3 py-2 font-medium">{result || "—"}</td>
              <td className="border border-gray-400 px-3 py-2 text-gray-600">{normalRange || "—"}</td>
              <td className="border border-gray-400 px-3 py-2 text-center font-bold">
                <span style={{ color: interpInfo.color }}>{interpInfo.label}</span>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Reference Note */}
        <p className="text-[10px] text-gray-500 mb-4 italic">
          Reference ranges based on WHO and Uganda Clinical Guidelines (UCG) standards.
        </p>

        {/* Notes */}
        {notes && (
          <div className="mb-6">
            <p className="font-semibold text-sm mb-1">Clinical Notes:</p>
            <p className="text-sm text-gray-700 border border-gray-300 rounded p-3 bg-gray-50">{notes}</p>
          </div>
        )}

        {/* Signature — Lab Technician only */}
        <div className="flex justify-start mt-16 text-sm">
          <div className="text-center">
            <div className="border-b border-black w-48 mb-1" />
            <p className="font-semibold">Lab Technician</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-10">
          <PrintedByFooter />
        </div>
      </div>
    );
  }
);

PrintableLabReport.displayName = "PrintableLabReport";
export default PrintableLabReport;
