import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { urls } from './config.dev';
import './contacts.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEdit, 
  faTrash, 
  faComment, 
  faWallet, 
  faCheckCircle, 
  faTimesCircle,
  faSpinner,
  faExclamationTriangle,
  faInfoCircle,
  faBolt,
  faWifi,
  faClock
} from '@fortawesome/free-solid-svg-icons';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import LoadingState from './LoadingState';
import Topbar from './Topbar';
import AddToWalletPrompt from './AddToWalletPrompt';

function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newContact, setNewContact] = useState({ 
    first_name: '', 
    last_name: '', 
    phone_number: '', 
    age: '', 
    sex: '', 
    dob: '', 
    religion: '', 
    address: '' 
  });
  const [message, setMessage] = useState('');
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [showSendMessagePrompt, setShowSendMessagePrompt] = useState(false);
  const [showAddContactPrompt, setShowAddContactPrompt] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showSendMessageToAllPrompt, setShowSendMessageToAllPrompt] = useState(false);
  const [messageToAllPatientsMuslims, setMessageToAllPatientsMuslims] = useState('');
  const [messageToAllPatientsChristians, setMessageToAllPatientsChristians] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [editContactVisible, setEditContactVisible] = useState(false);
  const [editedContact, setEditedContact] = useState({});
  const [clinicSessionToken, setClinicSessionToken] = useState('');
  const [token, setToken] = useState('');
  const navigate = useNavigate();
  const [canSendReminder, setCanSendReminder] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingContacts, setIsFetchingContacts] = useState(false);
  const params = new URLSearchParams(window.location.search);
  const urlToken = params.get('token');
  const [isWalletPromptOpen, setIsWalletPromptOpen] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState(null);
  const [showCategorySelectionPrompt, setShowCategorySelectionPrompt] = useState(false);
  const [selectedReligion, setSelectedReligion] = useState('');
  const [selectedCategories, setSelectedCategories] = useState(['active']);
  const [filteredContactsForMessaging, setFilteredContactsForMessaging] = useState([]);
  const [showRecipientList, setShowRecipientList] = useState(false);
  const [validNumbersCount, setValidNumbersCount] = useState(0);
  const [invalidNumbersCount, setInvalidNumbersCount] = useState(0);
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [resultsData, setResultsData] = useState(null);
  const [costPerMessage, setCostPerMessage] = useState(0);

  // Function to validate phone number format
  const isValidPhoneNumber = (number) => {
    if (!number) return false;
    // Check for 12 digits starting with 256
    if (/^256\d{9}$/.test(number)) return true;
    // Check for 10 digits starting with 0
    if (/^0\d{9}$/.test(number)) return true;
    // Check for 12 digits starting with +256
    if (/^\+256\d{9}$/.test(number)) return true;
    return false;
  };

  // Function to format phone number consistently
  const formatPhoneNumber = (number) => {
    if (!number) return '';
    const cleaned = number.replace(/\D/g, '');
    if (cleaned.startsWith('0') && cleaned.length === 10) {
      return '256' + cleaned.substring(1);
    }
    if (cleaned.startsWith('256') && cleaned.length === 12) {
      return cleaned;
    }
    return number;
  };

  // Custom Prompt Component
  const CustomPrompt = ({ 
    title, 
    message, 
    type = 'info', 
    onConfirm, 
    onCancel, 
    confirmText = 'Continue', 
    cancelText = 'Cancel',
    showCancel = true 
  }) => {
    const getIcon = () => {
      switch(type) {
        case 'warning': return faExclamationTriangle;
        case 'success': return faCheckCircle;
        case 'error': return faTimesCircle;
        default: return faInfoCircle;
      }
    };

    const getColor = () => {
      switch(type) {
        case 'warning': return '#f0ad4e';
        case 'success': return '#5cb85c';
        case 'error': return '#d9534f';
        default: return '#5bc0de';
      }
    };

    return (
      <div className="modal-overlay">
        <div className="modal-content" style={{ maxWidth: '500px' }}>
          <div className="transaction-prompt">
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <FontAwesomeIcon 
                icon={getIcon()} 
                style={{ 
                  fontSize: '48px', 
                  color: getColor(),
                  marginBottom: '15px' 
                }} 
              />
              <h2>{title}</h2>
            </div>
            
            <div style={{ 
              backgroundColor: '#f8f9fa', 
              padding: '15px', 
              borderRadius: '5px',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              <p style={{ margin: 0, fontSize: '16px' }}>{message}</p>
            </div>

            <div className="transaction-buttons" style={{ display: 'flex', justifyContent: 'space-between' }}>
              {showCancel && (
                <button 
                  onClick={onCancel} 
                  style={{ 
                    backgroundColor: '#6c757d', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '5px', 
                    padding: '10px 20px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  {cancelText}
                </button>
              )}
              <button 
                onClick={onConfirm} 
                style={{ 
                  backgroundColor: getColor(), 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '5px', 
                  padding: '10px 20px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  marginLeft: '10px'
                }}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Processing Modal Component
  const ProcessingModal = ({ message, showSpinner = true }) => (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
        <div className="transaction-prompt">
          {showSpinner && (
            <div style={{ marginBottom: '20px' }}>
              <FontAwesomeIcon 
                icon={faSpinner} 
                spin 
                style={{ fontSize: '48px', color: '#007bff' }} 
              />
            </div>
          )}
          <h3>Processing...</h3>
          <p>{message}</p>
          <p style={{ fontSize: '14px', color: '#6c757d', marginTop: '10px' }}>
            Please do not close this window
          </p>
        </div>
      </div>
    </div>
  );

  // Results Modal Component
  const ResultsModal = ({ data, onClose }) => {
    const { 
      success_count, 
      current_balance, 
      sent_names, 
      total_deduction_cost,
      total_recipients,
      valid_numbers_count,
      invalid_numbers_count,
      cost_per_message
    } = data;

    return (
      <div className="modal-overlay">
        <div className="modal-content" style={{ maxWidth: '800px', width: '90%' }}>
          <div className="transaction-prompt">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>Message Sending Results</h2>
              <button 
                onClick={onClose}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  fontSize: '24px', 
                  cursor: 'pointer',
                  color: '#6c757d'
                }}
              >
                &times;
              </button>
            </div>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '30px' }}>
              <div style={{ backgroundColor: '#d4edda', padding: '15px', borderRadius: '5px' }}>
                <div style={{ fontSize: '12px', color: '#155724', marginBottom: '5px' }}>Successful Messages</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#155724' }}>{success_count}</div>
              </div>
              
              <div style={{ backgroundColor: '#f8d7da', padding: '15px', borderRadius: '5px' }}>
                <div style={{ fontSize: '12px', color: '#721c24', marginBottom: '5px' }}>Invalid Numbers</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#721c24' }}>{invalid_numbers_count}</div>
              </div>
              
              <div style={{ backgroundColor: '#d1ecf1', padding: '15px', borderRadius: '5px' }}>
                <div style={{ fontSize: '12px', color: '#0c5460', marginBottom: '5px' }}>Total Cost</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0c5460' }}>UGX {total_deduction_cost.toLocaleString()}</div>
              </div>
              
              <div style={{ backgroundColor: '#fff3cd', padding: '15px', borderRadius: '5px' }}>
                <div style={{ fontSize: '12px', color: '#856404', marginBottom: '5px' }}>Cost per Message</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#856404' }}>UGX {cost_per_message.toLocaleString()}</div>
              </div>
            </div>

            {/* Detailed Breakdown */}
            <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
              <h4 style={{ marginTop: 0, color: '#495057' }}>Detailed Breakdown</h4>
              
              <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                <span>Total recipients found:</span>
                <span style={{ fontWeight: 'bold' }}>{total_recipients}</span>
              </div>
              
              <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                <span>Valid phone numbers:</span>
                <span style={{ fontWeight: 'bold', color: '#28a745' }}>{valid_numbers_count}</span>
              </div>
              
              <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                <span>Invalid phone numbers (not sent):</span>
                <span style={{ fontWeight: 'bold', color: '#dc3545' }}>{invalid_numbers_count}</span>
              </div>
              
              <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                <span>Cost per message:</span>
                <span style={{ fontWeight: 'bold' }}>UGX {cost_per_message.toLocaleString()}</span>
              </div>
              
              <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                <span>Total cost (valid numbers × cost per message):</span>
                <span style={{ fontWeight: 'bold' }}>UGX {total_deduction_cost.toLocaleString()}</span>
              </div>
              
              <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                <span>Current wallet balance:</span>
                <span style={{ fontWeight: 'bold', color: '#007bff' }}>UGX {current_balance.toLocaleString()}</span>
              </div>
            </div>

            {/* Recipients List */}
            {sent_names.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ color: '#495057', marginBottom: '10px' }}>Recipients ({sent_names.length})</h4>
                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #dee2e6', borderRadius: '5px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ backgroundColor: '#e9ecef' }}>
                      <tr>
                        <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>#</th>
                        <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Name</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sent_names.map((name, index) => (
                        <tr key={index} style={{ borderBottom: '1px solid #dee2e6' }}>
                          <td style={{ padding: '10px' }}>{index + 1}</td>
                          <td style={{ padding: '10px' }}>{name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div style={{ textAlign: 'center' }}>
              <button 
                onClick={onClose}
                style={{ 
                  backgroundColor: '#007bff', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '5px', 
                  padding: '10px 30px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    const fetchTokenAndCheckSecurity = async () => {
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
            setClinicSessionToken(securityData.clinic_session_token);

            if (securityData.clinic_session_token) {
              setToken(securityData.clinic_session_token);
              fetchContacts(securityData.clinic_session_token);
              fetchMessagingPermission();
            }
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

    fetchTokenAndCheckSecurity();
  }, [navigate]);

  const fetchContacts = async (token) => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tokenFromUrl = params.get('token');

      const response = await fetch(urls.fetchcontacts, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: tokenFromUrl }),
      });

      if (response.ok) {
        const data = await response.json();
        const sortedContacts = data.sort((a, b) => a.first_name.localeCompare(b.first_name));
        setContacts(sortedContacts);
        setFilteredContacts(sortedContacts);
      } else {
        console.error('Failed to fetch contacts:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  };

  const fetchFilteredContacts = async (religion, categories) => {
    setIsFetchingContacts(true);
    setProcessingMessage(`Fetching ${religion} patients (${categories.join(', ')})...`);
    setShowProcessingModal(true);

    try {
      const params = new URLSearchParams(window.location.search);
      const tokenFromUrl = params.get('token');

      const response = await fetch(urls.fetchcontacts2, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          token: tokenFromUrl,
          religion: religion,
          categories: categories
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        let validCount = 0;
        let invalidCount = 0;
        
        data.forEach(contact => {
          if (isValidPhoneNumber(contact.phone_number)) {
            validCount++;
          } else {
            invalidCount++;
          }
        });
        
        setValidNumbersCount(validCount);
        setInvalidNumbersCount(invalidCount);
        
        // Calculate cost per message
        const messageContent = religion === "Islamic" ? messageToAllPatientsMuslims : messageToAllPatientsChristians;
        const messageLength = messageContent.length;
        let cost = messageLength * 0.9;
        if (cost < 150) cost = 150;
        setCostPerMessage(cost);
        
        return data;
      } else {
        console.error('Failed to fetch filtered contacts:', response.statusText);
        return [];
      }
    } catch (error) {
      console.error('Error fetching filtered contacts:', error);
      return [];
    } finally {
      setIsFetchingContacts(false);
      setShowProcessingModal(false);
    }
  };

  const fetchMessagingPermission = async () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tokenFromUrl = params.get('token');

      if (!tokenFromUrl) {
        throw new Error('Token not found in URL parameters');
      }

      const response = await fetch(urls.messagingPermission, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: tokenFromUrl }),
      });

      if (response.ok) {
        const data = await response.json();
        setCanSendReminder(data.messages === 'yes');
      } else {
        throw new Error('Failed to fetch messaging permission');
      }
    } catch (error) {
      console.error('Error fetching messaging permission:', error.message);
    }
  };

  const editContact = (contact) => {
    setEditedContact(contact);
    setEditContactVisible(true);
  };
  
  const updateContact = async () => {
    setIsAddingContact(true);
  
    try {
      const params = new URLSearchParams(window.location.search);
      const tokenFromUrl = params.get('token');
  
      const response = await fetch(urls.editcontact, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...editedContact,
          contact_id: editedContact.contact_id,
          token: tokenFromUrl,
        }),
      });
  
      const responseData = await response.json();
  
      if (response.ok) {
        setEditContactVisible(false);
        fetchContacts(tokenFromUrl);
        toast.success(responseData.message || 'Contact updated successfully');
      } else {
        toast.error('Failed to update contact');
      }
    } catch (error) {
      console.error('Error editing contact:', error);
      toast.error('Error updating contact');
    } finally {
      setIsAddingContact(false);
    }
  };
  
  const addContact = async () => {
    if (!newContact.first_name || !newContact.last_name || !newContact.phone_number || !newContact.age || !newContact.sex || !newContact.dob || !newContact.religion) {
      toast.error('Please fill in all required fields');
      return;
    }
  
    setIsAddingContact(true);
  
    try {
      const params = new URLSearchParams(window.location.search);
      const tokenFromUrl = params.get('token');
  
      const response = await fetch(urls.addcontact, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newContact,
          token: tokenFromUrl
        }),
      });
  
      const responseData = await response.json();
  
      if (response.ok) {
        setShowAddContactPrompt(false);
        fetchContacts(tokenFromUrl);
        toast.success(responseData.message || 'Contact added successfully');
      } else {
        toast.error('Failed to add contact');
      }
    } catch (error) {
      console.error('Error adding contact:', error);
      toast.error('Error adding contact');
    } finally {
      setIsAddingContact(false);
    }
  };
  
  const removeContact = async (contactId, phoneNumber) => {
    const confirmed = await new Promise(resolve => {
      const CustomConfirm = () => (
        <CustomPrompt
          title="Confirm Removal"
          message="Are you sure you want to remove this contact? This action cannot be undone."
          type="warning"
          onConfirm={() => resolve(true)}
          onCancel={() => resolve(false)}
          confirmText="Yes, Remove"
          cancelText="Cancel"
        />
      );
      
      // You would need to implement a way to show this custom confirm
      // For now, using window.confirm as fallback
      resolve(window.confirm('Are you sure you want to remove this contact?'));
    });

    if (confirmed) {
      try {
        const params = new URLSearchParams(window.location.search);
        const tokenFromUrl = params.get('token');

        const response = await fetch(urls.removecontact, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contactId,
            phoneNumber,
            token: tokenFromUrl
          }),
        });

        if (response.ok) {
          const updatedContacts = contacts.filter(contact => contact.contact_id !== contactId);
          setContacts(updatedContacts);
          setFilteredContacts(updatedContacts);
          toast.success('Contact removed successfully');
        } else {
          toast.error('Failed to remove contact');
        }
      } catch (error) {
        console.error('Error removing contact:', error);
        toast.error('Error removing contact');
      }
    }
  };
  
  const sendMessage = async (phoneNumber) => {
    setShowSendMessagePrompt(true);
    setPhoneNumber(phoneNumber);
  };

  const sendActualMessage = async (phoneNumber) => {
    setIsLoading(true);
  
    try {
      const params = new URLSearchParams(window.location.search);
      const tokenFromUrl = params.get("token");

      const messageLength = message.length;
      let costPerSms = messageLength * 0.9;
      if (costPerSms < 150) costPerSms = 150;

      const shouldContinue = await new Promise(resolve => {
        const customPrompt = (
          <CustomPrompt
            title="Message Sending Summary"
            message={`
📢 **Message Details:**
------------------------------------
💬 Message Length: **${messageLength} characters**
💰 Estimated Cost: **UGX ${costPerSms.toLocaleString()}**

⚠️ **Important Notes:**
• Ensure your wallet balance is sufficient
• Make sure you have a stable internet connection
• Do not close this page during sending
            `}
            type="info"
            onConfirm={() => resolve(true)}
            onCancel={() => resolve(false)}
            confirmText="Send Message"
            cancelText="Cancel"
          />
        );
        
        // Show custom prompt - in a real implementation, you'd render this component
        // For now, using confirm as fallback
        resolve(window.confirm(`Send message? Cost: UGX ${costPerSms.toLocaleString()}`));
      });

      if (!shouldContinue) {
        setIsLoading(false);
        setShowSendMessagePrompt(false);
        return;
      }

      setProcessingMessage("Sending message... Please wait");
      setShowProcessingModal(true);

      const response = await fetch(urls.sendSMS, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: tokenFromUrl,
          phone: phoneNumber,
          message: message,
        }),
      });

      const data = await response.json();

      setShowProcessingModal(false);

      if (data.message === "SMS sent successfully") {
        toast.success("📩 SMS sent successfully!");
      } else {
        toast.error("Failed to send SMS. Try again.");
      }
    } catch (error) {
      setShowProcessingModal(false);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const sendMessageToAllPatients = async (religion) => {
    setSelectedReligion(religion);
    setShowCategorySelectionPrompt(true);
  };

  const handleCategorySelection = async () => {
    if (selectedCategories.length === 0) {
      toast.error('Please select at least one category');
      return;
    }

    setShowCategorySelectionPrompt(false);
    
    const fetchedContacts = await fetchFilteredContacts(selectedReligion, selectedCategories);
    setFilteredContactsForMessaging(fetchedContacts);
    
    setNewContact({ ...newContact, religion: selectedReligion });
    setShowRecipientList(true);
  };

  const handleCategoryChange = (category) => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(cat => cat !== category);
      } else {
        return [...prev, category];
      }
    });
  };
  
  const proceedToMessageComposition = () => {
    setShowRecipientList(false);
    setShowSendMessageToAllPrompt(true);
  };
  
  const showSendConfirmation = async () => {
    const messageContent = selectedReligion === "Islamic" ? messageToAllPatientsMuslims : messageToAllPatientsChristians;
    
    if (!messageContent.trim()) {
      toast.error('Please enter a message');
      return;
    }

    const messageLength = messageContent.length;
    let costPerMessage = messageLength * 0.9;
    if (costPerMessage < 150) costPerMessage = 150;

    const totalCost = costPerMessage * validNumbersCount;

    const warningMessage = `
🚨 **IMPORTANT: Read Before Sending**
------------------------------------
📊 **Message Statistics:**
• Religion: **${selectedReligion}**
• Categories: **${selectedCategories.join(', ')}**
• Total Contacts Found: **${filteredContactsForMessaging.length}**
• ✅ Valid Numbers: **${validNumbersCount}**
• ❌ Invalid Numbers: **${invalidNumbersCount}**
• 📝 Message Length: **${messageLength} characters**
• 💰 Cost per Message: **UGX ${costPerMessage.toLocaleString()}**
• 💸 Total Estimated Cost: **UGX ${totalCost.toLocaleString()}**

⚠️ **REQUIREMENTS FOR SENDING:**
1. Stable internet connection required
2. Do not close this page during sending
3. Laptop/desktop with uninterrupted power supply recommended
4. This may take several minutes for large batches
5. Ensure sufficient wallet balance

⏳ **Processing Time:**
• Small batches (<50): 1-2 minutes
• Medium batches (50-200): 2-5 minutes
• Large batches (>200): 5+ minutes

Messages will only be sent to valid phone numbers.
    `;

    const shouldProceed = await new Promise(resolve => {
      const customPrompt = (
        <CustomPrompt
          title="Final Confirmation Required"
          message={warningMessage}
          type="warning"
          onConfirm={() => resolve(true)}
          onCancel={() => resolve(false)}
          confirmText="Yes, Send Messages"
          cancelText="Review Again"
        />
      );
      
      // Show custom prompt
      // For now, using confirm as fallback
      resolve(window.confirm(warningMessage));
    });

    if (shouldProceed) {
      await sendToAllPatients();
    }
  };
  
  const sendToAllPatients = async () => {
    setIsLoading(true);
    setShowSendMessageToAllPrompt(false);
    setProcessingMessage("Sending messages... This may take several minutes. Please do not close this window.");
    setShowProcessingModal(true);
  
    try {
      const params = new URLSearchParams(window.location.search);
      const tokenFromUrl = params.get("token");

      const allNumbers = filteredContactsForMessaging.map(contact => contact.phone_number);
      const validNumbersSet = new Set();
      const invalidNumbers = [];

      allNumbers.forEach(number => {
        if (/^07\d{8}$/.test(number) || /^2567\d{8}$/.test(number)) {
          validNumbersSet.add(number);
        } else {
          invalidNumbers.push(number);
        }
      });

      const validNumbers = Array.from(validNumbersSet);
      const messageContent = selectedReligion === "Islamic" ? messageToAllPatientsMuslims : messageToAllPatientsChristians;
      const messageLength = messageContent.length;
      let costPerSms = messageLength * 0.9;
      if (costPerSms < 150) costPerSms = 150;

      const payload = {
        phoneNumbers: validNumbers,
        message: messageContent,
        token: tokenFromUrl,
      };

      const response = await fetch(urls.whatsappall, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      setShowProcessingModal(false);

      if (response.ok) {
        const responseData = await response.json();
        
        // Format results data
        const results = {
          success_count: responseData.success_count,
          current_balance: responseData.current_balance,
          sent_names: responseData.sent_names || [],
          total_deduction_cost: responseData.total_deduction_cost,
          total_recipients: filteredContactsForMessaging.length,
          valid_numbers_count: validNumbersCount,
          invalid_numbers_count: invalidNumbersCount,
          cost_per_message: costPerSms
        };
        
        setResultsData(results);
        setShowResultsModal(true);
      } else {
        toast.error(`Failed to send messages: ${response.statusText}`);
      }
    } catch (error) {
      setShowProcessingModal(false);
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    filterContacts(query);
  };

  const filterContacts = (query) => {
    if (!query) {
      setFilteredContacts(contacts);
    } else {
      const filteredContacts = contacts.filter(contact =>
        contact.first_name.toLowerCase().startsWith(query.toLowerCase())
      );
      setFilteredContacts(filteredContacts);
    }
  };

  const handleAddToWalletClick = (contactId) => {
    setSelectedContactId(contactId);
    setIsWalletPromptOpen(true);
  };
  
  const inputStyle = {
    width: "100%",
    padding: "8px",
    marginTop: "5px",
    border: "1px solid #ccc",
    borderRadius: "0px",
    fontSize: "16px",
  };
  
  const buttonStyle = {
    padding: "10px 15px",
    backgroundColor: "#007BFF",
    color: "white",
    border: "none",
    borderRadius: "0px",
    cursor: "pointer",
    fontSize: "16px",
  };

  return (
    <div>
      <ToastContainer />
      <div className="contacts-scrollable-container"
        style={{
          backgroundColor: "white",
          padding: "10px",
          borderRadius: "8px"
        }}
      >
        <Topbar token={urlToken} />
        <h1 className="page-title" style={{ marginTop: '60px' }}>ALL CLIENT DETAILS</h1>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "10px",
            backgroundColor: "#f8f9fa",
            borderRadius: "0px",
            boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
            width: "100%",
            maxWidth: "400px",
            margin: "20px auto",
          }}
        >
          <input
            type="text"
            placeholder="Search contact by name"
            value={searchQuery}
            onChange={handleSearchChange}
            style={{
              width: "100%",
              padding: "10px",
              fontSize: "16px",
              border: "1px solid #ccc",
              borderRadius: "5px",
              outline: "none",
              transition: "border-color 0.3s",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#007bff")}
            onBlur={(e) => (e.target.style.borderColor = "#ccc")}
          />
        </div>

        {/* Processing Modal */}
        {showProcessingModal && (
          <ProcessingModal message={processingMessage} showSpinner={isFetchingContacts || isLoading} />
        )}

        {/* Results Modal */}
        {showResultsModal && resultsData && (
          <ResultsModal 
            data={resultsData} 
            onClose={() => {
              setShowResultsModal(false);
              setResultsData(null);
            }} 
          />
        )}

        {/* Recipient List Modal */}
        {showRecipientList && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '800px', width: '90%' }}>
              <div className="transaction-prompt">
                <h2>Recipient List for {selectedReligion} Patients</h2>
                <p>Categories: {selectedCategories.join(', ')}</p>
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(2, 1fr)', 
                  gap: '15px', 
                  marginBottom: '20px' 
                }}>
                  <div style={{ backgroundColor: '#d4edda', padding: '15px', borderRadius: '5px' }}>
                    <div style={{ fontSize: '14px', color: '#155724' }}>Valid Numbers</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#155724' }}>
                      {validNumbersCount}
                    </div>
                  </div>
                  <div style={{ backgroundColor: '#f8d7da', padding: '15px', borderRadius: '5px' }}>
                    <div style={{ fontSize: '14px', color: '#721c24' }}>Invalid Numbers</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#721c24' }}>
                      {invalidNumbersCount}
                    </div>
                  </div>
                </div>
                
                <div style={{ maxHeight: '400px', overflowY: 'auto', margin: '20px 0' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f2f2f2' }}>
                        <th style={{ padding: '10px', border: '1px solid #ddd' }}>Name</th>
                        <th style={{ padding: '10px', border: '1px solid #ddd' }}>Age</th>
                        <th style={{ padding: '10px', border: '1px solid #ddd' }}>Phone Number</th>
                        <th style={{ padding: '10px', border: '1px solid #ddd' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredContactsForMessaging.map((contact, index) => (
                        <tr key={index} style={{ borderBottom: '1px solid #ddd' }}>
                          <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                            {contact.first_name} {contact.last_name}
                          </td>
                          <td style={{ padding: '10px', border: '1px solid #ddd' }}>{contact.age}</td>
                          <td style={{ padding: '10px', border: '1px solid #ddd' }}>{contact.phone_number}</td>
                          <td style={{ padding: '10px', border: '1px solid #ddd', 
                              color: isValidPhoneNumber(contact.phone_number) ? 'green' : 'red' }}>
                            {isValidPhoneNumber(contact.phone_number) ? (
                              <span><FontAwesomeIcon icon={faCheckCircle} /> Valid</span>
                            ) : (
                              <span><FontAwesomeIcon icon={faTimesCircle} /> Invalid</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="transaction-buttons" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <button 
                    onClick={() => setShowRecipientList(false)} 
                    style={{ 
                      backgroundColor: 'red', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '5px', 
                      padding: '10px 20px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={proceedToMessageComposition} 
                    style={{ 
                      backgroundColor: 'green', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '5px', 
                      padding: '10px 20px',
                      cursor: 'pointer',
                      marginLeft: '10px'
                    }}
                  >
                    Continue to Message Composition
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Category Selection Modal */}
        {showCategorySelectionPrompt && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="transaction-prompt">
                <h2>Select {selectedReligion} Patient Categories</h2>
                <p>Choose which categories of {selectedReligion} patients to send messages to:</p>
                
                <div style={{ margin: '20px 0' }}>
                  {['active', 'inactive', 'lost'].map((category) => (
                    <label key={category} style={{ display: 'block', marginBottom: '15px' }}>
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category)}
                        onChange={() => handleCategoryChange(category)}
                        style={{ marginRight: '10px' }}
                      />
                      {category.charAt(0).toUpperCase() + category.slice(1)} Patients
                    </label>
                  ))}
                </div>

                <div className="transaction-buttons">
                  <button 
                    onClick={() => {
                      setShowCategorySelectionPrompt(false);
                      setSelectedCategories(['active']);
                    }} 
                    style={{ 
                      backgroundColor: '#6c757d', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '5px', 
                      padding: '10px 20px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleCategorySelection} 
                    style={{ 
                      backgroundColor: '#28a745', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '5px', 
                      padding: '10px 20px',
                      cursor: 'pointer',
                      marginLeft: '10px'
                    }}
                  >
                    Continue
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Send Message Modal */}
        {showSendMessagePrompt && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="transaction-prompt">
                <h2>Send Message</h2>
                <div style={{ marginBottom: '15px' }}>
                  <div style={{ 
                    backgroundColor: '#f8f9fa', 
                    padding: '10px', 
                    borderRadius: '5px',
                    marginBottom: '10px'
                  }}>
                    <strong>To:</strong> {phoneNumber}
                  </div>
                  <textarea
                    rows="6"
                    placeholder="Type your message here"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      fontSize: '14px',
                      border: '1px solid #ccc',
                      borderRadius: '5px',
                      fontFamily: '"Roboto", sans-serif',
                      resize: 'vertical'
                    }}
                  />
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#6c757d', 
                    marginTop: '5px',
                    textAlign: 'right'
                  }}>
                    Characters: {message.length}
                  </div>
                </div>

                <div className="transaction-buttons">
                  {isLoading ? (
                    <LoadingState />
                  ) : (
                    <>
                      <button 
                        onClick={() => setShowSendMessagePrompt(false)} 
                        style={{ 
                          backgroundColor: '#6c757d', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: '5px', 
                          padding: '10px 20px',
                          cursor: 'pointer'
                        }}
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={() => sendActualMessage(phoneNumber)} 
                        disabled={!message.trim()}
                        style={{ 
                          backgroundColor: message.trim() ? '#28a745' : '#cccccc',
                          color: 'white', 
                          border: 'none', 
                          borderRadius: '5px', 
                          padding: '10px 20px',
                          cursor: message.trim() ? 'pointer' : 'not-allowed',
                          marginLeft: '10px'
                        }}
                      >
                        Send Message
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Send to All Modal */}
        {showSendMessageToAllPrompt && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="transaction-prompt">
                <h2>Send Message to {selectedReligion} Patients</h2>
                
                <div style={{ 
                  backgroundColor: '#f8f9fa', 
                  padding: '15px', 
                  borderRadius: '5px',
                  marginBottom: '20px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span>Categories:</span>
                    <span style={{ fontWeight: 'bold' }}>{selectedCategories.join(', ')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span>Total Recipients:</span>
                    <span style={{ fontWeight: 'bold' }}>{filteredContactsForMessaging.length}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Valid Numbers:</span>
                    <span style={{ fontWeight: 'bold', color: '#28a745' }}>{validNumbersCount}</span>
                  </div>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <textarea
                    rows="8"
                    placeholder={`Type your message for ${selectedReligion} patients...`}
                    value={selectedReligion === 'Islamic' ? messageToAllPatientsMuslims : messageToAllPatientsChristians}
                    onChange={(e) =>
                      selectedReligion === 'Islamic'
                        ? setMessageToAllPatientsMuslims(e.target.value)
                        : setMessageToAllPatientsChristians(e.target.value)
                    }
                    style={{
                      width: '100%',
                      padding: '10px',
                      fontSize: '14px',
                      border: '1px solid #ccc',
                      borderRadius: '5px',
                      fontFamily: '"Roboto", sans-serif',
                      resize: 'vertical'
                    }}
                  />
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#6c757d', 
                    marginTop: '5px',
                    textAlign: 'right'
                  }}>
                    Characters: {selectedReligion === 'Islamic' ? messageToAllPatientsMuslims.length : messageToAllPatientsChristians.length}
                  </div>
                </div>

                <div style={{ 
                  backgroundColor: '#fff3cd', 
                  padding: '15px', 
                  borderRadius: '5px',
                  marginBottom: '20px',
                  borderLeft: '4px solid #ffc107'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                    <FontAwesomeIcon icon={faBolt} style={{ marginRight: '10px', color: '#ffc107' }} />
                    <strong>Power & Network Requirements:</strong>
                  </div>
                  <ul style={{ margin: '5px 0 0 20px', fontSize: '14px' }}>
                    <li>Stable internet connection required</li>
                    <li>Uninterrupted power supply recommended</li>
                    <li>Do not close this page during sending</li>
                    <li>This may take several minutes for large batches</li>
                  </ul>
                </div>

                <div className="transaction-buttons">
                  {isLoading ? (
                    <LoadingState />
                  ) : (
                    <>
                      <button 
                        onClick={() => setShowSendMessageToAllPrompt(false)} 
                        style={{ 
                          backgroundColor: '#6c757d', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: '5px', 
                          padding: '10px 20px',
                          cursor: 'pointer'
                        }}
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={showSendConfirmation}
                        disabled={!messageToAllPatientsMuslims.trim() && !messageToAllPatientsChristians.trim()}
                        style={{ 
                          backgroundColor: (messageToAllPatientsMuslims.trim() || messageToAllPatientsChristians.trim()) ? '#007bff' : '#cccccc',
                          color: 'white', 
                          border: 'none', 
                          borderRadius: '5px', 
                          padding: '10px 20px',
                          cursor: (messageToAllPatientsMuslims.trim() || messageToAllPatientsChristians.trim()) ? 'pointer' : 'not-allowed',
                          marginLeft: '10px'
                        }}
                      >
                        Review & Send
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Contact Modal */}
        {showAddContactPrompt && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '500px' }}>
              <div className="transaction-prompt">
                <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Add New Contact</h2>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                  <label>
                    First Name*
                    <input
                      type="text"
                      value={newContact.first_name}
                      onChange={(e) => setNewContact({ ...newContact, first_name: e.target.value })}
                      style={inputStyle}
                    />
                  </label>

                  <label>
                    Last Name*
                    <input
                      type="text"
                      value={newContact.last_name}
                      onChange={(e) => setNewContact({ ...newContact, last_name: e.target.value })}
                      style={inputStyle}
                    />
                  </label>

                  <label style={{ gridColumn: 'span 2' }}>
                    Phone Number*
                    <input
                      type="text"
                      value={newContact.phone_number}
                      onChange={(e) => setNewContact({ ...newContact, phone_number: e.target.value.replace(/\D/, "") })}
                      style={inputStyle}
                    />
                  </label>

                  <label style={{ gridColumn: 'span 2' }}>
                    Address
                    <input
                      type="text"
                      value={newContact.address}
                      onChange={(e) => setNewContact({ ...newContact, address: e.target.value })}
                      style={inputStyle}
                    />
                  </label>

                  <label>
                    Age*
                    <input
                      type="number"
                      value={newContact.age}
                      onChange={(e) => setNewContact({ ...newContact, age: e.target.value.replace(/\D/, "") })}
                      style={inputStyle}
                    />
                  </label>

                  <label>
                    Sex*
                    <select
                      value={newContact.sex}
                      onChange={(e) => setNewContact({ ...newContact, sex: e.target.value })}
                      style={inputStyle}
                    >
                      <option value="">Select Sex</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </label>

                  <label>
                    Date of Birth*
                    <input
                      type="date"
                      value={newContact.dob}
                      onChange={(e) => setNewContact({ ...newContact, dob: e.target.value })}
                      style={inputStyle}
                    />
                  </label>

                  <label>
                    Religion*
                    <select
                      value={newContact.religion}
                      onChange={(e) => setNewContact({ ...newContact, religion: e.target.value })}
                      style={inputStyle}
                    >
                      <option value="">Select Religion</option>
                      <option value="Christian">Christian</option>
                      <option value="Islamic">Islamic</option>
                    </select>
                  </label>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px" }}>
                  <button
                    onClick={() => setShowAddContactPrompt(false)}
                    style={{ ...buttonStyle, backgroundColor: "#6c757d", borderRadius: "5px" }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addContact}
                    disabled={isAddingContact}
                    style={{ ...buttonStyle, backgroundColor: "#28a745", borderRadius: "5px" }}
                  >
                    {isAddingContact ? "Adding..." : "Add Contact"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="custom-button-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
          <button 
            onClick={() => sendMessageToAllPatients('Islamic')} 
            disabled={!canSendReminder}
            style={{ 
              backgroundColor: canSendReminder ? '#17a2b8' : '#cccccc',
              color: 'white', 
              borderRadius: '5px', 
              padding: '10px 15px', 
              border: 'none', 
              cursor: canSendReminder ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <FontAwesomeIcon icon={faComment} /> SMS to Muslims
          </button>
          
          <button 
            onClick={() => setShowAddContactPrompt(true)} 
            style={{ 
              backgroundColor: '#28a745', 
              color: 'white', 
              borderRadius: '5px', 
              padding: '10px 15px', 
              border: 'none', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            Add New Patient/Client
          </button>
          
          <button 
            onClick={() => sendMessageToAllPatients('Christian')} 
            disabled={!canSendReminder}
            style={{ 
              backgroundColor: canSendReminder ? '#17a2b8' : '#cccccc',
              color: 'white', 
              borderRadius: '5px', 
              padding: '10px 15px', 
              border: 'none', 
              cursor: canSendReminder ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <FontAwesomeIcon icon={faComment} /> SMS to Christians
          </button>
        </div>

        {/* Contacts List */}
        <ul className="contacts-list">
          {filteredContacts.map((contact) => (
            <li key={contact.contact_id} className="contact-item">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '15px' }}>
                <div>
                  <strong>Name:</strong> {contact.first_name} {contact.last_name}
                </div>
                <div>
                  <strong>Phone:</strong> {contact.phone_number}
                </div>
                <div>
                  <strong>Age:</strong> {contact.age}
                </div>
                <div>
                  <strong>Sex:</strong> {contact.sex}
                </div>
                <div>
                  <strong>DOB:</strong> {contact.dob}
                </div>
                <div>
                  <strong>Religion:</strong> {contact.religion}
                </div>
                {contact.address && (
                  <div style={{ gridColumn: 'span 2' }}>
                    <strong>Address:</strong> {contact.address}
                  </div>
                )}
              </div>
              
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => editContact(contact)} 
                  disabled={isAddingContact}
                  style={{ 
                    backgroundColor: isAddingContact ? '#cccccc' : '#ffc107',
                    color: 'white', 
                    borderRadius: '5px', 
                    padding: '8px 12px', 
                    border: 'none', 
                    cursor: isAddingContact ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <FontAwesomeIcon icon={faEdit} /> Edit
                </button>

                <button 
                  onClick={() => sendMessage(contact.phone_number)} 
                  disabled={!canSendReminder}
                  style={{ 
                    backgroundColor: canSendReminder ? '#17a2b8' : '#cccccc',
                    color: 'white', 
                    borderRadius: '5px', 
                    padding: '8px 12px', 
                    border: 'none', 
                    cursor: canSendReminder ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <FontAwesomeIcon icon={faComment} /> Send SMS
                </button>
              </div>
            </li>
          ))}
        </ul>

        {/* Wallet Prompt */}
        {isWalletPromptOpen && (
          <AddToWalletPrompt
            contactId={selectedContactId}
            onClose={() => setIsWalletPromptOpen(false)}
          />
        )}

        {/* Edit Contact Modal */}
        {editContactVisible && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '500px' }}>
              <div className="transaction-prompt">
                <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Edit Contact Details</h2>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                  <label>
                    First Name
                    <input
                      type="text"
                      value={editedContact.first_name}
                      onChange={(e) => setEditedContact({ ...editedContact, first_name: e.target.value })}
                      style={inputStyle}
                    />
                  </label>
                  
                  <label>
                    Last Name
                    <input
                      type="text"
                      value={editedContact.last_name}
                      onChange={(e) => setEditedContact({ ...editedContact, last_name: e.target.value })}
                      style={inputStyle}
                    />
                  </label>
                  
                  <label style={{ gridColumn: 'span 2' }}>
                    Phone Number
                    <input
                      type="text"
                      value={editedContact.phone_number}
                      onChange={(e) => setEditedContact({ ...editedContact, phone_number: e.target.value.replace(/\D/, "") })}
                      style={inputStyle}
                    />
                  </label>
                  
                  <label style={{ gridColumn: 'span 2' }}>
                    Address
                    <input
                      type="text"
                      value={editedContact.address}
                      onChange={(e) => setEditedContact({ ...editedContact, address: e.target.value })}
                      style={inputStyle}
                    />
                  </label>
                  
                  <label>
                    Age
                    <input
                      type="number"
                      value={editedContact.age}
                      onChange={(e) => setEditedContact({ ...editedContact, age: e.target.value.replace(/\D/, "") })}
                      style={inputStyle}
                    />
                  </label>
                  
                  <label>
                    Sex
                    <select
                      value={editedContact.sex}
                      onChange={(e) => setEditedContact({ ...editedContact, sex: e.target.value })}
                      style={inputStyle}
                    >
                      <option value="">Select Sex</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </label>
                  
                  <label>
                    Date of Birth
                    <input
                      type="date"
                      value={editedContact.dob}
                      onChange={(e) => setEditedContact({ ...editedContact, dob: e.target.value })}
                      style={inputStyle}
                    />
                  </label>
                  
                  <label>
                    Religion
                    <select
                      value={editedContact.religion}
                      onChange={(e) => setEditedContact({ ...editedContact, religion: e.target.value })}
                      style={inputStyle}
                    >
                      <option value="">Select Religion</option>
                      <option value="Christian">Christian</option>
                      <option value="Islamic">Islamic</option>
                    </select>
                  </label>
                </div>
                
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px" }}>
                  <button
                    onClick={() => setEditContactVisible(false)}
                    style={{
                      backgroundColor: "#6c757d",
                      color: "white",
                      border: "none",
                      padding: "10px 20px",
                      borderRadius: "5px",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={updateContact}
                    disabled={isAddingContact}
                    style={{
                      backgroundColor: isAddingContact ? "#cccccc" : "#28a745",
                      color: "white",
                      border: "none",
                      padding: "10px 20px",
                      borderRadius: "5px",
                      cursor: isAddingContact ? "not-allowed" : "pointer",
                    }}
                  >
                    {isAddingContact ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Contacts;