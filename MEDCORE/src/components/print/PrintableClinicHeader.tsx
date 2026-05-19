const PrintableClinicHeader = () => {
  const clinicName = "My Clinic";
  const clinicPhone = "";
  const clinicLocation = "";

  return (
    <div className="text-center border-b border-dashed border-gray-400 pb-3 mb-3">
      <p className="font-bold text-sm">{clinicName}</p>
      {clinicLocation && <p className="text-[10px] text-gray-600">{clinicLocation}</p>}
      {clinicPhone && <p className="text-[10px] text-gray-600">Tel: {clinicPhone}</p>}
    </div>
  );
};

export default PrintableClinicHeader;
