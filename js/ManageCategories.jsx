import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { API_URL, urls } from './config.dev';

const ManageCategories = () => {
  const [employee, setEmployee] = useState('');
  const [clinic, setClinic] = useState('');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    categoryName: '',
    categoryType: 'sales' // Default to sales
  });
  const [editingCategory, setEditingCategory] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  const navigate = useNavigate();

  // List of restricted categories that users shouldn't add
  const restrictedCategories = [
    'treatment', 'maternity', 'radiology', 'lab', 
    'Pharmacy Sales', 'Consultation', 'major surgery', 
    'minor surgery', 'dental', 'sales', 'expense'
  ];
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

  const fetchCategoriesData = async (token) => {
    try {
      setLoading(true);
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
          setClinic(data.clinic);
          // Map the API response to match frontend expectations
          const mappedCategories = data.categories.map(category => ({
            id: category.id,
            name: category.category_name, // Map category_name to name
            type: category.type
          }));
          setCategories(mappedCategories);
        } else {
          throw new Error('Failed to fetch categories');
        }
      } else {
        throw new Error('Failed to fetch categories');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
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
    if (!formData.categoryName.trim()) {
      toast.error('Please enter a category name');
      return;
    }
    
    // Check if category is restricted
    const categoryLower = formData.categoryName.trim().toLowerCase();
    const isRestricted = restrictedCategories.some(
      restricted => restricted.toLowerCase() === categoryLower
    );
    
    if (isRestricted) {
      toast.error('This category is already built into the system. Please choose a different name.');
      return;
    }
    
    // Prepare payload
    const payload = {
      token,
      categoryName: formData.categoryName.trim(),
      categoryType: formData.categoryType
    };

    // If editing, add category ID and command
    if (editingCategory) {
      payload.categoryId = editingCategory.id;
      payload.command = 'edit';
    }

    setSubmitting(true);
    
    try {
      const response = await fetch(urls.setcategories, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(editingCategory ? 'Category updated successfully' : 'Category added successfully');
        setFormData({
          categoryName: '',
          categoryType: 'sales'
        });
        setEditingCategory(null);
        // Refresh categories list
        fetchCategoriesData(token);
      } else {
        throw new Error(editingCategory ? 'Failed to update category' : 'Failed to add category');
      }
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error(editingCategory ? 'Failed to update category' : 'Failed to add category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      categoryName: category.name,
      categoryType: category.type
    });
    
    // Scroll to form
    document.getElementById('category-form').scrollIntoView({ behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setFormData({
      categoryName: '',
      categoryType: 'sales'
    });
  };

  const handleDelete = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
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
      const response = await fetch(urls.deletecategory, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, categoryId }),
      });

      if (response.ok) {
        toast.success('Category deleted successfully');
        // Refresh categories list
        fetchCategoriesData(token);
      } else {
        throw new Error('Failed to delete category');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
    }
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
        <h1 style={styles.title}>MANAGE CATEGORIES FOR {clinic}</h1>
        {employee && <p style={styles.welcome}>Welcome, {employee}</p>}
      </header>
      
      <div style={styles.content}>
        <section id="category-form" style={styles.formSection}>
          <h2 style={styles.sectionTitle}>
            {editingCategory ? 'Edit Category' : 'Add New Category'}
          </h2>
          
          <div style={styles.noteBox}>
            <h3 style={styles.noteTitle}>Important Note:</h3>
            <p style={styles.noteText}>
              Please do not insert the following categories as they are already built into the system:
            </p>
            <ul style={styles.restrictedList}>
              {restrictedCategories.map((category, index) => (
                <li key={index} style={styles.restrictedItem}>{category}</li>
              ))}
            </ul>
            <p style={styles.noteText}>
              Add only categories that you feel the system didn't cater for but are important to your business.
            </p>
          </div>
          
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label htmlFor="categoryName" style={styles.label}>Category Name</label>
                <input
                  type="text"
                  id="categoryName"
                  name="categoryName"
                  value={formData.categoryName}
                  onChange={handleInputChange}
                  style={styles.input}
                  placeholder="Enter category name"
                />
              </div>
              
              <div style={styles.formGroup}>
                <label htmlFor="categoryType" style={styles.label}>Category Type</label>
                <select
                  id="categoryType"
                  name="categoryType"
                  value={formData.categoryType}
                  onChange={handleInputChange}
                  style={styles.select}
                >
                  <option value="sales">For Sales</option>
                  <option value="expense">For Expense</option>
                </select>
              </div>
            </div>
            
            <div style={styles.buttonGroup}>
              <button 
                type="submit" 
                style={styles.submitButton}
                disabled={submitting}
              >
                {submitting 
                  ? (editingCategory ? 'Updating Category...' : 'Adding Category...') 
                  : (editingCategory ? 'Update Category' : 'Add Category')
                }
              </button>
              
              {editingCategory && (
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
          <h2 style={styles.sectionTitle}>Current Categories</h2>
          {loading ? (
            <p style={styles.loading}>Loading categories...</p>
          ) : categories.length === 0 ? (
            <p style={styles.noCategories}>No categories found. Add a category to get started.</p>
          ) : (
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeaderRow}>
                    <th style={styles.tableHeader}>Category Name</th>
                    <th style={styles.tableHeader}>Type</th>
                    <th style={styles.tableHeader}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => (
                    <tr key={category.id} style={styles.tableRow}>
                      <td style={styles.tableCell}>{category.name}</td>
                      <td style={styles.tableCell}>
                        {category.type === 'sales' ? 'Sales' : 'Expense'}
                      </td>
                      <td style={styles.tableCell}>
                        <button 
                          onClick={() => handleEdit(category)}
                          style={styles.editButton}
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(category.id)}
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
  noteBox: {
    backgroundColor: '#fff3cd',
    border: '1px solid #ffeaa7',
    borderRadius: '4px',
    padding: '15px',
    marginBottom: '20px',
  },
  noteTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#856404',
    marginTop: '0',
    marginBottom: '10px',
  },
  noteText: {
    fontSize: '14px',
    color: '#856404',
    margin: '0 0 10px 0',
  },
  restrictedList: {
    paddingLeft: '20px',
    margin: '10px 0',
  },
  restrictedItem: {
    fontSize: '14px',
    color: '#856404',
    marginBottom: '5px',
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
  noCategories: {
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
Object.assign(styles.submitButton, {
  ':hover': {
    backgroundColor: '#2980b9',
  }
});

Object.assign(styles.cancelButton, {
  ':hover': {
    backgroundColor: '#7f8c8d',
  }
});

Object.assign(styles.editButton, {
  ':hover': {
    backgroundColor: '#e67e22',
  }
});

Object.assign(styles.deleteButton, {
  ':hover': {
    backgroundColor: '#c0392b',
  }
});

export default ManageCategories;