import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { API_URL, urls } from './config.dev';

const ManageServices = () => {
  const [employee, setEmployee] = useState('');
  const [clinic, setClinic] = useState('');
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    serviceName: '',
    price: '',
    category: 'none',
    isSurgery: 'no',
    surgeryType: 'none'
  });
  const [editingService, setEditingService] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTokenAndCheckSecurity = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const tokenFromUrl = params.get('token');

        if (!tokenFromUrl) {
          console.error('Token not found in URL');
          toast.error('Authentication token missing');
          navigate('/login');
          return;
        }

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
            setEmployee(securityData.employee_name);
            fetchServicesData(tokenFromUrl);
            fetchCategoriesData(tokenFromUrl);
          } else if (securityData.error === 'Session expired') {
            toast.error('Session expired. Please login again.');
            navigate('/login');
          } else {
            toast.error('Authentication failed');
            navigate('/login');
          }
        } else {
          throw new Error('Failed to perform security check');
        }
      } catch (error) {
        console.error('Error performing security check:', error);
        toast.error('Authentication error');
        navigate('/login');
      }
    };

    fetchTokenAndCheckSecurity();
  }, [navigate]);

  const fetchServicesData = async (token) => {
    try {
      setLoading(true);
      const response = await fetch(urls.fetchservices, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setClinic(data.clinic);
          setServices(data.data || []);
        } else {
          throw new Error('Failed to fetch services');
        }
      } else {
        throw new Error('Failed to fetch services');
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoriesData = async (token) => {
    try {
      const response = await fetch(urls.fetchcategories, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Filter categories to only include those with type "sales"
          const salesCategories = data.categories.filter(
            category => category.type === 'sales'
          );
          setCategories(salesCategories);
        } else {
          console.error('Failed to fetch categories');
        }
      } else {
        console.error('Failed to fetch categories');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    
    if (!token) {
      toast.error('Authentication token missing');
      navigate('/login');
      return;
    }

    // Validate form
    if (!formData.serviceName.trim()) {
      toast.error('Please enter a service name');
      return;
    }
    
    if (!formData.price || parseInt(formData.price) <= 0) {
      toast.error('Please enter a valid price');
      return;
    }
    
    // Prepare payload
    const payload = {
      token,
      serviceName: formData.serviceName.trim(),
      price: parseInt(formData.price),
      category: formData.category,
      isSurgery: formData.isSurgery,
      surgeryType: formData.isSurgery === 'yes' ? formData.surgeryType : 'none'
    };

    // If editing, add service ID and command
    if (editingService) {
      payload.serviceId = editingService.id;
      payload.command = 'edit';
    }

    setSubmitting(true);
    
    try {
      const response = await fetch(urls.setservices, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(editingService ? 'Service updated successfully' : 'Service added successfully');
        setFormData({
          serviceName: '',
          price: '',
          category: 'none',
          isSurgery: 'no',
          surgeryType: 'none'
        });
        setEditingService(null);
        // Refresh services list
        fetchServicesData(token);
      } else {
        throw new Error(editingService ? 'Failed to update service' : 'Failed to add service');
      }
    } catch (error) {
      console.error('Error saving service:', error);
      toast.error(editingService ? 'Failed to update service' : 'Failed to add service');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (service) => {
    setEditingService(service);
    setFormData({
      serviceName: service.name,
      price: service.price,
      category: service.category || 'none',
      isSurgery: service.main_category === 'minor' || service.main_category === 'major' ? 'yes' : 'no',
      surgeryType: service.main_category === 'minor' ? 'minor' : service.main_category === 'major' ? 'major' : 'none'
    });
    
    // Scroll to form
    document.getElementById('service-form').scrollIntoView({ behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingService(null);
    setFormData({
      serviceName: '',
      price: '',
      category: 'none',
      isSurgery: 'no',
      surgeryType: 'none'
    });
  };

  const handleDelete = async (serviceId) => {
    if (!window.confirm('Are you sure you want to delete this service? This action cannot be undone.')) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    
    if (!token) {
      toast.error('Authentication token missing');
      navigate('/login');
      return;
    }

    try {
      const response = await fetch(urls.deleteservice, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, serviceId }),
      });

      if (response.ok) {
        toast.success('Service deleted successfully');
        // Refresh services list
        fetchServicesData(token);
      } else {
        throw new Error('Failed to delete service');
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error('Failed to delete service');
    }
  };

  // Helper function to format category name for display
  const formatCategoryName = (category) => {
    if (category === 'none') return 'General';
    if (category === 'major') return 'Major Surgery';
    if (category === 'minor') return 'Minor Surgery';
    
    // For backend categories, use the category_name as is
    const foundCategory = categories.find(cat => cat.category_name === category);
    if (foundCategory) return foundCategory.category_name;
    
    return category;
  };

  return (
    <div style={styles.container}>
      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      
      <header style={styles.header}>
        <h1 style={styles.title}>SERVICES DONE AT {clinic}</h1>
        {employee && <p style={styles.welcome}>Welcome, {employee}</p>}
       <p style={styles.infoNote}>
  Note: If a category is missing, please add it first in the 
  <button 
    onClick={() => {
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get('token');
      navigate(`/set-sales-expenses-categories/?token=${urlToken}`);
    }}
    style={styles.linkButton}
  >
    Set Category Section
  </button>.
</p>
      </header>
      
      <div style={styles.content}>
        <section id="service-form" style={styles.formSection}>
          <h2 style={styles.sectionTitle}>
            {editingService ? 'Edit Service' : 'Add New Service'}
          </h2>
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label htmlFor="serviceName" style={styles.label}>Service Name</label>
                <input
                  type="text"
                  id="serviceName"
                  name="serviceName"
                  value={formData.serviceName}
                  onChange={handleInputChange}
                  style={styles.input}
                  placeholder="Enter service name"
                />
              </div>
              
              <div style={styles.formGroup}>
                <label htmlFor="price" style={styles.label}>Price (UGX)</label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  style={styles.input}
                  placeholder="Enter price"
                  min="0"
                  step="1"
                />
              </div>
            </div>
            
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label htmlFor="category" style={styles.label}>Category</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  style={styles.select}
                >
                  <option value="none">General</option>
                  <option value="treatment">Treatment</option>
                  <option value="maternity">Maternity</option>
                  <option value="radiology">Radiology</option>
                  <option value="lab">Lab</option>
                  <option value="Consultation">Consultation</option>
                  <option value="dental">Dental</option>
                  {/* Dynamic categories from backend */}
                  {categories.map(category => (
                    <option key={category.id} value={category.category_name}>
                      {category.category_name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div style={styles.formGroup}>
                <label htmlFor="isSurgery" style={styles.label}>Is it a Surgery?</label>
                <select
                  id="isSurgery"
                  name="isSurgery"
                  value={formData.isSurgery}
                  onChange={handleInputChange}
                  style={styles.select}
                >
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>
            </div>
            
            {formData.isSurgery === 'yes' && (
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label htmlFor="surgeryType" style={styles.label}>Surgery Type</label>
                  <select
                    id="surgeryType"
                    name="surgeryType"
                    value={formData.surgeryType}
                    onChange={handleInputChange}
                    style={styles.select}
                  >
                    <option value="none">Select type</option>
                    <option value="minor">Minor Surgery</option>
                    <option value="major">Major Surgery</option>
                  </select>
                </div>
              </div>
            )}
            
            <div style={styles.buttonGroup}>
              <button 
                type="submit" 
                style={styles.submitButton}
                disabled={submitting}
              >
                {submitting 
                  ? (editingService ? 'Updating Service...' : 'Adding Service...') 
                  : (editingService ? 'Update Service' : 'Add Service')
                }
              </button>
              
              {editingService && (
                <button 
                  type="button" 
                  onClick={handleCancelEdit}
                  style={styles.cancelButton}
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </section>
        
        <section style={styles.tableSection}>
          <h2 style={styles.sectionTitle}>Current Services</h2>
          {loading ? (
            <p style={styles.loading}>Loading services...</p>
          ) : services.length === 0 ? (
            <p style={styles.noServices}>No services found. Add a service to get started.</p>
          ) : (
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeaderRow}>
                    <th style={styles.tableHeader}>Service Name</th>
                    <th style={styles.tableHeader}>Category</th>
                    <th style={styles.tableHeader}>Price (UGX)</th>
                    <th style={styles.tableHeader}>Surgery Type</th>
                    <th style={styles.tableHeader}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((service) => (
                    <tr key={service.id} style={styles.tableRow}>
                      <td style={styles.tableCell}>{service.name}</td>
                      <td style={styles.tableCell}>
                        {formatCategoryName(service.category)}
                      </td>
                      <td style={styles.tableCell}>{service.price}</td>
                      <td style={styles.tableCell}>
                        {service.main_category === 'minor' ? 'Minor Surgery' : 
                         service.main_category === 'major' ? 'Major Surgery' : 
                         'Not a Surgery'}
                      </td>
                      <td style={styles.tableCell}>
                        <button 
                          onClick={() => handleEdit(service)}
                          style={styles.editButton}
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(service.id)}
                          style={styles.deleteButton}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

const styles = {
  container: {
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    backgroundColor: '#f8f9fa',
    minHeight: '100vh',
    padding: '20px',
    color: '#333',
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
  },
  title: {
    fontSize: '28px',
    fontWeight: '600',
    color: '#2c3e50',
    margin: '0 0 10px 0',
  },
  welcome: {
    fontSize: '16px',
    color: '#7f8c8d',
    margin: '0',
  },
  infoNote: {
    fontSize: '14px',
    color: '#e74c3c',
    fontStyle: 'italic',
    margin: '10px 0 0 0',
  },
  content: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  formSection: {
    backgroundColor: 'white',
    padding: '25px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
    marginBottom: '30px',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#2c3e50',
    marginTop: '0',
    marginBottom: '20px',
    paddingBottom: '10px',
    borderBottom: '1px solid #ecf0f1',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  formRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '20px',
    marginBottom: '20px',
  },
  formGroup: {
    flex: '1',
    minWidth: '250px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '500',
    color: '#34495e',
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #dcdfe6',
    borderRadius: '4px',
    fontSize: '16px',
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    padding: '12px',
    border: '1px solid #dcdfe6',
    borderRadius: '4px',
    fontSize: '16px',
    backgroundColor: 'white',
    boxSizing: 'border-box',
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '4px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  cancelButton: {
    backgroundColor: '#95a5a6',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '4px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  tableSection: {
    backgroundColor: 'white',
    padding: '25px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
  },
  loading: {
    textAlign: 'center',
    padding: '20px',
    color: '#7f8c8d',
  },
  noServices: {
    textAlign: 'center',
    padding: '20px',
    color: '#7f8c8d',
    fontStyle: 'italic',
  },
  tableContainer: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeaderRow: {
    backgroundColor: '#f8f9fa',
  },
  tableHeader: {
    padding: '12px 15px',
    textAlign: 'left',
    fontWeight: '600',
    color: '#2c3e50',
    borderBottom: '2px solid #ecf0f1',
  },
  tableRow: {
    borderBottom: '1px solid #ecf0f1',
  },
  tableCell: {
    padding: '12px 15px',
    verticalAlign: 'top',
    
  },

   linkButton: {
    background: 'none',
    border: 'none',
    color: '#3498db',
    textDecoration: 'underline',
    cursor: 'pointer',
    padding: '0 4px',
    fontSize: '14px',
  },
  editButton: {
    backgroundColor: '#f39c12',
    color: 'white',
    border: 'none',
    padding: '8px 12px',
    borderRadius: '4px',
    fontSize: '14px',
    cursor: 'pointer',
    marginRight: '8px',
    transition: 'background-color 0.2s',
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    padding: '8px 12px',
    borderRadius: '4px',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
};

// Add hover effects
styles.submitButton[':hover'] = {
  backgroundColor: '#2980b9',
};

styles.cancelButton[':hover'] = {
  backgroundColor: '#7f8c8d',
};

styles.editButton[':hover'] = {
  backgroundColor: '#e67e22',
};

styles.deleteButton[':hover'] = {
  backgroundColor: '#c0392b',
};

export default ManageServices;