import React, { useState, useEffect, useRef } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import { faPhone } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import 'react-toastify/dist/ReactToastify.css';
import Topbar from './Topbar';
import './DoctorsRoom.css';
import { urls } from './config.dev';
import { saveSessionToken } from './authUtils';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

function DoctorsRoom() {
    // State variable to track whether the "Save as New Patient" button has been clicked
    const [savePatientClicked, setSavePatientClicked] = useState(false);
    const navigate = useNavigate();
    const [classification, setClassification] = useState({ text: '', className: '' });
    const [confirmButtonDisabled, setConfirmButtonDisabled] = useState(true);
    const [selectedLabTests, setSelectedLabTests] = useState([]);
    const [selectedRadiologyExams, setSelectedRadiologyExams] = useState([]);
    
    // State variables
    const [employeeName, setEmployeeName] = useState('');
    const [patientDetails, setPatientDetails] = useState(null);
    const [patientName, setPatientName] = useState('');
    const [clinicalNotes, setClinicalNotes] = useState('');
    const [signsAndSymptoms, setSignsAndSymptoms] = useState('');
    const [labTests, setLabTests] = useState([]);
    const [drugs, setDrugs] = useState([]);
    const [selectedDrugs, setSelectedDrugs] = useState([]);
    
    // State variables for vitals
    const [bloodPressure, setBloodPressure] = useState('');
    const [temperature, setTemperature] = useState('');
    const [spo2, setSpo2] = useState('');
    const [bodyWeight, setBodyWeight] = useState('');
    const [selectedLabTest, setSelectedLabTest] = useState('');
    const [radiologyExams, setRadiologyExams] = useState([]);
    const [selectedRadiologyExam, setSelectedRadiologyExam] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [message, setMessage] = useState('');
    const [diagnosis, setDiagnosis] = useState('');
    const [recognition, setRecognition] = useState(null);
    const [diagnosisText, setDiagnosisText] = useState('');
    const textareaRef = useRef(null);
    const [readOnlyPatientDetails, setReadOnlyPatientDetails] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    const [treatmentPlan, setTreatmentPlan] = useState('');
    const [showAddPatientPrompt, setShowAddPatientPrompt] = useState(false);
    const [spo2Status, setSpo2Status] = useState('');
    const [systolicBloodPressure, setSystolicBloodPressure] = useState('');
    const [diastolicBloodPressure, setDiastolicBloodPressure] = useState('');
    const [bloodPressureClassification, setBloodPressureClassification] = useState('');
    const [spo2Classification, setSpo2Classification] = useState('');
    const [temperatureClassification, setTemperatureClassification] = useState('');
    const [respiratoryRateClassification, setRespiratoryRateClassification] = useState('');
    const [pulseRate, setPulseRate] = useState('');
    const [temperatureStatus, setTemperatureStatus] = useState('');
    const [respiratoryRate, setRespiratoryRate] = useState('');
    const [respiratoryRateStatus, setRespiratoryRateStatus] = useState('');
    const [height, setHeight] = useState('');
    const [bmi, setBmi] = useState('');
    const [bmiWarning, setBmiWarning] = useState('');
    const [pulseRateClassification, setPulseRateClassification] = useState({ text: '', className: '' });
    const [labTestSearch, setLabTestSearch] = useState("");
    const [radiologySearch, setRadiologySearch] = useState("");
    const [drugSearch, setDrugSearch] = useState("");
    const [selectedDrug, setSelectedDrug] = useState("");
    const [pulseRateStatus, setPulseRateStatus] = useState({ status: '', level: '' });
    const [bloodPressureStatus, setBloodPressureStatus] = useState({ status: '', level: '' });
    const [noDobProvided, setNoDobProvided] = useState(false);
    const [awaitingPatients, setAwaitingPatients] = useState([]);
    
    // Update the state variable newPatientDetails to include address and next of kin fields
    const [newPatientDetails, setNewPatientDetails] = useState({
        firstName: '',
        lastName: '',
        phoneNumber: '',
        years: '',
        months: '',
        weeks: '',
        sex: '',
        dob: '',
        religion: '',
        address: '',
        nextOfKinName: '',
        nextOfKinContact: '',
        nextOfKinRelationship: ''
    });

    useEffect(() => {
        const fetchEmployeeName = async () => {
            try {
                const params = new URLSearchParams(window.location.search);
                const tokenFromUrl = params.get('token');

                const securityResponse = await fetch(urls.security, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ token: tokenFromUrl }),
                });

                if (securityResponse.ok) {
                    const securityData = await securityResponse.json();

                    if (securityData.message === 'Session valid') {
                        setEmployeeName(securityData.employee_name);
                        saveSessionToken(securityData.clinic_session_token);
                        fetchAvailableLabTests();
                        fetchAvailableRadiologyTests();
                        fetchAwaitingPatients();
                        fetchAvailableDrugs();
                    } else if (securityData.error === 'Session expired') {
                        navigate(`/dashboard?token=${securityData.clinic_session_token}`);
                    } else {
                        navigate('/login');
                    }
                } else {
                    throw new Error('Failed to perform security check');
                }
            } catch (error) {
                console.error('Error performing security check:', error);
                navigate('/login');
            }
        };

        fetchEmployeeName();
    }, [navigate]);

    // Function to handle recognition results
    const handleRecognitionResult = (event) => {
        const transcript = Array.from(event.results)
            .map((result) => result[0].transcript)
            .join('');

        const activeElementId = document.activeElement.id;

        if (activeElementId === 'clinical-notes') {
            setClinicalNotes(transcript);
        } else if (activeElementId === 'signs-and-symptoms') {
            setSignsAndSymptoms(transcript);
        }
    };

    // Function to start speech recognition
    const startRecognition = (fieldId) => {
        const textarea = document.getElementById(fieldId);
        if (textarea && recognition && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            textarea.focus();
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(() => {
                    recognition.start();
                })
                .catch((error) => {
                    console.error('Error accessing microphone:', error);
                    alert('Error accessing microphone. Please check your browser settings.');
                });
        } else {
            console.error('getUserMedia is not supported in this environment');
            alert('Microphone access is not supported in this browser.');
        }
    };

    // Function to update read-only patient details
    const updateReadOnlyPatientDetails = (newDetails) => {
        setReadOnlyPatientDetails(newDetails);
    };

    // Function to display read-only fields on the dashboard
    const displayReadOnlyFields = () => {
        if (readOnlyPatientDetails) {
            return (
                <div className="read-only-fields-container">
                    <div className="input-container">
                        <label>Patient ID:</label>
                        <input type="text" value={readOnlyPatientDetails.contactId} readOnly />
                    </div>
                    <div className="input-container">
                        <label>First Name:</label>
                        <input type="text" value={readOnlyPatientDetails.firstName} readOnly />
                    </div>
                    <div className="input-container">
                        <label>Last Name:</label>
                        <input type="text" value={readOnlyPatientDetails.lastName} readOnly />
                    </div>
                    <div className="input-container">
                        <label>Phone Number:</label>
                        <input type="text" value={readOnlyPatientDetails.phoneNumber} readOnly />
                    </div>
                    <div className="input-container">
                        <label>Age (Years):</label>
                        <input type="text" value={readOnlyPatientDetails.years} readOnly />
                    </div>
                    <div className="input-container">
                        <label>Age (Months):</label>
                        <input type="text" value={readOnlyPatientDetails.months} readOnly />
                    </div>
                    <div className="input-container">
                        <label>Age (Weeks):</label>
                        <input type="text" value={readOnlyPatientDetails.weeks} readOnly />
                    </div>
                    <div className="input-container">
                        <label>Sex:</label>
                        <input type="text" value={readOnlyPatientDetails.sex} readOnly />
                    </div>
                    <div className="input-container">
                        <label>Religion:</label>
                        <input type="text" value={readOnlyPatientDetails.religion} readOnly />
                    </div>
                    <div className="input-container">
                        <label>Date of Birth:</label>
                        <input type="text" value={readOnlyPatientDetails.dob} readOnly />
                    </div>
                </div>
            );
        } else {
            return null;
        }
    };

    // Function to fetch patient details
    const fetchPatientDetails = async () => {
        try {
            const params = new URLSearchParams(window.location.search);
            const tokenFromUrl = params.get('token');

            const response = await fetch(`${urls.nameSuggestion}?name=${patientName}&token=${tokenFromUrl}`);
            
            if (response.ok) {
                const data = await response.json();
                
                if (data.exists) {
                    setReadOnlyPatientDetails(data.patientDetails);
                } else {
                    // Display option to register new patient
                }
            } else {
                console.error('Failed to fetch patient details:', response.statusText);
            }
        } catch (error) {
            console.error('Error fetching patient details:', error);
        }
    };
    
    // Function to handle suggesting patient names
    const handleSuggestName = async (name) => {
        try {
            const params = new URLSearchParams(window.location.search);
            const tokenFromUrl = params.get('token');

            const queryString = `?name=${encodeURIComponent(name)}&token=${tokenFromUrl}`;
            const response = await fetch(`${urls.suggest}${queryString}`);
            
            if (response.ok) {
                const data = await response.json();
                
                if (data.message && data.message === 'No patient records found for the specified clinic') {
                    setSuggestions([]);
                    setMessage('No patient records found');
                    setConfirmButtonDisabled(true);
                } else if (data.error === 'Name and token parameters are required') {
                    setSuggestions([]);
                    setMessage('No patient records found');
                    setConfirmButtonDisabled(true);
                } else {
                    setSuggestions(data);
                    setMessage('');
                }
            } else {
                const errorData = await response.json();
                
                if (errorData.error === "Name parameter is required") {
                    console.log("Name parameter is required");
                    return;
                }
                throw new Error('Failed to suggest names');
            }
        } catch (error) {
            console.error('Error suggesting names:', error.message);
            setSuggestions([]);
            setMessage('No patient records found');
        }
    };

    // Handle no DOB button click
    const handleNoDobClick = () => {
        setNoDobProvided(true);
        setNewPatientDetails(prev => ({
            ...prev,
            dob: '0001-01-01'
        }));
    };
    
    const addContact = async () => {
        if (savePatientClicked) {
            return;
        }

        setSavePatientClicked(true);

        if (
            !newPatientDetails.firstName ||
            !newPatientDetails.lastName ||
            !newPatientDetails.phoneNumber ||
            (!newPatientDetails.years && !newPatientDetails.months && !newPatientDetails.weeks) ||
            !newPatientDetails.sex ||
            !newPatientDetails.religion ||
            !newPatientDetails.address
        ) {
            toast.error('Please fill in all required fields including address and at least one age value.');
            setSavePatientClicked(false);
            return;
        }

        const params = new URLSearchParams(window.location.search);
        const tokenFromUrl = params.get('token');

        try {
            const response = await fetch(urls.addcontact5, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...newPatientDetails,
                    token: tokenFromUrl,
                    ageDetails: {
                        years: newPatientDetails.years || 0,
                        months: newPatientDetails.months || 0,
                        weeks: newPatientDetails.weeks || 0,
                    },
                }),
            });

            const data = await response.json();

            if (response.ok) {
                updateReadOnlyPatientDetails(data.patientDetails);
                toast.success(data.message);
                setSavePatientClicked(true);
                setShowAddPatientPrompt(false);
                setNoDobProvided(false);
            } else {
                throw new Error(data.message || 'Failed to add new patient');
            }
        } catch (error) {
            console.error('Error adding new patient:', error);
            toast.error(error.message || 'Oops! Something went wrong.');
            setSavePatientClicked(false);
        }
    };
    
    const handleSelectSuggestedPatient = (patient) => {
        setNewPatientDetails({
            firstName: patient.first_name,
            lastName: patient.last_name,
            contactId: patient.contact_id,
            phoneNumber: patient.phone_number,
            years: patient.age,
            months: patient.age_months,
            weeks: patient.age_weeks,
            sex: patient.sex,
            religion: patient.religion,
            dob: patient.dob || '',
            address: patient.address || '',
            nextOfKinName: patient.next_of_kin_name || '',
            nextOfKinContact: patient.next_of_kin_contact || '',
            nextOfKinRelationship: patient.next_of_kin_relationship || ''
        });

        setReadOnlyPatientDetails({
            firstName: patient.first_name,
            lastName: patient.last_name,
            contactId: patient.contact_id,
            phoneNumber: patient.phone_number,
            years: patient.age,
            months: patient.age_months,
            weeks: patient.age_weeks,
            sex: patient.sex,
            religion: patient.religion,
            dob: patient.dob || '',
            address: patient.address || '',
            nextOfKinName: patient.next_of_kin_name || '',
            nextOfKinContact: patient.next_of_kin_contact || '',
            nextOfKinRelationship: patient.next_of_kin_relationship || ''
        });

        setSuggestions([]);
        setNewPatientDetails({
            firstName: '',
            lastName: '',
            contactId: '',
            phoneNumber: '',
            years: '',
            months: '',
            weeks: '',
            sex: '',
            religion: '',
            dob: '',
            address: '',
            nextOfKinName: '',
            nextOfKinContact: '',
            nextOfKinRelationship: ''
        });
        setShowAddPatientPrompt(false);
        setNoDobProvided(false);
    };

    // Function to add lab test
    const addLabTest = () => {
        if (selectedLabTest !== '' && !labTests.includes(selectedLabTest)) {
            setLabTests([...labTests, selectedLabTest]);
        }
    };

    // Function to remove lab test
    const removeLabTest = (test) => {
        setLabTests(labTests.filter((item) => item !== test));
    };

    // Function to add radiology exam
    const addRadiologyExam = () => {
        if (selectedRadiologyExam !== '' && !radiologyExams.includes(selectedRadiologyExam)) {
            setRadiologyExams([...radiologyExams, selectedRadiologyExam]);
        }
    };

    // Function to remove radiology exam
    const removeRadiologyExam = (exam) => {
        setRadiologyExams(radiologyExams.filter((item) => item !== exam));
    };

    // Function to display random toast message
    const generateRandomToast = () => {
        const messages = [
            'Form is being submitted...',
            'Please wait, processing your request...',
            'Submitting your data, hang tight!',
        ];
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        toast.info(randomMessage);
    };
    
    const submitForm = async () => {
        try {
            generateRandomToast();
            setSubmitting(true);

            const params = new URLSearchParams(window.location.search);
            const tokenFromUrl = params.get('token');

            const formData = {
                contactId: readOnlyPatientDetails.contactId,
                clinicalNotes,
                signsAndSymptoms,
                bloodPressure,
                temperature,
                height: height || '',
                respiratory_rate: respiratoryRate || '',
                pulse_rate: pulseRate || '',
                spo2,
                bodyWeight,
                treatmentPlan,
                labTests: selectedLabTests,
                radiologyExams: selectedRadiologyExams,
                drugs: selectedDrugs.map((drug) => drug.drug_name || drug.name || drug.drugName),
                token: tokenFromUrl,
            };

            const submitResponse = await fetch(urls.submitpatient, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (submitResponse.ok) {
                const responseData = await submitResponse.json();
                if (responseData.message === 'Data inserted successfully') {
                    toast.success('Patient form submitted successfully');

                    setTimeout(() => {
                        setSubmitting(false);
                        navigate(`/patientfiles/?token=${tokenFromUrl}`);
                    }, 10000);
                } else {
                    console.error('Unexpected response from backend:', responseData);
                    toast.error('Unexpected response from server');
                    setSubmitting(false);
                }
            } else {
                setSubmitting(false);
                console.error('Error submitting patient data:', submitResponse.statusText);
                toast.error('Error submitting patient data');
            }
        } catch (error) {
            setSubmitting(false);
            console.error('Error submitting form:', error);
            toast.error('Error submitting form');
        }
    };

    // Fetch lab tests from backend when the component mounts
    useEffect(() => {
        fetchAvailableLabTests();
        fetchAvailableRadiologyTests();
    }, []);

    const fetchAvailableLabTests = () => {
        const params = new URLSearchParams(window.location.search);
        const tokenFromUrl = params.get('token');

        const payload = {
            token: tokenFromUrl,
        };

        fetch(urls.testsavailable, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch available lab tests');
            }
            return response.json();
        })
        .then(data => {
            setLabTests(data);
        })
        .catch(error => {
            console.error('Error fetching available lab tests:', error);
        });
    };

    const fetchAvailableRadiologyTests = () => {
        const params = new URLSearchParams(window.location.search);
        const tokenFromUrl = params.get('token');

        const payload = {
            token: tokenFromUrl,
        };

        fetch(urls.radiologytestsavailable, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch available radiology exams');
            }
            return response.json();
        })
        .then(data => {
            setRadiologyExams(data);
        })
        .catch(error => {
            console.error('Error fetching available radiology exams:', error);
        });
    };

    const fetchAvailableDrugs = () => {
        const params = new URLSearchParams(window.location.search);
        const tokenFromUrl = params.get('token');

        const payload = {
            token: tokenFromUrl,
        };

        fetch(urls.fetchdrugs, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch available drugs');
            }
            return response.json();
        })
        .then(data => {
            setDrugs(data);
        })
        .catch(error => {
            console.error('Error fetching available drugs:', error);
        });
    };

    // Function to add selected lab test
    const addSelectedLabTest = (test) => {
        setSelectedLabTests([...selectedLabTests, test]);
    };

    // Function to remove selected lab test
    const removeSelectedLabTest = (test) => {
        setSelectedLabTests(selectedLabTests.filter((item) => item !== test));
    };

    // Function to add selected radiology exam
    const addSelectedRadiologyExam = (exam) => {
        if (exam !== '' && !selectedRadiologyExams.some((selectedExam) => selectedExam.name === exam)) {
            const selectedExamObject = radiologyExams.find((e) => e.name === exam);
            if (selectedExamObject) {
                setSelectedRadiologyExams([...selectedRadiologyExams, selectedExamObject]);
            }
        }
    };

    // Function to remove selected radiology exam
    const removeSelectedRadiologyExam = (examToRemove) => {
        setSelectedRadiologyExams(selectedRadiologyExams.filter((exam) => exam.name !== examToRemove.name));
    };

    // Function to add selected drug
    const addSelectedDrug = (drug) => {
        if (drug !== '' && !selectedDrugs.some((selectedDrug) => selectedDrug.drug_name === drug)) {
            const selectedDrugObject = drugs.find((d) => d.drug_name === drug);
            if (selectedDrugObject) {
                setSelectedDrugs([...selectedDrugs, selectedDrugObject]);
            }
        }
    };

    // Function to remove selected drug
    const removeSelectedDrug = (drugToRemove) => {
        setSelectedDrugs(selectedDrugs.filter((drug) => drug.drug_name !== drugToRemove.drug_name));
    };

    const formatDate = (dateString) => {
        if (!dateString) {
            return '';
        }

        const date = new Date(dateString);

        if (isNaN(date.getTime())) {
            return '';
        }

        const formattedDate = date.toISOString().split('T')[0];
        return formattedDate;
    };
    
    const handleCancel = () => {
        setNewPatientDetails({
            firstName: '',
            lastName: '',
            contactId: '',
            phoneNumber: '',
            years: '',
            months: '',
            weeks: '',
            sex: '',
            religion: '',
            dob: '',
            address: '',
            nextOfKinName: '',
            nextOfKinContact: '',
            nextOfKinRelationship: ''
        });

        setShowAddPatientPrompt(false);
        setSuggestions([]);
        setNoDobProvided(false);
    };

    // Function to fetch awaiting patients from triage
    const fetchAwaitingPatients = async () => {
        try {
            const params = new URLSearchParams(window.location.search);
            const tokenFromUrl = params.get('token');

            const response = await fetch(`${urls.awaitingnames}?token=${tokenFromUrl}`);
            if (response.ok) {
                const data = await response.json();
                setAwaitingPatients(data);
            } else {
                console.error('Failed to fetch awaiting patients');
            }
        } catch (error) {
            console.error('Error fetching awaiting patients:', error);
        }
    };

    // Function to select a patient from the queue
    const selectPatientFromQueue = (patient) => {
        setReadOnlyPatientDetails({
            firstName: patient.first_name,
            lastName: patient.last_name,
            contactId: patient.contact_id,
            phoneNumber: patient.phone_number,
            years: patient.age,
            months: patient.age_months,
            weeks: patient.age_weeks,
            sex: patient.sex,
            religion: patient.religion,
            dob: patient.dob || '',
            address: patient.address || '',
            nextOfKinName: patient.next_of_kin_name || '',
            nextOfKinContact: patient.next_of_kin_contact || '',
            nextOfKinRelationship: patient.next_of_kin_relationship || ''
        });

        // Load triage data if available
        if (patient.appointment_details) {
            const details = patient.appointment_details;
            setSignsAndSymptoms(details.signs_and_symptoms || '');
            setClinicalNotes(details.clinical_notes || '');
            setBloodPressure(details.blood_pressure || '');
            setTemperature(details.temperature || '');
            setPulseRate(details.pulse_rate || '');
            setSpo2(details.spo2 || '');
            setRespiratoryRate(details.respiratory_rate || '');
            setHeight(details.height || '');
            setBodyWeight(details.body_weight || '');
        }

        // Load requested lab tests and radiology exams
        if (patient.lab_tests) {
            const labTestsArray = patient.lab_tests.split(';').map(test => test.trim()).filter(test => test);
            setSelectedLabTests(labTestsArray);
        }
        if (patient.radiology_exams) {
            const radiologyArray = patient.radiology_exams.split(',').map(exam => exam.trim()).filter(exam => exam);
            setSelectedRadiologyExams(radiologyArray);
        }
        if (patient.drugs) {
            const drugArray = Array.isArray(patient.drugs)
                ? patient.drugs.map(drug => ({ drug_name: drug }))
                : patient.drugs.split(/[;,\n]+/).map(name => ({ drug_name: name.trim() })).filter(item => item.drug_name);
            setSelectedDrugs(drugArray);
        }
    };
    
    // Function to classify pulse rate
    const classifyPulseRate = (pulseRate) => {
        if (pulseRate < 60) {
            return { status: 'Warning: Low Pulse Rate', level: 'low' };
        } else if (pulseRate > 100) {
            return { status: 'Warning: High Pulse Rate', level: 'high' };
        } else {
            return { status: 'Pulse Rate Normal', level: 'normal' };
        }
    };

    // Function to classify blood pressure
    const classifyBloodPressure = (bloodPressure) => {
        const [systolic, diastolic] = bloodPressure.split('/').map(Number);

        if (systolic < 90 || diastolic < 60) {
            return { status: 'Warning: Low Blood Pressure', level: 'low' };
        } else if (systolic > 140 || diastolic > 90) {
            return { status: 'Warning: High Blood Pressure', level: 'high' };
        } else {
            return { status: 'Blood Pressure Normal', level: 'normal' };
        }
    };

    // Effect to classify pulse rate when input changes
    useEffect(() => {
        const pulse = parseInt(pulseRate, 10);

        if (!isNaN(pulse)) {
            setPulseRateStatus(classifyPulseRate(pulse));
        } else {
            setPulseRateStatus({ status: '', level: '' });
        }
    }, [pulseRate]);

    // Effect to classify blood pressure when input changes
    useEffect(() => {
        if (bloodPressure.includes('/')) {
            setBloodPressureStatus(classifyBloodPressure(bloodPressure));
        } else {
            setBloodPressureStatus({ status: '', level: '' });
        }
    }, [bloodPressure]);
    
    useEffect(() => {
        const rate = parseInt(respiratoryRate, 10);
        if (!isNaN(rate)) {
            setRespiratoryRateStatus(classifyRespiratoryRate(rate));
        } else {
            setRespiratoryRateStatus('');
        }
    }, [respiratoryRate]);

    useEffect(() => {
        const spo2Value = parseFloat(spo2);
        if (!isNaN(spo2Value)) {
            setSpo2Status(classifySPO2(spo2Value));
        } else {
            setSpo2Status('');
        }
    }, [spo2]);

    // Function to classify temperature
    const classifyTemperature = (temperature) => {
        if (temperature < 35) {
            return 'Warning: Very Low Temperature';
        } else if (temperature >= 35 && temperature < 36.5) {
            return 'Warning: Low Temperature';
        } else if (temperature >= 36.5 && temperature <= 37.5) {
            return 'Temperature Normal';
        } else if (temperature > 37.5 && temperature <= 38.5) {
            return 'Warning: High Temperature';
        } else {
            return 'Warning: Very High Temperature';
        }
    };

    // Function to classify respiratory rate
    const classifyRespiratoryRate = (rate) => {
        if (rate < 12) {
            return 'Warning: Low Respiratory Rate';
        } else if (rate > 20) {
            return 'Warning: High Respiratory Rate';
        } else {
            return 'Respiratory Rate Normal';
        }
    };

    // Function to classify SPO2
    const classifySPO2 = (spo2) => {
        if (spo2 < 90) {
            return 'Warning: Low SPO2';
        } else {
            return 'SPO2 Normal';
        }
    };  

    const getBMIWarning = (bmi) => {
        if (bmi < 18.5) {
            return 'Warning: Underweight';
        } else if (bmi >= 18.5 && bmi <= 24.9) {
            return 'Normal: Healthy weight';
        } else if (bmi >= 25 && bmi <= 29.9) {
            return 'Warning: Overweight';
        } else if (bmi >= 30) {
            return 'Warning: Obese';
        }
        return '';
    };
    
    const calculateBMI = (weight, height) => {
        if (weight && height) {
            const heightInMeters = height / 100;
            return (weight / (heightInMeters * heightInMeters)).toFixed(2);
        }
        return '';
    };
    
    const styles = {
        lowSpo2: { color: 'red', fontWeight: 'bold' },
        normalSpo2: { color: 'green', fontWeight: 'bold' },
        lowRespiratoryRate: { color: 'red', fontWeight: 'bold' },
        normalRespiratoryRate: { color: 'green', fontWeight: 'bold' }
    };
    
    // Update BMI and warning message whenever bodyWeight or height changes
    useEffect(() => {
        const calculatedBmi = calculateBMI(bodyWeight, height);
        setBmi(calculatedBmi);
        setBmiWarning(getBMIWarning(calculatedBmi));
    }, [bodyWeight, height]);
    
    useEffect(() => {
        if (pulseRate.trim() === '') {
            setPulseRateClassification({ text: '', className: '' });
            return;
        }

        const pulse = parseInt(pulseRate, 10);

        if (!isNaN(pulse)) {
            setPulseRateClassification(classifyPulseRate(pulse));
        } else {
            setPulseRateClassification({ text: '', className: '' });
        }
    }, [pulseRate]);
    
    useEffect(() => {
        const temp = parseFloat(temperature);

        if (!isNaN(temp)) {
            setTemperatureStatus(classifyTemperature(temp));
        } else {
            setTemperatureStatus('');
        }
    }, [temperature]);
        
    useEffect(() => {
        setBloodPressureClassification(classifyBloodPressure(systolicBloodPressure, diastolicBloodPressure));
    }, [systolicBloodPressure, diastolicBloodPressure]);
    
    useEffect(() => {
        setSpo2Classification(classifySPO2(spo2));
    }, [spo2]);
    
    useEffect(() => {
        setTemperatureClassification(classifyTemperature(temperature));
    }, [temperature]);
    
    useEffect(() => {
        setRespiratoryRateClassification(classifyRespiratoryRate(respiratoryRate));
    }, [respiratoryRate]);
    
    useEffect(() => {
        setPulseRateClassification(classifyPulseRate(pulseRate));
    }, [pulseRate]);  
                
    useEffect(() => {
        const systolic = parseInt(systolicBloodPressure, 10);
        const diastolic = parseInt(diastolicBloodPressure, 10);

        if (!isNaN(systolic) && !isNaN(diastolic)) {
            setClassification(classifyBloodPressure(systolic, diastolic));
        } else {
            setClassification({ text: '', className: '' });
        }
    }, [systolicBloodPressure, diastolicBloodPressure]);

    // Optional section styles
    const optionalSectionStyle = {
        marginTop: '25px',
        padding: '20px',
        backgroundColor: '#f0f7f0',
        borderRadius: '8px',
        border: '1px solid #c3e6c3'
    };

    const optionalSectionHeadingStyle = {
        color: '#006400',
        textAlign: 'center',
        marginBottom: '20px',
        fontSize: '16px',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '1px'
    };

    const darkGreenButtonStyle = {
        backgroundColor: '#006400',
        color: 'white',
        padding: '10px 16px',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        marginRight: '8px',
        marginBottom: '8px',
        fontSize: '14px',
        fontWeight: '500',
        transition: 'all 0.3s ease',
        width: '100%'
    };

    return (
        <div className="doctors-room-body">
            <Topbar token={urlToken} />
            <div className="doctors-room-container2">
                <ToastContainer />
                <h1>Hi Doctor {employeeName} !</h1>
                
                {/* Awaiting Patients Queue */}
                {awaitingPatients.length > 0 && (
                    <div className="awaiting-patients-section" style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: '5px' }}>
                        <h2 style={{ color: '#856404', marginBottom: '10px' }}>Patients Awaiting Consultation</h2>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                            {awaitingPatients.map((patient, index) => (
                                <button
                                    key={index}
                                    onClick={() => selectPatientFromQueue(patient)}
                                    style={{
                                        padding: '10px 15px',
                                        backgroundColor: '#007bff',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '5px',
                                        cursor: 'pointer',
                                        fontSize: '14px'
                                    }}
                                >
                                    {patient.first_name} {patient.last_name}
                                    {patient.message && ` - ${patient.message}`}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                
                {/* Patient Details Section */}
                {displayReadOnlyFields()}
                
                <div className="patient-details-section">
                    <button onClick={() => setShowAddPatientPrompt(true)}>Insert Patient Details</button>
                    
                    {showAddPatientPrompt && (
                        <div className="doctors-modal-overlay">
                            <div className="doctors-modal-content">
                                <div className="transaction-prompt">
                                    <h2>Insert Patient Details</h2>

                                    {/* Input fields for new patient details */}
                                    <div className="doctors-input-container">
                                        <label>First Name:</label>
                                        <input
                                            type="text"
                                            placeholder="First Name"
                                            value={newPatientDetails.firstName}
                                            onChange={(e) => {
                                                setNewPatientDetails({ ...newPatientDetails, firstName: e.target.value });
                                                handleSuggestName(e.target.value);
                                            }}
                                            className="add-patient-input"
                                        />
                                    </div>

                                    {/* Display suggested names */}
                                    {suggestions.map((patient, index) => (
                                        <div
                                            key={index}
                                            onClick={() => handleSelectSuggestedPatient(patient)}
                                            className="suggestion-item"
                                        >
                                            {patient.first_name} {patient.last_name}
                                        </div>
                                    ))}

                                    {/* Other input fields for patient details */}
                                    <div className="input-container">
                                        <label>Last Name:</label>
                                        <input
                                            type="text"
                                            placeholder="Last Name"
                                            value={newPatientDetails.lastName}
                                            onChange={(e) => setNewPatientDetails({ ...newPatientDetails, lastName: e.target.value })}
                                            className="add-patient-input"
                                        />
                                    </div>

                                    <div className="input-container">
                                        <label>Phone Number:</label>
                                        <div className="input-with-icon">
                                            <FontAwesomeIcon icon={faPhone} className="input-icon" />
                                            <input
                                                type="number"
                                                placeholder="Phone Number"
                                                value={newPatientDetails.phoneNumber}
                                                onChange={(e) => setNewPatientDetails({ ...newPatientDetails, phoneNumber: e.target.value })}
                                                className="add-patient-input"
                                            />
                                        </div>
                                    </div>

                                    {/* Age Section */}
                                    <div
                                        className="input-container"
                                        style={{
                                            marginTop: "20px",
                                            padding: "10px",
                                            border: "1px solid #ddd",
                                            borderRadius: "5px",
                                            backgroundColor: "#f9f9f9",
                                        }}
                                    >
                                        <label style={{ marginBottom: "10px", display: "block" }}>Age:</label>
                                        <div
                                            className="age-inputs"
                                            style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}
                                        >
                                            <div className="age-input" style={{ flex: 1 }}>
                                                <label>Years:</label>
                                                <input
                                                    type="number"
                                                    placeholder="Years"
                                                    value={newPatientDetails.years}
                                                    onChange={(e) => setNewPatientDetails({ ...newPatientDetails, years: e.target.value })}
                                                    className="add-patient-input"
                                                    min="0"
                                                    style={{ width: "100%" }}
                                                />
                                            </div>
                                            <div className="age-input" style={{ flex: 1 }}>
                                                <label>Months:</label>
                                                <input
                                                    type="number"
                                                    placeholder="Months"
                                                    value={newPatientDetails.months}
                                                    onChange={(e) => setNewPatientDetails({ ...newPatientDetails, months: e.target.value })}
                                                    className="add-patient-input"
                                                    min="0"
                                                    style={{ width: "100%" }}
                                                />
                                            </div>
                                            <div className="age-input" style={{ flex: 1 }}>
                                                <label>Weeks:</label>
                                                <input
                                                    type="number"
                                                    placeholder="Weeks"
                                                    value={newPatientDetails.weeks}
                                                    onChange={(e) => setNewPatientDetails({ ...newPatientDetails, weeks: e.target.value })}
                                                    className="add-patient-input"
                                                    min="0"
                                                    style={{ width: "100%" }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="input-container">
                                        <label>Sex:</label>
                                        <select
                                            value={newPatientDetails.sex}
                                            onChange={(e) => setNewPatientDetails({ ...newPatientDetails, sex: e.target.value })}
                                            className="add-patient-input"
                                        >
                                            <option value="">Select Sex</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                        </select>
                                    </div>

                                    <div className="input-container">
                                        <label>Religion:</label>
                                        <select
                                            value={newPatientDetails.religion}
                                            onChange={(e) => setNewPatientDetails({ ...newPatientDetails, religion: e.target.value })}
                                            className="add-patient-input"
                                        >
                                            <option value="">Select Religion</option>
                                            <option value="Christian">Christian</option>
                                            <option value="Islamic">Islamic</option>
                                        </select>
                                    </div>

                                    <div className="input-container">
                                        <label>Address:</label>
                                        <input
                                            type="text"
                                            placeholder="Address"
                                            value={newPatientDetails.address}
                                            onChange={(e) => setNewPatientDetails({ ...newPatientDetails, address: e.target.value })}
                                            className="add-patient-input"
                                        />
                                    </div>

                                    {/* Date of Birth Section */}
                                    <div className="input-container">
                                        <label>Date of Birth (month/date/year):</label>
                                        {!noDobProvided ? (
                                            <>
                                                <input
                                                    type="date"
                                                    value={formatDate(newPatientDetails.dob)}
                                                    onChange={(e) => setNewPatientDetails({ ...newPatientDetails, dob: e.target.value })}
                                                    className="add-patient-input"
                                                />
                                                <button
                                                    onClick={handleNoDobClick}
                                                    style={darkGreenButtonStyle}
                                                >
                                                    No date of birth provided
                                                </button>
                                            </>
                                        ) : (
                                            <div style={{
                                                padding: '10px',
                                                backgroundColor: '#e8f5e8',
                                                borderRadius: '4px',
                                                marginBottom: '10px',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}>
                                                <span style={{ color: '#006400' }}>
                                                    Date of birth set to default (01/01/0001)
                                                </span>
                                                <button
                                                    onClick={() => {
                                                        setNoDobProvided(false);
                                                        setNewPatientDetails(prev => ({ ...prev, dob: '' }));
                                                    }}
                                                    style={{
                                                        backgroundColor: '#e74c3c',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        padding: '5px 10px',
                                                        cursor: 'pointer',
                                                        fontSize: '12px'
                                                    }}
                                                >
                                                    Undo
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Optional Section - Next of Kin Information */}
                                    <div style={optionalSectionStyle}>
                                        <h3 style={optionalSectionHeadingStyle}>OPTIONAL INFORMATION - NEXT OF KIN DETAILS</h3>
                                        
                                        <div className="input-container">
                                            <label>Next of Kin Name (Optional):</label>
                                            <input
                                                type="text"
                                                placeholder="Next of Kin Full Name"
                                                value={newPatientDetails.nextOfKinName}
                                                onChange={(e) => setNewPatientDetails({ ...newPatientDetails, nextOfKinName: e.target.value })}
                                                className="add-patient-input"
                                            />
                                        </div>

                                        <div className="input-container">
                                            <label>Relationship with Next of Kin (Optional):</label>
                                            <select
                                                value={newPatientDetails.nextOfKinRelationship}
                                                onChange={(e) => setNewPatientDetails({ ...newPatientDetails, nextOfKinRelationship: e.target.value })}
                                                className="add-patient-input"
                                            >
                                                <option value="">Select Relationship</option>
                                                <option value="Spouse">Spouse</option>
                                                <option value="Parent">Parent</option>
                                                <option value="Child">Child</option>
                                                <option value="Sibling">Sibling</option>
                                                <option value="Relative">Relative</option>
                                                <option value="Friend">Friend</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>

                                        <div className="input-container">
                                            <label>Next of Kin Contact (Optional):</label>
                                            <div className="input-with-icon">
                                                <FontAwesomeIcon icon={faPhone} className="input-icon" />
                                                <input
                                                    type="tel"
                                                    placeholder="Next of Kin Phone Number"
                                                    value={newPatientDetails.nextOfKinContact}
                                                    onChange={(e) => setNewPatientDetails({ ...newPatientDetails, nextOfKinContact: e.target.value })}
                                                    className="add-patient-input"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="transaction-buttons">
                                        <button onClick={handleCancel}>Cancel</button>
                                        <button onClick={addContact} disabled={savePatientClicked}>
                                            {savePatientClicked ? 'Please wait' : 'Save as New Patient'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="vitals-section textarea-container">
                    <h2>Patient Vitals</h2>
                    <div className="vitals-inputs">
                        <div className="vitals-inputs-top">
                            <div className="vital-input">
                                <label>Blood Pressure (Systolic/Diastolic):</label>    
                                <input
                                    type="text"
                                    placeholder="Enter Blood Pressure (e.g., 120/80)"
                                    value={bloodPressure}
                                    onChange={(e) => setBloodPressure(e.target.value)}
                                />
                                {bloodPressureStatus.status && (
                                    <div className={`classification-message ${bloodPressureStatus.level}-pressure`}>
                                        {bloodPressureStatus.status}
                                    </div>
                                )}
                            </div>
                            
                            <div className="vital-input">
                                <label>Pulse Rate (beats per minute):</label>
                                <input
                                    type="text"
                                    placeholder="Enter Pulse Rate"
                                    value={pulseRate}
                                    onChange={(e) => setPulseRate(e.target.value)}
                                />
                                {pulseRateStatus.status && (
                                    <div className={`classification-message ${pulseRateStatus.level}-pulse`}>
                                        {pulseRateStatus.status}
                                    </div>
                                )}
                            </div>

                            <div className="vital-input">
                                <label>Temperature (°C):</label>
                                <input
                                    type="text"
                                    placeholder="Enter Temperature"
                                    value={temperature}
                                    onChange={(e) => {
                                        setTemperature(e.target.value);
                                        setTemperatureStatus(classifyTemperature(e.target.value));
                                    }}
                                />
                                <p
                                    className="classification-message"
                                    style={{
                                        color: temperatureStatus === 'Warning: Very High Temperature'
                                            ? 'red'
                                            : temperatureStatus === 'Warning: High Temperature'
                                            ? 'orange'
                                            : 'green'
                                    }}
                                >
                                    {temperatureStatus}
                                </p>
                            </div>
                        </div>
                        
                        <div className="vitals-inputs-bottom">
                            <div className="vital-input">
                                <label>SPO2:</label>
                                <input
                                    type="text"
                                    placeholder="Enter SPO2"
                                    value={spo2}
                                    onChange={(e) => setSpo2(e.target.value)}
                                />
                                <p 
                                    className="classification-message" 
                                    style={spo2Status.includes('Warning') ? styles.lowSpo2 : styles.normalSpo2}
                                >
                                    {spo2Status}
                                </p>
                            </div>
                            
                            <div className="vital-input">
                                <label>Respiratory Rate:</label>
                                <input
                                    type="text"
                                    placeholder="Enter Respiratory Rate"
                                    value={respiratoryRate}
                                    onChange={(e) => setRespiratoryRate(e.target.value)}
                                />
                                <p 
                                    className="classification-message" 
                                    style={
                                        respiratoryRateStatus.includes('Warning') 
                                            ? styles.lowRespiratoryRate 
                                            : styles.normalRespiratoryRate
                                    }
                                >
                                    {respiratoryRateStatus}
                                </p>
                            </div>
                        
                            <div className="vital-input">
                                <label>Body Weight (kg):</label>
                                <input
                                    type="text"
                                    placeholder="Body Weight"
                                    value={bodyWeight}
                                    onChange={(e) => setBodyWeight(e.target.value)}
                                />
                            </div>
                            
                            <div className="vital-input">
                                <label>Height (cm):</label>
                                <input
                                    type="text"
                                    placeholder="Height"
                                    value={height}
                                    onChange={(e) => setHeight(e.target.value)}
                                />
                            </div>
                            
                            <div className="vital-container">
                                <div className="vital-input">
                                    <label>BMI:</label>
                                    <p className="bmi-value">
                                        {bmi ? bmi : 'Enter weight and height to calculate BMI'}
                                    </p>
                                </div>
                                {bmi && (
                                    <div className="vital-warning">
                                        <p className={`warning-message ${bmiWarning.includes('Warning') ? 'warning' : 'safe'}`}>
                                            {bmiWarning}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Signs and Symptoms Section */}
                <div className="signs-symptoms-section textarea-container">
                    <h2>Presenting Complaints</h2>
                    <textarea
                        id="signs-and-symptoms"
                        rows="4"
                        value={signsAndSymptoms}
                        onChange={(e) => setSignsAndSymptoms(e.target.value)}
                        placeholder="Enter patient presenting complaints here..."
                        style={{
                            fontSize: '20px',
                            fontFamily: 'Arial, sans-serif',
                            height: '150px',
                        }}
                    ></textarea>

                    <div className="clinical-notes-section textarea-container">
                        <h2>Clinical Notes</h2>
                        <textarea
                            id="clinical-notes"
                            rows="6"
                            value={clinicalNotes}
                            onChange={(e) => setClinicalNotes(e.target.value)}
                            placeholder="Enter clinical notes here..."
                            style={{
                                fontSize: '20px',
                                fontFamily: 'Arial, sans-serif',
                                height: '150px',
                            }}
                        ></textarea>
                    </div>
                </div>
           
                <div className="tests-container">
                    {/* Lab Tests Section */}
                    <div className="lab-tests-section">
                        <h2>Make a Lab request</h2>
                        <div className="lab-test-form">
                            <select
                                value={selectedLabTest}
                                onChange={(e) => {
                                    const test = e.target.value;
                                    setSelectedLabTest(test);
                                    if (test) {
                                        addSelectedLabTest(test);
                                        setSelectedLabTest("");
                                    }
                                }}
                            >
                                <option value="">Select Lab Test</option>
                                {labTests
                                    .filter(test => 
                                        test.name.toLowerCase().includes(labTestSearch.toLowerCase())
                                    )
                                    .sort((a, b) => a.name.localeCompare(b.name))
                                    .map((test, index) => (
                                        <option key={index} value={test.name}>
                                            {test.name} - UGX {test.price}
                                        </option>
                                    ))}
                            </select>
                        </div>
                        <div className="lab-test-list">
                            {selectedLabTests
                                .sort((a, b) => a.localeCompare(b))
                                .map((test, index) => (
                                    <div key={index} className="lab-test-item">
                                        <span>{test}</span>
                                        <button className="remove-button" onClick={() => removeSelectedLabTest(test)}>Remove</button>
                                    </div>
                                ))}
                        </div>
                    </div>

                    {/* Radiology Exams Section */}
                    <div className="radiology-exams-section">
                        <h2>Request For Ultrasound scan or Xray</h2>
                        <div className="radiology-exam-form">
                            <select
                                value={selectedRadiologyExam}
                                onChange={(e) => {
                                    const exam = e.target.value;
                                    setSelectedRadiologyExam(exam);
                                    if (exam) {
                                        addSelectedRadiologyExam(exam);
                                        setSelectedRadiologyExam("");
                                    }
                                }}
                            >
                                <option value="">Select Radiology Exam</option>
                                {radiologyExams
                                    .filter(exam => 
                                        exam.name.toLowerCase().includes(radiologySearch.toLowerCase()))
                                    .sort((a, b) => a.name.localeCompare(b.name))
                                    .map((exam, index) => (
                                        <option key={index} value={exam.name}>
                                            {exam.name} - {exam.price}
                                        </option>
                                    ))}
                            </select>
                        </div>
                        <div className="radiology-exam-list">
                            {selectedRadiologyExams
                                .sort((a, b) => a.name.localeCompare(b.name))
                                .map((exam, index) => (
                                    <div key={index} className="radiology-exam-item">
                                        <span>{exam.name} - {exam.price}</span>
                                        <button className="remove-button" onClick={() => removeSelectedRadiologyExam(exam)}>Remove</button>
                                    </div>
                                ))}
                        </div>
                    </div>

                    {/* Drugs Section */}
                    <div className="drugs-section">
                        <h2>Prescribe Drugs</h2>
                        <div className="drug-form">
                            <select
                                value={selectedDrug}
                                onChange={(e) => {
                                    const drug = e.target.value;
                                    setSelectedDrug(drug);
                                    if (drug) {
                                        addSelectedDrug(drug);
                                        setSelectedDrug("");
                                    }
                                }}
                            >
                                <option value="">Select Drug</option>
                                {drugs
                                    .filter(drug => 
                                        drug.drug_name.toLowerCase().includes(drugSearch.toLowerCase()))
                                    .sort((a, b) => a.drug_name.localeCompare(b.drug_name))
                                    .map((drug, index) => (
                                        <option key={index} value={drug.drug_name}>
                                            {drug.drug_name} - {drug.price_per_unit} UGX
                                        </option>
                                    ))}
                            </select>
                        </div>
                        <div className="drug-list">
                            {selectedDrugs
                                .sort((a, b) => a.drug_name.localeCompare(b.drug_name))
                                .map((drug, index) => (
                                    <div key={index} className="drug-item">
                                        <span>{drug.drug_name} - {drug.price_per_unit} UGX</span>
                                        <button className="remove-button" onClick={() => removeSelectedDrug(drug)}>Remove</button>
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <button onClick={submitForm} disabled={submitting}>
                    {submitting ? 'Submitting....' : 'Submit Patient File'}
                </button>
                
                <footer className="footer2">
                    This software was created by MEDCORE Systems. For support or help contact +256700123457 
                </footer>
            </div>
        </div>
    );
}

export default DoctorsRoom;
