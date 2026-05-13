// InvoiceModal.js (updated version)
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faPrint, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { urls } from './config.dev';

const InvoiceModal = ({ invoiceData, onClose, clinicName, district, town, ownersContact, token }) => {
  const [enhancedInvoiceData, setEnhancedInvoiceData] = useState(invoiceData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (invoiceData && invoiceData.contactId) {
      const fetchEnhancedInvoiceData = async () => {
        try {
          setLoading(true);
          const response = await fetch(urls.fetchinvoicedata, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              contactId: invoiceData.contactId,
              token: invoiceData.token,
            }),
          });

          const responseData = await response.json();

          if (response.ok) {
            setEnhancedInvoiceData({ ...invoiceData, ...responseData });
            setError(null);
            
            // Set the first file as active tab if available
            if (responseData.data && responseData.data.length > 0) {
              setActiveTab(`file-${responseData.data[0].file_id}`);
            }
          } else {
            setError(responseData.message || 'Failed to fetch enhanced invoice data');
            setEnhancedInvoiceData(invoiceData);
          }
        } catch (err) {
          setError(err.message || 'An error occurred while fetching enhanced data');
          setEnhancedInvoiceData(invoiceData);
        } finally {
          setLoading(false);
        }
      };

      fetchEnhancedInvoiceData();
    } else {
      setEnhancedInvoiceData(invoiceData);
    }
  }, [invoiceData, token]);

  // Calculate totals for different sections
  const calculateSectionTotals = (data) => {
    // Consultation
    const consultationPaid = data.consultation?.paid || 0;
    const consultationUnpaid = data.consultation?.unpaid || 0;
    const consultationTotal = consultationPaid + consultationUnpaid;

    // Lab Investigations
    const labPaid = data.lab_investigations?.paid?.reduce((sum, item) => sum + (parseFloat(item.amount_paid) || 0), 0) || 0;
    const labUnpaid = data.lab_investigations?.unpaid?.reduce((sum, item) => sum + (parseFloat(item.amount_paid) || 0), 0) || 0;
    const labTotal = labPaid + labUnpaid;

    // Radiology Investigations
    const radiologyPaid = data.radiology_investigations?.paid?.reduce((sum, item) => sum + (parseFloat(item.amount_paid) || 0), 0) || 0;
    const radiologyUnpaid = data.radiology_investigations?.unpaid?.reduce((sum, item) => sum + (parseFloat(item.amount_paid) || 0), 0) || 0;
    const radiologyTotal = radiologyPaid + radiologyUnpaid;

    // Services
// Services
const servicesPaid = data.services?.paid?.reduce((sum, item) => sum + (parseFloat(item.amount_paid_sofar) || 0), 0) || 0;
// For unpaid services, we need to add up the amount_paid_sofar to get total paid so far
const servicesUnpaidPaidAmount = data.services?.unpaid?.reduce((sum, item) => sum + (parseFloat(item.amount_paid_sofar) || 0), 0) || 0;
const servicesUnpaidBalance = data.services?.unpaid?.reduce((sum, item) => sum + (parseFloat(item.balance) || 0), 0) || 0;

// Total paid for services = paid services + partial payments on unpaid services
const totalServicesPaid = servicesPaid + servicesUnpaidPaidAmount;
// Total unpaid for services = remaining balance on unpaid services
const totalServicesUnpaid = servicesUnpaidBalance;
const servicesTotal = totalServicesPaid + totalServicesUnpaid;

    // Treatment
    const treatmentPaid = data.treatment?.amount_paid || 0;
    const treatmentUnpaid = data.treatment?.balance || 0;
    const treatmentTotal = treatmentPaid + treatmentUnpaid;

    // Overall totals
    // Update this line in the overall totals calculation:
    const totalPaid = consultationPaid + labPaid + radiologyPaid + totalServicesPaid + treatmentPaid;
  const totalUnpaid = consultationUnpaid + labUnpaid + radiologyUnpaid + totalServicesUnpaid + treatmentUnpaid;
    const overallTotal = totalPaid + totalUnpaid;

      const unspecifiedAmount = parseFloat(unspecifiedFiles.replace('ugx', '').trim()) || 0;

 return {
  consultation: { paid: consultationPaid, unpaid: consultationUnpaid, total: consultationTotal },
  lab: { paid: labPaid, unpaid: labUnpaid, total: labTotal },
  radiology: { paid: radiologyPaid, unpaid: radiologyUnpaid, total: radiologyTotal },
  services: { paid: totalServicesPaid, unpaid: totalServicesUnpaid, total: servicesTotal },
  treatment: { paid: treatmentPaid, unpaid: treatmentUnpaid, total: treatmentTotal },
  overall: { paid: totalPaid, unpaid: totalUnpaid, total: overallTotal },
  unspecified: { unpaid: unspecifiedAmount },
};
  };

  const handlePrint = async () => {
    setLoading(true);
    try {
      const response = await fetch(urls.printinvoice, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...(enhancedInvoiceData || invoiceData),
          token: invoiceData.token,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
      } else {
        throw new Error('Failed to generate printable invoice');
      }
    } catch (error) {
      console.error('Error printing invoice:', error);
      alert('Error generating printable invoice. Please check the console for details.');
    } finally {
      setLoading(false);
    }
  };

  if (!invoiceData) return null;

  // Extract data for multiple file IDs
  const dataItems = enhancedInvoiceData?.data || invoiceData.data || [];
 const unspecifiedFiles = enhancedInvoiceData?.unspecified_files ?? invoiceData.unspecified_files ?? "0 ugx";
const globalUnpaidServices = enhancedInvoiceData?.global_unpaid_services ?? invoiceData.global_unpaid_services ?? [];
const globalUnpaidFamilyPlanning = enhancedInvoiceData?.global_unpaid_family_planning ?? invoiceData.global_unpaid_family_planning ?? [];
  
  // Check if we have unspecified files to show
  const hasUnspecifiedFiles = unspecifiedFiles !== "0 ugx";
  
  // Check if we have global services to show
  const hasGlobalServices = globalUnpaidServices.length > 0 || globalUnpaidFamilyPlanning.length > 0;
// Add these helper functions after the calculateSectionTotals function
const hasConsultationData = (data) => {
  return data.consultation?.details && data.consultation.details.length > 0;
};

const hasLabData = (data) => {
  return (data.lab_investigations?.paid && data.lab_investigations.paid.length > 0) ||
         (data.lab_investigations?.unpaid && data.lab_investigations.unpaid.length > 0);
};

const hasRadiologyData = (data) => {
  return (data.radiology_investigations?.paid && data.radiology_investigations.paid.length > 0) ||
         (data.radiology_investigations?.unpaid && data.radiology_investigations.unpaid.length > 0);
};

const hasServicesData = (data) => {
  return (data.services?.paid && data.services.paid.length > 0) ||
         (data.services?.unpaid && data.services.unpaid.length > 0);
};

const hasTreatmentData = (data) => {
  return data.treatment?.details && data.treatment.details.length > 0;
};

const hasOtherCharges = (data) => {
  return data.other_charges > 0;
};
  // Render tab content based on active tab
const renderTabContent = () => {
  if (activeTab === 'all') {
    return (
      <>
        {dataItems.map((data, fileIndex) => renderFileContent(data, fileIndex))}
        {hasUnspecifiedFiles && renderUnspecifiedFiles()}
      </>
    );
  } 
    else if (activeTab === 'other-services') {
      return renderOtherServices();
    }
    else if (activeTab === 'unspecified') {
      return renderUnspecifiedFiles();
    }
    else {
      // Find the specific file to display
      const fileId = activeTab.replace('file-', '');
      const fileData = dataItems.find(item => item.file_id == fileId);
      return fileData ? renderFileContent(fileData, 0) : <div>File not found</div>;
    }
  };
const renderFileContent = (data, fileIndex) => {
  const totals = calculateSectionTotals(data);

  return (
    <div key={data.file_id || fileIndex} className="file-section">
      <div className="file-header">
        <h3>File ID: {data?.file_id || 'N/A'}</h3>
        <span
          className={`file-status ${
            totals.overall.unpaid > 0 ? 'status-pending' : 'status-paid'
          }`}
        >
          {totals.overall.unpaid > 0 ? 'PENDING PAYMENT' : 'FULLY PAID'}
        </span>
      </div>

      {/* Consultation Section */}
      {hasConsultationData(data) && (
        <div className="invoice-section">
          <h4 className="invoice-section-title">Consultation</h4>
          {data.consultation?.details?.length > 0 && (
            <table className="invoice-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.consultation.details.map((item, index) => (
                  <tr key={`consultation-${index}`}>
                    <td>{item.date}</td>
                    <td>{item.time}</td>
                    <td>{parseFloat(item.amount).toLocaleString()}</td>
                    <td
                      className={
                        item.status === 'paid' ? 'status-paid' : 'status-pending'
                      }
                    >
                      {item.status.toUpperCase()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="section-summary">
            <div className="summary-line">
              <span>Paid:</span>
              <span className="paid-amount">
                UGX {totals.consultation.paid.toLocaleString()}
              </span>
            </div>
            <div className="summary-line">
              <span>Unpaid:</span>
              <span className="unpaid-amount">
                UGX {totals.consultation.unpaid.toLocaleString()}
              </span>
            </div>
            <div className="summary-line total-line">
              <span>Total:</span>
              <span>UGX {totals.consultation.total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Lab Investigations Section */}
      {hasLabData(data) && (
        <div className="invoice-section">
          <h4 className="invoice-section-title">Lab Investigations</h4>

          {/* Paid Lab Tests */}
          {data.lab_investigations?.paid?.length > 0 && (
            <>
              <h5>Paid</h5>
              <table className="invoice-table">
                <thead>
                  <tr>
                    <th>Test Name</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Amount Paid</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.lab_investigations.paid.map((item, index) => (
                    <tr key={`paid-lab-${index}`}>
                      <td>{item.test_name}</td>
                      <td>{item.date}</td>
                      <td>{item.time}</td>
                      <td>{parseFloat(item.amount_paid).toLocaleString()}</td>
                      <td className="status-paid">PAID</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {/* Unpaid Lab Tests */}
          {data.lab_investigations?.unpaid?.length > 0 && (
            <>
              <h5>Unpaid</h5>
              <table className="invoice-table">
                <thead>
                  <tr>
                    <th>Test Name</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.lab_investigations.unpaid.map((item, index) => (
                    <tr key={`unpaid-lab-${index}`}>
                      <td>{item.test_name}</td>
                      <td>{item.date}</td>
                      <td>{item.time}</td>
                      <td>{parseFloat(item.amount_paid).toLocaleString()}</td>
                      <td className="status-pending">UNPAID</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          <div className="section-summary">
            <div className="summary-line">
              <span>Paid:</span>
              <span className="paid-amount">
                UGX {totals.lab.paid.toLocaleString()}
              </span>
            </div>
            <div className="summary-line">
              <span>Unpaid:</span>
              <span className="unpaid-amount">
                UGX {totals.lab.unpaid.toLocaleString()}
              </span>
            </div>
            <div className="summary-line total-line">
              <span>Total:</span>
              <span>UGX {totals.lab.total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Radiology Investigations Section */}
      {hasRadiologyData(data) && (
        <div className="invoice-section">
          <h4 className="invoice-section-title">Radiology Investigations</h4>

          {/* Paid Radiology */}
          {data.radiology_investigations?.paid?.length > 0 && (
            <>
              <h5>Paid</h5>
              <table className="invoice-table">
                <thead>
                  <tr>
                    <th>Exam Name</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Amount Paid</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.radiology_investigations.paid.map((item, index) => (
                    <tr key={`paid-radiology-${index}`}>
                      <td>{item.exam_name}</td>
                      <td>{item.date}</td>
                      <td>{item.time}</td>
                      <td>{parseFloat(item.amount_paid).toLocaleString()}</td>
                      <td className="status-paid">PAID</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {/* Unpaid Radiology */}
          {data.radiology_investigations?.unpaid?.length > 0 && (
            <>
              <h5>Unpaid</h5>
              <table className="invoice-table">
                <thead>
                  <tr>
                    <th>Exam Name</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.radiology_investigations.unpaid.map((item, index) => (
                    <tr key={`unpaid-radiology-${index}`}>
                      <td>{item.exam_name}</td>
                      <td>{item.date}</td>
                      <td>{item.time}</td>
                      <td>{parseFloat(item.amount_paid).toLocaleString()}</td>
                      <td className="status-pending">UNPAID</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          <div className="section-summary">
            <div className="summary-line">
              <span>Paid:</span>
              <span className="paid-amount">
                UGX {totals.radiology.paid.toLocaleString()}
              </span>
            </div>
            <div className="summary-line">
              <span>Unpaid:</span>
              <span className="unpaid-amount">
                UGX {totals.radiology.unpaid.toLocaleString()}
              </span>
            </div>
            <div className="summary-line total-line">
              <span>Total:</span>
              <span>UGX {totals.radiology.total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Services Section */}
      {hasServicesData(data) && (
        <div className="invoice-section">
          <h4 className="invoice-section-title">Services</h4>

          {/* Paid Services */}
          {data.services?.paid?.length > 0 && (
            <>
              <h5>Paid</h5>
              <table className="invoice-table">
                <thead>
                  <tr>
                    <th>Service Name</th>
                    <th>Total Bill</th>
                    <th>Amount Paid</th>
                    <th>Balance</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.services.paid.map((item, index) => (
                    <tr key={`paid-service-${index}`}>
                      <td>{item.service_name}</td>
                      <td>{parseFloat(item.total_bill).toLocaleString()}</td>
                      <td>{parseFloat(item.amount_paid_sofar).toLocaleString()}</td>
                      <td>{parseFloat(item.balance).toLocaleString()}</td>
                      <td>{item.date}</td>
                      <td className="status-paid">PAID</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {/* Unpaid Services */}
          {data.services?.unpaid?.length > 0 && (
            <>
              <h5>Unpaid</h5>
              <table className="invoice-table">
                <thead>
                  <tr>
                    <th>Service Name</th>
                    <th>Total Bill</th>
                    <th>Amount Paid</th>
                    <th>Balance</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.services.unpaid.map((item, index) => (
                    <tr key={`unpaid-service-${index}`}>
                      <td>{item.service_name}</td>
                      <td>{parseFloat(item.total_bill).toLocaleString()}</td>
                      <td>{parseFloat(item.amount_paid_sofar).toLocaleString()}</td>
                      <td>{parseFloat(item.balance).toLocaleString()}</td>
                      <td>{item.date}</td>
                      <td className="status-pending">UNPAID</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          <div className="section-summary">
            <div className="summary-line">
              <span>Paid:</span>
              <span className="paid-amount">
                UGX {totals.services.paid.toLocaleString()}
              </span>
            </div>
            <div className="summary-line">
              <span>Unpaid:</span>
              <span className="unpaid-amount">
                UGX {totals.services.unpaid.toLocaleString()}
              </span>
            </div>
            <div className="summary-line total-line">
              <span>Total:</span>
              <span>UGX {totals.services.total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Treatment Section */}
      {hasTreatmentData(data) && (
        <div className="invoice-section">
          <h4 className="invoice-section-title">Treatment</h4>
          {data.treatment?.details?.length > 0 && (
            <table className="invoice-table">
              <thead>
                <tr>
                  <th>Drug</th>
                  <th>Packaging</th>
                  <th>Unit Price</th>
                  <th>Quantity</th>
                  <th>Total Price</th>
                  <th>Discount</th>
                </tr>
              </thead>
              <tbody>
                {data.treatment.details.map((item, index) => (
                  <tr key={`treatment-${index}`}>
                    <td>{item.drug}</td>
                    <td>{item.packaging}</td>
                    <td>{parseFloat(item.unit_price).toLocaleString()}</td>
                    <td>{item.quantity}</td>
                    <td>{parseFloat(item.total_price).toLocaleString()}</td>
                    <td>{parseFloat(item.discount).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="section-summary">
            <div className="summary-line">
              <span>Total Bill:</span>
              <span>
                UGX {parseFloat(data.treatment?.total_bill || 0).toLocaleString()}
              </span>
            </div>
            <div className="summary-line">
              <span>Amount Paid:</span>
              <span className="paid-amount">
                UGX {totals.treatment.paid.toLocaleString()}
              </span>
            </div>
            <div className="summary-line">
              <span>Balance:</span>
              <span
                className={
                  totals.treatment.unpaid > 0 ? 'unpaid-amount' : 'paid-amount'
                }
              >
                UGX {totals.treatment.unpaid.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Other Charges */}
      {hasOtherCharges(data) && (
        <div className="invoice-section">
          <h4 className="invoice-section-title">Other Charges</h4>
          <div className="section-summary">
            <div className="summary-line">
              <span>Other Charges:</span>
              <span>
                UGX {parseFloat(data.other_charges || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* File Summary */}
      <div className="invoice-summary">
        <h4>File {data?.file_id || 'N/A'} Summary</h4>
        <div className="summary-content">
          <div className="invoice-summary-line">
            <span>Total Bill:</span>
            <span>UGX {totals.overall.total.toLocaleString()}</span>
          </div>
          <div className="invoice-summary-line">
            <span>Total Paid:</span>
            <span className="paid-amount">
              UGX {totals.overall.paid.toLocaleString()}
            </span>
          </div>
          <div className="invoice-summary-line balance-line">
            <span>Balance:</span>
            <span
              className={
                totals.overall.unpaid > 0 ? 'balance-unpaid' : 'balance-paid'
              }
            >
              UGX {totals.overall.unpaid.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};


  const renderOtherServices = () => {
    return (
      <div className="other-services-section">
        <h3>Other Services (Not tied to specific files)</h3>
        
        {/* Global Unpaid Services */}
        {globalUnpaidServices.length > 0 && (
          <div className="invoice-section">
            <h4 className="invoice-section-title">Unpaid Services</h4>
            <table className="invoice-table">
              <thead>
                <tr>
                  <th>Service Name</th>
                  <th>Total Bill</th>
                  <th>Amount Paid</th>
                  <th>Balance</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {globalUnpaidServices.map((service, index) => (
                  <tr key={`global-service-${index}`}>
                    <td>{service.service_name}</td>
                    <td>{parseFloat(service.total_bill).toLocaleString()}</td>
                    <td>{parseFloat(service.amount_paid_sofar).toLocaleString()}</td>
                    <td>{parseFloat(service.balance).toLocaleString()}</td>
                    <td>{service.date}</td>
                    <td className="status-pending">Unpaid</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Global Unpaid Family Planning */}
        {globalUnpaidFamilyPlanning.length > 0 && (
          <div className="invoice-section">
            <h4 className="invoice-section-title">Unpaid Family Planning</h4>
            <table className="invoice-table">
              <thead>
                <tr>
                  <th>Method</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {globalUnpaidFamilyPlanning.map((fp, index) => (
                  <tr key={`global-fp-${index}`}>
                    <td>{fp.FPmethod}</td>
                    <td>{parseFloat(fp.amount).toLocaleString()}</td>
                    <td>{fp.date}</td>
                    <td className="status-pending">Unpaid</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {globalUnpaidServices.length === 0 && globalUnpaidFamilyPlanning.length === 0 && (
          <p>No other services found.</p>
        )}
      </div>
    );
  };

  const renderUnspecifiedFiles = () => {
    return (
      <div className="unspecified-files-section">
        <h3>Unspecified Files Balance</h3>
        <div className="invoice-summary">
          <div className="summary-content">
            <div className="invoice-summary-line balance-line">
              <span>Total Balance:</span>
              <span className="balance-unpaid">
                {unspecifiedFiles}
              </span>
            </div>
          </div>
        </div>
        <p>This balance represents payments that are not associated with any specific file.</p>
      </div>
    );
  };

  return (
    <div className="invoice-modal-overlay">
      <div className="invoice-modal-container">
        <div className="invoice-modal-header">
          <h2>Medical Invoice - {enhancedInvoiceData?.patientName || invoiceData.patientName}</h2>
          <button onClick={onClose} className="invoice-close-btn">
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        
        {loading && (
          <div className="invoice-loading">
            <FontAwesomeIcon icon={faSpinner} spin size="2x" />
            <p>Loading invoice data...</p>
          </div>
        )}
        
        {error && (
          <div className="invoice-error">
            <h4>Note</h4>
            <p>{error} Showing basic invoice information.</p>
          </div>
        )}
        
        {/* Patient Information */}
        <div className="invoice-patient-info">
          <div>
            <h4>Patient Details</h4>
            <p><strong>Name:</strong> {enhancedInvoiceData?.patientName || invoiceData.patientName}</p>
            <p><strong>Phone:</strong> {enhancedInvoiceData?.phoneNumber || invoiceData.phoneNumber}</p>
            <p><strong>Age/Sex:</strong> {enhancedInvoiceData?.age || invoiceData.age} / {enhancedInvoiceData?.sex || invoiceData.sex}</p>
          </div>
          <div>
            <h4>Invoice Details</h4>
            <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
            <p><strong>Contact ID:</strong> {enhancedInvoiceData?.contactId || invoiceData.contactId}</p>
          </div>
        </div>
        
        {/* Tabs Navigation */}
        <div className="invoice-tabs">
          <button 
            className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Files
          </button>
          
          {dataItems.map((data, index) => (
            <button 
              key={data.file_id || index}
              className={`tab-button ${activeTab === `file-${data.file_id}` ? 'active' : ''}`}
              onClick={() => setActiveTab(`file-${data.file_id}`)}
            >
              File {data.file_id}
            </button>
          ))}
          
          {hasGlobalServices && (
            <button 
              className={`tab-button ${activeTab === 'other-services' ? 'active' : ''}`}
              onClick={() => setActiveTab('other-services')}
            >
              Other Services
            </button>
          )}
          
          {hasUnspecifiedFiles && (
            <button 
              className={`tab-button ${activeTab === 'unspecified' ? 'active' : ''}`}
              onClick={() => setActiveTab('unspecified')}
            >
              Unspecified Files
            </button>
          )}
        </div>
        
        {/* Tab Content */}
        <div className="tab-content">
          {renderTabContent()}
        </div>
        
        <div className="invoice-actions">
          <button onClick={handlePrint} className="invoice-btn primary" disabled={loading}>
            <FontAwesomeIcon icon={faPrint} />
            {loading ? 'Generating...' : 'Print Invoice'}
          </button>
        </div>
      </div>

      <style jsx>{`
        /* Invoice Modal Styles */
        .invoice-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }
        
        .invoice-modal-container {
          background-color: white;
          border-radius: 0px;
          padding: 30px;
          width: 95%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        }
        
        .invoice-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 1px solid #e5e5e5;
        }
        
        .invoice-modal-header h2 {
          margin: 0;
          font-size: 24px;
        }
        
        .invoice-close-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 20px;
          color: #666;
        }
        
        .invoice-loading, .invoice-error {
          text-align: center;
          padding: 20px;
          margin-bottom: 20px;
        }
        
        .invoice-patient-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
          flex-wrap: wrap;
        }
        
        .invoice-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 20px;
          border-bottom: 1px solid #ddd;
          padding-bottom: 10px;
        }
        
        .tab-button {
          padding: 8px 16px;
          background-color: #f5f5f5;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.3s;
        }
        
        .tab-button:hover {
          background-color: #e9e9e9;
        }
        
        .tab-button.active {
          background-color: #1976d2;
          color: white;
          border-color: #1976d2;
        }
        
        .tab-content {
          min-height: 300px;
        }
        
        .file-section {
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 1px solid #eee;
        }
        
        .file-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }
        
        .file-status {
          padding: 5px 10px;
          border-radius: 4px;
          font-weight: bold;
        }
        
        .status-pending {
          background-color: #ffebee;
          color: #d32f2f;
        }
        
        .status-paid {
          background-color: #e8f5e9;
          color: #388e3c;
        }
        
        .invoice-section {
          margin-bottom: 20px;
        }
        
        .invoice-section-title {
          margin-bottom: 15px;
          font-size: 18px;
          color: #333;
        }
        
        .invoice-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
        }
        
        .invoice-table th, .invoice-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #eee;
        }
        
        .invoice-table th {
          background-color: #f5f5f5;
          font-weight: bold;
        }
        
        .section-summary {
          background-color: #f9f9f9;
          padding: 15px;
          border-radius: 5px;
          margin-top: 10px;
        }
        
        .summary-line {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        
        .total-line {
          border-top: 1px solid #ddd;
          padding-top: 8px;
          font-weight: bold;
        }
        
        .paid-amount {
          color: #388e3c;
        }
        
        .unpaid-amount {
          color: #d32f2f;
        }
        
        .invoice-summary {
          background-color: #f9f9f9;
          padding: 15px;
          border-radius: 5px;
          margin-top: 20px;
        }
        
        .invoice-summary-line {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
        }
        
        .balance-line {
          border-top: 1px solid #ddd;
          padding-top: 10px;
          font-weight: bold;
        }
        
        .balance-paid {
          color: #388e3c;
        }
        
        .balance-unpaid {
          color: #d32f2f;
        }
        
        .invoice-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 20px;
        }
        
        .invoice-btn {
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .invoice-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .invoice-btn.primary {
          background-color: #1976d2;
          color: white;
        }
        
        @media (max-width: 768px) {
          .invoice-patient-info {
            flex-direction: column;
          }
          
          .invoice-tabs {
            flex-direction: column;
          }
          
          .invoice-table {
            font-size: 14px;
          }
          
          .invoice-table th, .invoice-table td {
            padding: 8px;
          }
        }
      `}</style>
    </div>
  );
};

export default InvoiceModal;