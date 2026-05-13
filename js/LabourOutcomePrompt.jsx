import React, { useState, useEffect } from "react";
import { urls } from './config.dev';  // Import the urls from config.dev
import Select from 'react-select';  // Ensure this import is present at the top of your file
import LoadingSpinner2 from './LoadingSpinner2'; // Importing the renamed component
import SuccessMessage from './SuccessMessage';
import LoadingSpinner from './LoadingSpinner';  // Make sure to import the spinner

const LaborOutcomeForm = (props) => {
  const { first_name, last_name, maternity_id, tokenFromUrl, onClose } = props;
  useEffect(() => {
    // Log the extracted data from props to the console
    console.log("Extracted Data from Props:", {
      first_name,
      last_name,
      maternity_id,
      tokenFromUrl,
      onClose,
    });
  }, [first_name, last_name, maternity_id, tokenFromUrl, onClose]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loading, setLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false);  // For controlling the loading spinner
  const [isSuccess, setIsSuccess] = useState(false);  // For showing the success message

  const [errorMessage, setErrorMessage] = useState(null);
 
  const [formData, setFormData] = useState({
    motherName: `${first_name} ${last_name}`, // Automatically populate mother's name
    dateOfDelivery: "",
    timeOfDelivery: "",
    typeOfDelivery: "",
    durationStage1: "",
    durationStage2: "",
    postDeliveryBP: "",
    postDeliveryPulse: "",
    postDeliveryTemp: "",
    placentaDelivery: "Complete", // Default value
    abnormalities: "",
    oxytocinGiven: [],
    bloodLoss: "",
    episiotomy: "",
    tears: "",
    babyAlive: "YES", // Default value
    babySex: "",
    babyWeight: "",
    gestationalAge: "",
    physicalAbnormalities: "",
    birthInjury: "",
    newbornCare: {
      cordLigated: "YES",
      keptWarm: "YES",
      breastfeedingInitiated: "YES",
      tetracyclineGiven: "YES",
      vitaminKGiven: "YES",
      immunizations: {
        BCG: "",
        Polio: "",
      },
    },
    ARVs: "",
    infectionSigns: "",
    postpartumCare: "",
    treatmentNewborn: "",
    treatmentMother: "",
    deliveredBy: [], // Initialize as an array
    ward: "",
    maternity_id: maternity_id, // Include the maternity_id
    tokenFromUrl: tokenFromUrl, // Include the tokenFromUrl
    
  });
// Fetch employees from the backend
useEffect(() => {
  // Fetch the labor outcome data when the component mounts
  const fetchLaborOutcomeData = async () => {
    setLoading(true);  // Set loading to true when the fetch starts

    try {
      const response = await fetch(urls.fetchlabouroutcome, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ maternity_id: maternity_id }),
      });

      if (!response.ok) throw new Error("Failed to fetch labor outcome data.");

      const data = await response.json();
      if (data && data.maternity && data.maternity.length > 0) {
        const laborOutcome = data.maternity[0];
        const newbornCare = data.newborn_care && data.newborn_care[0];
        const immunizations = data.immunizations && data.immunizations[0];

        // Pre-populate formData with the fetched data, leave empty if not present
        setFormData((prevState) => ({
          ...prevState,
          motherName: laborOutcome.motherName || prevState.motherName,
          dateOfDelivery: laborOutcome.dateOfDelivery || "",
          timeOfDelivery: laborOutcome.timeOfDelivery || "",
          typeOfDelivery: laborOutcome.typeOfDelivery || "",
          ward: laborOutcome.ward || "",
          durationStage1: laborOutcome.durationStage1 || "",
          durationStage2: laborOutcome.durationStage2 || "",
          postDeliveryBP: laborOutcome.postDeliveryBP || "",
          postDeliveryPulse: laborOutcome.postDeliveryPulse || "",
          postDeliveryTemp: laborOutcome.postDeliveryTemp || "",
          placentaDelivery: laborOutcome.placentaDelivery || "",
          abnormalities: laborOutcome.abnormalities || "",
          oxytocinGiven: laborOutcome.oxytocinGiven ? JSON.parse(laborOutcome.oxytocinGiven) : [],
          bloodLoss: laborOutcome.bloodLoss || "",
          episiotomy: laborOutcome.episiotomy || "",
          tears: laborOutcome.tears || "",
          babyAlive: laborOutcome.babyAlive || "YES",
          babySex: laborOutcome.babySex || "",
          babyWeight: laborOutcome.babyWeight || "",
          gestationalAge: laborOutcome.gestationalAge || "",
          physicalAbnormalities: laborOutcome.physicalAbnormalities || "",
          birthInjury: laborOutcome.birthInjury || "",
          ARVs: laborOutcome.ARVs || "",
          infectionSigns: laborOutcome.infectionSigns || "",
          postpartumCare: laborOutcome.postpartumCare || "",
          treatmentNewborn: laborOutcome.treatmentNewborn || "",
          treatmentMother: laborOutcome.treatmentMother || "",
          deliveredBy: laborOutcome.deliveredBy || "",
          newbornCare: {
            ...prevState.newbornCare,
            cordLigated: newbornCare ? newbornCare.cordLigated : "YES",
            keptWarm: newbornCare ? newbornCare.keptWarm : "YES",
            breastfeedingInitiated: newbornCare ? newbornCare.breastfeedingInitiated : "YES",
            tetracyclineGiven: newbornCare ? newbornCare.tetracyclineGiven : "YES",
            vitaminKGiven: newbornCare ? newbornCare.vitaminKGiven : "YES",
            immunizations: {
              BCG: immunizations ? immunizations.BCG : "",
              Polio: immunizations ? immunizations.Polio : "",
            }
          }
        }));
      }
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false);  // Set loading to false when fetch is complete (either success or error)
    }
  };

  fetchLaborOutcomeData();
}, [maternity_id]); // Depend on maternity_id so it fetches when it changes
  const handleChange = (e) => {
    const { name, value } = e.target;
  
    // Split the name to get the nested field (e.g. newbornCare.immunizations.BCG)
    const nameParts = name.split('.');
    
    if (nameParts.length === 2) {
      // This is a direct field of newbornCare
      setFormData((prevFormData) => ({
        ...prevFormData,
        newbornCare: {
          ...prevFormData.newbornCare,  // Preserve the other fields inside newbornCare
          [nameParts[1]]: value,        // Update the specific nested field
        }
      }));
    } else if (nameParts.length === 3) {
      // Handle deeper nesting like newbornCare.immunizations.BCG
      setFormData((prevFormData) => ({
        ...prevFormData,
        newbornCare: {
          ...prevFormData.newbornCare,
          immunizations: {
            ...prevFormData.newbornCare.immunizations, // Preserve other immunizations
            [nameParts[2]]: value,  // Update the specific immunization field (BCG or Polio)
          }
        }
      }));
    } else {
      // For other fields in formData (like motherName, dateOfDelivery, etc.)
      setFormData((prevFormData) => ({
        ...prevFormData,
        [name]: value
      }));
    }
  };
  
  
useEffect(() => {
  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await fetch(urls.fetchemployees3, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tokenFromUrl }),
      });

      const data = await response.json();
      if (data && data.employees) {
        setEmployees(
          data.employees.map((employee) => ({
            value: employee, // Storing the full employee object in value
            label: employee, // Assuming the employee names are the values
          }))
        );
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  fetchEmployees();
}, []);

const handleSelectChange = (selectedOptions) => {
  const selectedEmployeeIds = selectedOptions ? selectedOptions.map(option => option.value) : [];
  setFormData((prevState) => ({
    ...prevState,
    deliveredBy: selectedEmployeeIds, // Update deliveredBy as an array
  }));
};

  const handleCheckboxChange = (e) => {
    const { name, value, checked } = e.target;
    
    // Update the oxytocinGiven array based on whether the checkbox is checked or unchecked
    const updatedValues = checked
      ? [...formData.oxytocinGiven, value] // Add the value if checked
      : formData.oxytocinGiven.filter((item) => item !== value); // Remove the value if unchecked
  
    // Update the formData state with the new oxytocinGiven values
    setFormData({ ...formData, [name]: updatedValues });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setIsSuccess(false);  // Reset success state on new submit attempt

    // Prepare the labor outcome data section
    const laborOutcomeData = {
      maternity_id: formData.maternity_id, 
      motherName: formData.motherName,
      dateOfDelivery: formData.dateOfDelivery,
      timeOfDelivery: formData.timeOfDelivery,
      typeOfDelivery: formData.typeOfDelivery,
      ward: formData.ward,
      durationStage1: formData.durationStage1,
      durationStage2: formData.durationStage2,
      postDeliveryBP: formData.postDeliveryBP,
      postDeliveryPulse: formData.postDeliveryPulse,
      postDeliveryTemp: formData.postDeliveryTemp,
      placentaDelivery: formData.placentaDelivery,
      abnormalities: formData.abnormalities,
      oxytocinGiven: formData.oxytocinGiven,
      bloodLoss: formData.bloodLoss,
      episiotomy: formData.episiotomy,
      tears: formData.tears,
      babyAlive: formData.babyAlive,
      babySex: formData.babySex,
      babyWeight: formData.babyWeight,
      gestationalAge: formData.gestationalAge,
      physicalAbnormalities: formData.physicalAbnormalities,
      birthInjury: formData.birthInjury,
      ARVs: formData.ARVs,
      infectionSigns: formData.infectionSigns,
      postpartumCare: formData.postpartumCare,
      treatmentNewborn: formData.treatmentNewborn,
      treatmentMother: formData.treatmentMother,
      deliveredBy: formData.deliveredBy,
      tokenFromUrl: formData.tokenFromUrl,
    };

    // Prepare other data sections (newborn care, immunizations) if available
    const newbornCareData = formData.newbornCare ? { 
      maternity_id: formData.maternity_id, 
      newbornCare: formData.newbornCare,
      tokenFromUrl: formData.tokenFromUrl,
    } : null;

    const immunizationsData = formData.newbornCare && formData.newbornCare.immunizations ? {
      maternity_id: formData.maternity_id,
      immunizations: formData.newbornCare.immunizations,
      tokenFromUrl: formData.tokenFromUrl,
    } : null;

    try {
      // Labor Outcome Submission
      const laborOutcomeResponse = await fetch(urls.post_labour, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(laborOutcomeData),
      });

      if (!laborOutcomeResponse.ok) throw new Error('Failed to submit labor outcome.');

      // Newborn Care Submission (if available)
      if (newbornCareData) {
        const newbornCareResponse = await fetch(urls.newborn_care, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newbornCareData),
        });

        if (!newbornCareResponse.ok) throw new Error('Failed to submit newborn care.');
      }

      // Immunizations Submission (if available)
      if (immunizationsData) {
        const immunizationsResponse = await fetch(urls.immunizations, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(immunizationsData),
        });

        if (!immunizationsResponse.ok) throw new Error('Failed to submit immunizations.');
      }

      setIsSuccess(true);  // Set success state to show success message

      // Hide the success message after 3 seconds
      setTimeout(() => {
        setIsSuccess(false);
      }, 3000);  // 3000 ms = 3 seconds

    } catch (error) {
      console.error("Error:", error);
      alert(error.message || "An error occurred. Please try again.");  // Only alert on failure
    } finally {
      setIsSubmitting(false);  // Stop the loading spinner after submission
    }
  };

  
  const closeButtonStyle = {
    fontSize: '14px',
    padding: '10px 20px',
    backgroundColor: '#f44336',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  };
  const formContainerStyles = {
    position: 'fixed', // Ensures it covers the entire viewport
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Optional: semi-transparent background
    zIndex: 9999, // Ensures it appears on top of all content
  };
  
  const formStyles = {
    position: 'relative',
    backgroundColor: '#fff',
    padding: '30px',
    borderRadius: '8px',
    width: '95vw', // Increased width to cover more screen
    maxWidth: '1500px',
    maxHeight: '90vh', // Keeps the form within the viewport height
    overflowY: 'auto', // Enables scrolling if content exceeds height
  };
  return (
    <div style={formContainerStyles}>
      <form onSubmit={handleSubmit} style={formStyles}>
      {isSubmitting && <LoadingSpinner2 />}  {/* Show loading spinner while submitting */}
      {isSuccess && <SuccessMessage />}      {/* Show success message after successful submission */}
      {loading && <LoadingSpinner />}  {/* Show loading spinner while fetching data */}
      <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            padding: "5px 10px",
            backgroundColor: "transparent",
            color: "#dc3545",
            border: "none",
            fontSize: "20px",
            cursor: "pointer",
          }}
        >
          &times;
        </button>
        <h2>Outcome of Labour</h2>

        {/* Error message display */}
    
      {errorMessage && <p className="error-message">{errorMessage}</p>}

      <div
  style={{
    maxWidth: "1500px",
    margin: "20px auto",
    padding: "20px",
    border: "1px solid #ccc",
    borderRadius: "10px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
    backgroundColor: "#f9f9f9",
    fontFamily: "Arial, sans-serif",
  }}
>
  <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
    <div style={{ flex: "1", minWidth: "350px", marginBottom: "15px" }}>
      <label
        htmlFor="motherName"
        style={{
          display: "block",
          fontWeight: "bold",
          marginBottom: "5px",
          color: "#333",
        }}
      >
        Mother's Name:
      </label>
      <input
        type="text"
        id="motherName"
        name="motherName"
        value={formData.motherName}
        onChange={handleChange}
        aria-label="Mother's Name"
        style={{
          width: "100%",
          padding: "10px",
          fontSize: "14px",
          borderRadius: "5px",
          border: "1px solid #ccc",
        }}
      />
    </div>
    <div style={{ flex: "1", minWidth: "350px", marginBottom: "15px" }}>
      <label
        htmlFor="dateOfDelivery"
        style={{
          display: "block",
          fontWeight: "bold",
          marginBottom: "5px",
          color: "#333",
        }}
      >
        Date of Delivery:
      </label>
      <input
        type="date"
        id="dateOfDelivery"
        name="dateOfDelivery"
        value={formData.dateOfDelivery}
        onChange={handleChange}
        style={{
          width: "100%",
          padding: "10px",
          fontSize: "14px",
          borderRadius: "5px",
          border: "1px solid #ccc",
        }}
      />
    </div>
    <div style={{ flex: "1", minWidth: "350px", marginBottom: "15px" }}>
      <label
        htmlFor="timeOfDelivery"
        style={{
          display: "block",
          fontWeight: "bold",
          marginBottom: "5px",
          color: "#333",
        }}
      >
        Time of Delivery:
      </label>
      <input
        type="time"
        id="timeOfDelivery"
        name="timeOfDelivery"
        value={formData.timeOfDelivery}
        onChange={handleChange}
        style={{
          width: "100%",
          padding: "10px",
          fontSize: "14px",
          borderRadius: "5px",
          border: "1px solid #ccc",
        }}
      />
    </div>
    <div style={{ flex: "1", minWidth: "350px", marginBottom: "15px" }}>
      <label
        htmlFor="typeOfDelivery"
        style={{
          display: "block",
          fontWeight: "bold",
          marginBottom: "5px",
          color: "#333",
        }}
      >
        Type of Delivery:
      </label>
      <input
        type="text"
        id="typeOfDelivery"
        name="typeOfDelivery"
        value={formData.typeOfDelivery}
        onChange={handleChange}
        style={{
          width: "100%",
          padding: "10px",
          fontSize: "14px",
          borderRadius: "5px",
          border: "1px solid #ccc",
        }}
      />
    </div>
  </div>

  <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
    <div style={{ flex: "1", minWidth: "350px", marginBottom: "15px" }}>
      <label
        htmlFor="durationStage1"
        style={{
          display: "block",
          fontWeight: "bold",
          marginBottom: "5px",
          color: "#333",
        }}
      >
        Duration of 1st Stage (hours):
      </label>
      <input
        type="number"
        id="durationStage1"
        name="durationStage1"
        value={formData.durationStage1}
        onChange={handleChange}
        style={{
          width: "100%",
          padding: "10px",
          fontSize: "14px",
          borderRadius: "5px",
          border: "1px solid #ccc",
        }}
      />
    </div>
    <div style={{ flex: "1", minWidth: "250px", marginBottom: "15px" }}>
      <label
        htmlFor="durationStage2"
        style={{
          display: "block",
          fontWeight: "bold",
          marginBottom: "5px",
          color: "#333",
        }}
      >
        Duration of 2nd Stage (minutes):
      </label>
      <input
        type="number"
        id="durationStage2"
        name="durationStage2"
        value={formData.durationStage2}
        onChange={handleChange}
        style={{
          width: "100%",
          padding: "10px",
          fontSize: "14px",
          borderRadius: "5px",
          border: "1px solid #ccc",
        }}
      />
    </div>
    <div style={{ flex: "1", minWidth: "350px", marginBottom: "15px" }}>
      <label
        htmlFor="postDeliveryBP"
        style={{
          display: "block",
          fontWeight: "bold",
          marginBottom: "5px",
          color: "#333",
        }}
      >
        Post Delivery BP:
      </label>
      <input
        type="text"
        id="postDeliveryBP"
        name="postDeliveryBP"
        value={formData.postDeliveryBP}
        onChange={handleChange}
        style={{
          width: "100%",
          padding: "10px",
          fontSize: "14px",
          borderRadius: "5px",
          border: "1px solid #ccc",
        }}
      />
    </div>
    <div style={{ flex: "1", minWidth: "350px", marginBottom: "15px" }}>
      <label
        htmlFor="postDeliveryPulse"
        style={{
          display: "block",
          fontWeight: "bold",
          marginBottom: "5px",
          color: "#333",
        }}
      >
        Post Delivery Pulse:
      </label>
      <input
        type="number"
        id="postDeliveryPulse"
        name="postDeliveryPulse"
        value={formData.postDeliveryPulse}
        onChange={handleChange}
        style={{
          width: "100%",
          padding: "10px",
          fontSize: "14px",
          borderRadius: "5px",
          border: "1px solid #ccc",
        }}
      />
    </div>
    <div style={{ flex: "1", minWidth: "350px", marginBottom: "15px" }}>
      <label
        htmlFor="postDeliveryTemp"
        style={{
          display: "block",
          fontWeight: "bold",
          marginBottom: "5px",
          color: "#333",
        }}
      >
        Post Delivery Temp:
      </label>
      <input
        type="number"
        id="postDeliveryTemp"
        name="postDeliveryTemp"
        value={formData.postDeliveryTemp}
        onChange={handleChange}
        style={{
          width: "100%",
          padding: "10px",
          fontSize: "14px",
          borderRadius: "5px",
          border: "1px solid #ccc",
        }}
      />
    </div>
  </div>
</div>

<h3 style={{ fontSize: "1.5em", marginBottom: "20px", color: "#333" }}>Placenta Delivery</h3>
<div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
  <div style={{ flex: "1", minWidth: "200px", marginBottom: "15px" }}>
    <label
      style={{
        display: "block",
        fontWeight: "bold",
        marginBottom: "5px",
        color: "#333",
      }}
    >
      <input
        type="radio"
        name="placentaDelivery"
        value="Complete"
        checked={formData.placentaDelivery === "Complete"}
        onChange={handleChange}
        style={{ marginRight: "10px" }}
      />
      Complete
    </label>
  </div>
  <div style={{ flex: "1", minWidth: "200px", marginBottom: "15px" }}>
    <label
      style={{
        display: "block",
        fontWeight: "bold",
        marginBottom: "5px",
        color: "#333",
      }}
    >
      <input
        type="radio"
        name="placentaDelivery"
        value="Incomplete"
        checked={formData.placentaDelivery === "Incomplete"}
        onChange={handleChange}
        style={{ marginRight: "10px" }}
      />
      Incomplete
    </label>
  </div>
</div>
<div style={{ flex: "1", minWidth: "350px", marginBottom: "15px" }}>
  <label
    htmlFor="abnormalities"
    style={{
      display: "block",
      fontWeight: "bold",
      marginBottom: "5px",
      color: "#333",
    }}
  >
    Abnormalities:
  </label>
  <textarea
    id="abnormalities"
    name="abnormalities"
    value={formData.abnormalities}
    onChange={handleChange}
    placeholder="Type here any abnormalities you noted with the placenta."
    style={{
      width: "100%",
      padding: "10px",
      fontSize: "14px",
      borderRadius: "5px",
      border: "1px solid #ccc",
      minHeight: "100px",
      resize: "vertical",
    }}
  />
</div>

<h3 style={{ fontSize: "1.5em", marginBottom: "20px", color: "#333" }}>Oxytocin Given</h3>
<div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", marginBottom: "20px" }}>
  <div style={{ flex: "1", minWidth: "200px", marginBottom: "15px" }}>
  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#333' }}>
            <input
              type="checkbox"
              name="oxytocinGiven"
              value="Pitocin (10IU)"
              onChange={handleCheckboxChange}
              checked={formData.oxytocinGiven.includes('Pitocin (10IU)')}
              style={{ marginRight: '10px' }}
            />
            Pitocin (10IU)
          </label>
        </div>
        <div style={{ flex: '1', minWidth: '200px', marginBottom: '15px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#333' }}>
            <input
              type="checkbox"
              name="oxytocinGiven"
              value="Ergometrine (0.4mg)"
              onChange={handleCheckboxChange}
              checked={formData.oxytocinGiven.includes('Ergometrine (0.4mg)')}
              style={{ marginRight: '10px' }}
            />
            Ergometrine (0.4mg)
          </label>
        </div>
        <div style={{ flex: '1', minWidth: '200px', marginBottom: '15px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#333' }}>
            <input
              type="checkbox"
              name="oxytocinGiven"
              value="Misoprostol (600mcg)"
              onChange={handleCheckboxChange}
              checked={formData.oxytocinGiven.includes('Misoprostol (600mcg)')}
              style={{ marginRight: '10px' }}
            />
            Misoprostol (600mcg)
          </label>
  </div>
</div>

<div style={{ display: "flex", flexWrap: "wrap", marginBottom: "20px" }}>
  <div style={{ flex: "1", minWidth: "250px", marginBottom: "15px" }}>
    <label
      htmlFor="bloodLoss"
      style={{ display: "block", fontWeight: "bold", marginBottom: "5px", color: "#333" }}
    >
      Amount of Blood Loss (ml):
    </label>
    <input
      type="number"
      id="bloodLoss"
      name="bloodLoss"
      value={formData.bloodLoss}
      onChange={handleChange}
      style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
    />
  </div>

  <div style={{ flex: "1", minWidth: "250px", marginBottom: "15px" }}>
    <label
      htmlFor="episiotomy"
      style={{ display: "block", fontWeight: "bold", marginBottom: "5px", color: "#333" }}
    >
      Episiotomy:
    </label>
    <input
      type="text"
      id="episiotomy"
      name="episiotomy"
      value={formData.episiotomy}
      onChange={handleChange}
      style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
    />
  </div>

  <div style={{ flex: "1", minWidth: "250px", marginBottom: "15px" }}>
    <label
      htmlFor="tears"
      style={{ display: "block", fontWeight: "bold", marginBottom: "5px", color: "#333" }}
    >
      Tears:
    </label>
    <input
      type="text"
      id="tears"
      name="tears"
      value={formData.tears}
      onChange={handleChange}
      style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
    />
  </div>
</div>

<h3 style={{ fontSize: "1.5em", marginBottom: "20px", color: "#333" }}>Baby Outcome</h3>

<div style={{ display: "flex", flexWrap: "wrap", marginBottom: "20px" }}>
  <div style={{ flex: "1", minWidth: "250px", marginBottom: "15px" }}>
    <label
      style={{
        display: "block",
        fontWeight: "bold",
        marginBottom: "5px",
        color: "#333",
      }}
    >
      Baby Alive:
    </label>
    <select
      name="babyAlive"
      value={formData.babyAlive}
      onChange={handleChange}
      style={{
        width: "100%",
        padding: "8px",
        borderRadius: "4px",
        border: "1px solid #ccc",
        backgroundColor: "#fff",
      }}
    >
      <option value="YES">YES</option>
      <option value="NO">NO</option>
    </select>
  </div>

  <div style={{ flex: "1", minWidth: "250px", marginBottom: "15px" }}>
    <label
      htmlFor="babySex"
      style={{ display: "block", fontWeight: "bold", marginBottom: "5px", color: "#333" }}
    >
      Baby's Sex:
    </label>
    <input
      type="text"
      id="babySex"
      name="babySex"
      value={formData.babySex}
      onChange={handleChange}
      style={{
        width: "100%",
        padding: "8px",
        borderRadius: "4px",
        border: "1px solid #ccc",
      }}
    />
  </div>

  <div style={{ flex: "1", minWidth: "250px", marginBottom: "15px" }}>
    <label
      htmlFor="babyWeight"
      style={{ display: "block", fontWeight: "bold", marginBottom: "5px", color: "#333" }}
    >
      Baby's Weight (kg):
    </label>
    <input
      type="number"
      id="babyWeight"
      name="babyWeight"
      value={formData.babyWeight}
      onChange={handleChange}
      style={{
        width: "100%",
        padding: "8px",
        borderRadius: "4px",
        border: "1px solid #ccc",
      }}
    />
  </div>

  <div style={{ flex: "1", minWidth: "250px", marginBottom: "15px" }}>
    <label
      htmlFor="gestationalAge"
      style={{ display: "block", fontWeight: "bold", marginBottom: "5px", color: "#333" }}
    >
      Gestational Age (weeks):
    </label>
    <input
      type="number"
      id="gestationalAge"
      name="gestationalAge"
      value={formData.gestationalAge}
      onChange={handleChange}
      style={{
        width: "100%",
        padding: "8px",
        borderRadius: "4px",
        border: "1px solid #ccc",
      }}
    />
  </div>

  <div style={{ flex: "1", minWidth: "250px", marginBottom: "15px" }}>
    <label
      htmlFor="physicalAbnormalities"
      style={{ display: "block", fontWeight: "bold", marginBottom: "5px", color: "#333" }}
    >
      Physical Abnormalities:
    </label>
    <input
      type="text"
      id="physicalAbnormalities"
      name="physicalAbnormalities"
      value={formData.physicalAbnormalities}
      onChange={handleChange}
      style={{
        width: "100%",
        padding: "8px",
        borderRadius: "4px",
        border: "1px solid #ccc",
      }}
    />
  </div>

  <div style={{ flex: "1", minWidth: "250px", marginBottom: "15px" }}>
    <label
      htmlFor="birthInjury"
      style={{ display: "block", fontWeight: "bold", marginBottom: "5px", color: "#333" }}
    >
      Birth Injury:
  </label>
  <textarea
    id="birthInjury"
    name="birthInjury"
    value={formData.birthInjury}
    onChange={handleChange}
    placeholder="Type here any abnormality noticed with the baby if any, any physical abnormalities, remember to check if the baby anus is patent."
    style={{
      width: "100%",
      padding: "10px",
      borderRadius: "4px",
      border: "1px solid #ccc",
      height: "100px",
      resize: "vertical",
      fontFamily: "Arial, sans-serif",
      fontSize: "14px",
      color: "#333",
    }}
  />
</div>
</div>


<h3 style={{ fontWeight: "bold", marginBottom: "15px", color: "#333" }}>Newborn Care</h3>
<div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
  <div style={{ flex: "1", minWidth: "250px", marginBottom: "15px" }}>
    <label
      htmlFor="cordLigated"
      style={{ display: "block", fontWeight: "bold", marginBottom: "5px", color: "#333" }}
    >
      Cord Ligated:
    </label>
    <select
      name="newbornCare.cordLigated"
      value={formData.newbornCare.cordLigated}
      onChange={handleChange}
      id="cordLigated"
      style={{
        width: "100%",
        padding: "10px",
        borderRadius: "4px",
        border: "1px solid #ccc",
        fontFamily: "Arial, sans-serif",
        fontSize: "14px",
        color: "#333",
      }}
    >
      <option value="YES">YES</option>
      <option value="NO">NO</option>
    </select>
  </div>

  <div style={{ flex: "1", minWidth: "250px", marginBottom: "15px" }}>
    <label
      htmlFor="keptWarm"
      style={{ display: "block", fontWeight: "bold", marginBottom: "5px", color: "#333" }}
    >
      Kept Warm:
    </label>
    <select
      name="newbornCare.keptWarm"
      value={formData.newbornCare.keptWarm}
      onChange={handleChange}
      id="keptWarm"
      style={{
        width: "100%",
        padding: "10px",
        borderRadius: "4px",
        border: "1px solid #ccc",
        fontFamily: "Arial, sans-serif",
        fontSize: "14px",
        color: "#333",
      }}
    >
      <option value="YES">YES</option>
      <option value="NO">NO</option>
    </select>
  </div>

  <div style={{ flex: "1", minWidth: "250px", marginBottom: "15px" }}>
    <label
      htmlFor="breastfeedingInitiated"
      style={{ display: "block", fontWeight: "bold", marginBottom: "5px", color: "#333" }}
    >
      Breastfeeding Initiated:
    </label>
    <select
      name="newbornCare.breastfeedingInitiated"
      value={formData.newbornCare.breastfeedingInitiated}
      onChange={handleChange}
      id="breastfeedingInitiated"
      style={{
        width: "100%",
        padding: "10px",
        borderRadius: "4px",
        border: "1px solid #ccc",
        fontFamily: "Arial, sans-serif",
        fontSize: "14px",
        color: "#333",
      }}
    >
      <option value="YES">YES</option>
      <option value="NO">NO</option>
    </select>
  </div>
</div>

<h3 style={{ fontWeight: "bold", marginBottom: "15px", color: "#333" }}>Newborn Medications</h3>

<div style={{ display: "flex", flexWrap: "wrap", gap: "20px", marginBottom: "20px" }}>
  <div style={{ flex: "1", minWidth: "250px", marginBottom: "15px" }}>
    <label
      htmlFor="tetracyclineGiven"
      style={{ display: "block", fontWeight: "bold", marginBottom: "5px", color: "#333" }}
    >
      Tetracycline Given:
    </label>
    <select
      name="newbornCare.tetracyclineGiven"
      value={formData.newbornCare.tetracyclineGiven}
      onChange={handleChange}
      id="tetracyclineGiven"
      style={{
        width: "100%",
        padding: "10px",
        borderRadius: "4px",
        border: "1px solid #ccc",
        fontFamily: "Arial, sans-serif",
        fontSize: "14px",
        color: "#333",
      }}
    >
      <option value="YES">YES</option>
      <option value="NO">NO</option>
    </select>
  </div>

  <div style={{ flex: "1", minWidth: "250px", marginBottom: "15px" }}>
    <label
      htmlFor="vitaminKGiven"
      style={{ display: "block", fontWeight: "bold", marginBottom: "5px", color: "#333" }}
    >
      Vitamin K Given:
    </label>
    <select
      name="newbornCare.vitaminKGiven"
      value={formData.newbornCare.vitaminKGiven}
      onChange={handleChange}
      id="vitaminKGiven"
      style={{
        width: "100%",
        padding: "10px",
        borderRadius: "4px",
        border: "1px solid #ccc",
        fontFamily: "Arial, sans-serif",
        fontSize: "14px",
        color: "#333",
      }}
    >
      <option value="YES">YES</option>
      <option value="NO">NO</option>
    </select>
  </div>
</div>

<div style={{ marginBottom: "20px" }}>
  <label
    style={{ display: "block", fontWeight: "bold", marginBottom: "10px", color: "#333" }}
  >
    Immunizations:
  </label>
  <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
    <div style={{ flex: "1", minWidth: "250px", marginBottom: "15px" }}>
      <label
        htmlFor="BCG"
        style={{ display: "block", fontWeight: "bold", marginBottom: "5px", color: "#333" }}
      >
        BCG:
      </label>
      <input
        type="text"
        name="newbornCare.immunizations.BCG"
        value={formData.newbornCare.immunizations.BCG}
        onChange={handleChange}
        id="BCG"
        style={{
          width: "100%",
          padding: "10px",
          borderRadius: "4px",
          border: "1px solid #ccc",
          fontFamily: "Arial, sans-serif",
          fontSize: "14px",
          color: "#333",
        }}
      />
    </div>

    <div style={{ flex: "1", minWidth: "250px", marginBottom: "15px" }}>
      <label
        htmlFor="Polio"
        style={{ display: "block", fontWeight: "bold", marginBottom: "5px", color: "#333" }}
      >
        Polio:
      </label>
      <input
        type="text"
        name="newbornCare.immunizations.Polio"
        value={formData.newbornCare.immunizations.Polio}
        onChange={handleChange}
        id="Polio"
        style={{
          width: "100%",
          padding: "10px",
          borderRadius: "4px",
          border: "1px solid #ccc",
          fontFamily: "Arial, sans-serif",
          fontSize: "14px",
          color: "#333",
        }}
      />
    </div>
  </div>
</div>

<h3 style={{ fontWeight: "bold", marginBottom: "15px", color: "#333" }}>Mother's Care and Treatment</h3>

<div style={{ display: "flex", flexWrap: "wrap", gap: "20px", marginBottom: "20px" }}>
  <div style={{ flex: "1", minWidth: "250px", marginBottom: "15px" }}>
    <label
      htmlFor="ARVs"
      style={{ display: "block", fontWeight: "bold", marginBottom: "5px", color: "#333" }}
    >
      ARVs Given:
    </label>
    <textarea
      id="ARVs"
      name="ARVs"
      value={formData.ARVs}
      onChange={handleChange}
      placeholder="Enter details of ARVs given to the mother"
      rows="4"
      style={{
        width: "100%",
        padding: "10px",
        borderRadius: "4px",
        border: "1px solid #ccc",
        fontFamily: "Arial, sans-serif",
        fontSize: "14px",
        color: "#333",
        resize: "vertical",
      }}
    />
  </div>

  <div style={{ flex: "1", minWidth: "250px", marginBottom: "15px" }}>
    <label
      htmlFor="infectionSigns"
      style={{ display: "block", fontWeight: "bold", marginBottom: "5px", color: "#333" }}
    >
      Signs of Infection:
    </label>
    <textarea
      id="infectionSigns"
      name="infectionSigns"
      value={formData.infectionSigns}
      onChange={handleChange}
      placeholder="Describe any signs of infection observed"
      rows="4"
      style={{
        width: "100%",
        padding: "10px",
        borderRadius: "4px",
        border: "1px solid #ccc",
        fontFamily: "Arial, sans-serif",
        fontSize: "14px",
        color: "#333",
        resize: "vertical",
      }}
    />
  </div>
</div>

<div style={{ display: "flex", flexWrap: "wrap", gap: "20px", marginBottom: "20px" }}>
  <div style={{ flex: "1", minWidth: "250px", marginBottom: "15px" }}>
    <label
      htmlFor="postpartumCare"
      style={{ display: "block", fontWeight: "bold", marginBottom: "5px", color: "#333" }}
    >
      Postpartum Care Given:
    </label>
    <textarea
      id="postpartumCare"
      name="postpartumCare"
      value={formData.postpartumCare}
      onChange={handleChange}
      placeholder="Provide details of postpartum care given to the mother"
      rows="4"
      style={{
        width: "100%",
        padding: "10px",
        borderRadius: "4px",
        border: "1px solid #ccc",
        fontFamily: "Arial, sans-serif",
        fontSize: "14px",
        color: "#333",
        resize: "vertical",
      }}
    />
  </div>

  <div style={{ flex: "1", minWidth: "250px", marginBottom: "15px" }}>
    <label
      htmlFor="treatmentNewborn"
      style={{ display: "block", fontWeight: "bold", marginBottom: "5px", color: "#333" }}
    >
      Newborn Treatment:
    </label>
    <textarea
      id="treatmentNewborn"
      name="treatmentNewborn"
      value={formData.treatmentNewborn}
      onChange={handleChange}
      placeholder="Enter details of any treatment given to the newborn"
      rows="4"
      style={{
        width: "100%",
        padding: "10px",
        borderRadius: "4px",
        border: "1px solid #ccc",
        fontFamily: "Arial, sans-serif",
        fontSize: "14px",
        color: "#333",
        resize: "vertical",
      }}
    />
  </div>
</div>

<div style={{ marginBottom: "20px" }}>
  <label
    htmlFor="treatmentMother"
    style={{ display: "block", fontWeight: "bold", marginBottom: "5px", color: "#333" }}
  >
    Mother's Treatment:
  </label>
  <textarea
    id="treatmentMother"
    name="treatmentMother"
    value={formData.treatmentMother}
    onChange={handleChange}
    placeholder="Describe the treatment provided to the mother"
    rows="4"
    style={{
      width: "100%",
      padding: "10px",
      borderRadius: "4px",
      border: "1px solid #ccc",
      fontFamily: "Arial, sans-serif",
      fontSize: "14px",
      color: "#333",
      resize: "vertical",
    }}
  />
</div>

<h3 style={{ fontWeight: "bold", marginBottom: "15px", color: "#333" }}>Additional Information</h3>


  <div style={{ flex: "1", minWidth: "250px", marginBottom: "15px" }}>
    <label
      htmlFor="ward"
      style={{ display: "block", fontWeight: "bold", marginBottom: "5px", color: "#333" }}
    >
      Ward:
    </label>
    <textarea
      id="ward"
      name="ward"
      value={formData.ward}
      onChange={handleChange}
      placeholder="Enter the ward where the delivery took place"
      rows="4"
      style={{
        width: "100%",
        padding: "10px",
        borderRadius: "4px",
        border: "1px solid #ccc",
        fontFamily: "Arial, sans-serif",
        fontSize: "14px",
        color: "#333",
        resize: "vertical",
      }}
    />
  </div>
  <div style={{ flex: '1', minWidth: '250px', marginBottom: '15px' }}>
  <label
    htmlFor="deliveredBy"
    style={{
      display: 'block',
      fontWeight: 'bold',
      marginBottom: '5px',
      color: '#333',
    }}
  >
    Delivered By:
  </label>

  <Select
  id="deliveredBy"
  name="deliveredBy"
  value={employees.filter(employee => formData.deliveredBy.includes(employee.value))}
  onChange={handleSelectChange}
  options={employees} // Ensure this is an array of objects with `value` and `label`
  placeholder="Select the person who delivered the baby"
  isLoading={loading}
  isMulti
  styles={{
    control: (base) => ({
      ...base,
      padding: '10px',
      borderRadius: '4px',
      border: '1px solid #ccc',
    }),
    menu: (base) => ({
      ...base,
      maxHeight: '200px',
      overflowY: 'auto',
    }),
  }}
  noOptionsMessage={() => 'No employees found'}
  isClearable
/>


</div>

<div style={{ display: 'flex', justifyContent: 'space-between' }}>
  <button
    type="submit"
    disabled={isSubmitting}
    style={{
      backgroundColor: 'green',
      color: 'white',
      border: 'none',
      padding: '10px 20px',
      cursor: isSubmitting ? 'not-allowed' : 'pointer',
      opacity: isSubmitting ? 0.7 : 1,
      width: 'auto',
    }}
  >
    {isSubmitting ? 'Submitting...' : 'Submit'}
  </button>

  <button
    type="button"
    onClick={onClose}
    style={{
      backgroundColor: 'red',
      color: 'white',
      border: 'none',
      padding: '10px 20px',
      cursor: 'pointer',
      width: 'auto',
    }}
  >
    Close
  </button>
</div>

      </form>
    </div>
  );
};

export default LaborOutcomeForm;