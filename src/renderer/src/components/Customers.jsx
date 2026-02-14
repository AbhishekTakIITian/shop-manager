import React, { useState, useEffect } from 'react' // Import useEffect
import '../assets/loanPayment.css'
import toast, { Toaster } from 'react-hot-toast'

export const Customers = ({ userId, customers, setCustomers }) => {
  // --- 1. STATE MANAGEMENT ---
  const [isLoading, setIsLoading] = useState(false) // Add loading state
  const [selectedFilePath, setSelectedFilePath] = useState(null)

  const initialFormState = {
    id: null,
    name: '',
    phone: '',
    phone2: '',
    address: '',
    landMark: '',
    remark: '',
    image: null,
    imagePath: null
  }

  const [formData, setFormData] = useState(initialFormState)
  const [isEditing, setIsEditing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // --- 3. HANDLERS ---

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const previewUrl = URL.createObjectURL(file)
      setFormData({ ...formData, image: previewUrl })
      let realPath = ''
      try{
        realPath = window.api.getFilePath(file);
      }catch(err){
        console.error("Failed to get file path:", err);
      }
      setSelectedFilePath(realPath) // Store the actual file path for saving
      e.target.value = null
    }
  }

  // NOTE: You will likely need to update handleSave/Delete to call your API too
  const handleSave = async (e) => {
    e.preventDefault()

    if (!formData.name || !formData.phone) {
      toast.error('Name and Phone No 1 are required!')
      return
    }
    try {
      let finalImageName = formData.image; // Default to existing image name

      // 1. IF a new file was selected, save it to AppData
      if (selectedFilePath) {
         finalImageName = await window.api.saveImage({sourcePath: selectedFilePath, type:'customer'}); // e.g. 'cust_123123.jpg'
         console.log('Image saved with filename:', finalImageName);
      }else{
        finalImageName = formData.imagePath || null; // No image
        console.log('No new image selected, keeping existing:', finalImageName);
      }

      // 2. Prepare object for Database (using the Filename, not the Blob URL)
      const customerToSave = {
        ...formData,
        userId: userId,
        image: finalImageName, // Save 'cust_123123.jpg' to DB
        imagePath: finalImageName
      }
      
      if (isEditing) {
        const response = await window.api.updateCustomer(customerToSave);
        // toast.success('Updating customer in database...')
        if(response && response.success){
          toast.success('Customer updated in database!')
          setCustomers(customers.map((c) => (c.id === formData.id ? {...customerToSave, image: formData.image} : c)))
          // toast.success('Customer Updated!')
          setIsEditing(false)
        }else{
          console.error('Failed to update customer:', response);
          toast.error('Failed to update in database')
        }

      } else {
        // Call Create API
        const newIdResponse = await window.api.createCustomer(customerToSave);
        
        if(newIdResponse && newIdResponse.success){
            const newCustomer = { ...customerToSave, id: newIdResponse.id, image: formData.image }
            setCustomers([newCustomer, ...customers])
            toast.success('Customer Added!')
        } else {
            console.error('Failed to create customer:', newIdResponse);
            toast.error('Failed to save to database')
        }
      }
      handleClear()

    } catch (error) {
      console.error("Save failed", error);
      toast.error("Failed to save customer")
    }
  }

  const handleEdit = (customer) => {
    setFormData(customer)
    console.log('Editing customer:', formData.name, formData.phone)
    setIsEditing(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      // Logic to update local state (You should call DB delete here)
      console.log('Deleting customer with ID:', id)
      const image = customers.find((c) => c.id === id)?.imagePath; 
      const customer = {id, image};
      // console.log('Customer to delete:', customer, customers.find((c) => c.id === id));
      const response = await window.api.deleteCustomer(customer)
      if(response && response.success){
        toast.success('Customer deleted!')
        setCustomers(customers.filter((c) => c.id !== id))
        if (formData.id === id) handleClear()
      }
      else{
        console.error('Failed to delete customer:', response);
        toast.error('Failed to delete customer')
      }

    }
  }

  const handleClear = () => {
    setFormData(initialFormState)
    setIsEditing(false)
  }

  const filteredCustomers = customers.filter(
    (c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone.includes(searchTerm)
  )

  return (
    <>
      <div className="loan-page-container">
        {/* ... [REGISTRATION FORM CODE REMAINS EXACTLY THE SAME] ... */}
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-header bg-white py-3">
            <h5 className="mb-0 fw-bold text-primary">
              <i className="fa-solid fa-user-plus me-2"></i>
              {isEditing ? 'Update Customer' : 'Customer Registration'}
            </h5>
          </div>

          <div className="card-body search-card-body" style={{ maxWidth: '98vw' }}>
            <form onSubmit={handleSave}>
              {/* ... (Keep your existing form JSX here) ... */}
              <div className="row">
                <div className="col-md-9">
                  <div className="row g-3">
                    <div className="col-md-12">
                      <label className="form-label fw-bold small text-secondary">
                        Full Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Enter full name"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold small text-secondary">
                        Phone / Mob No 1 <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="Primary Number"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold small text-secondary">
                        Phone / Mob No 2
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        name="phone2"
                        value={formData.phone2}
                        onChange={handleInputChange}
                        placeholder="Secondary Number"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold small text-secondary">Address</label>
                      <textarea
                        className="form-control"
                        name="address"
                        rows="1"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="Residential Address"
                      ></textarea>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold small text-secondary">Landmark</label>
                      <input
                        type="text"
                        className="form-control"
                        name="landMark"
                        value={formData.landMark}
                        onChange={handleInputChange}
                        placeholder="e.g. Near Market"
                      />
                    </div>
                    <div className="col-md-12">
                      <label className="form-label fw-bold small text-secondary">Remark</label>
                      <input
                        type="text"
                        className="form-control"
                        name="remark"
                        value={formData.remark}
                        onChange={handleInputChange}
                        placeholder="Any notes (e.g. VIP, Relative)..."
                      />
                    </div>
                  </div>
                </div>
                <div className="col-md-3 d-flex flex-column align-items-center justify-content-center ps-md-5 border-start">
                  <label className="form-label fw-bold small text-secondary mb-2 align-self-start">
                    Customer Photo
                  </label>
                  <div
                    className="border rounded bg-light d-flex flex-column justify-content-center align-items-center position-relative overflow-hidden shadow-sm"
                    style={{
                      width: '100%',
                      height: '20rem',
                      borderStyle: 'dashed',
                      borderWidth: '2px'
                    }}
                  >
                    {formData.image ? (
                      <img
                        src={formData.image}
                        alt="Customer"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div className="text-center text-muted">
                        <i className="fa-solid fa-camera fa-3x mb-2 opacity-50"></i>
                        <p className="small mb-0">Click to Upload</p>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="position-absolute w-100 h-100 opacity-0"
                      style={{ cursor: 'pointer', zIndex: 10 }}
                      onChange={handleImageUpload}
                    />
                  </div>
                  {formData.image && (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger mt-2 w-100"
                      onClick={() => setFormData({ ...formData, image: null })}
                    >
                      Remove Photo
                    </button>
                  )}
                </div>
              </div>
              <div className="d-flex gap-2 mt-4 pt-3 border-top justify-content-end">
                <button type="button" className="btn btn-secondary px-4" onClick={handleClear}>
                  <i className="fa-solid fa-eraser me-2"></i> Clear
                </button>
                <button
                  type="submit"
                  className={`btn px-5 fw-bold ${isEditing ? 'btn-warning text-dark' : 'btn-primary'}`}
                >
                  {isEditing ? (
                    <>
                      <i className="fa-solid fa-pen-to-square me-2"></i> Update
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-save me-2"></i> Save
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* --- BOTTOM SECTION: CUSTOMER LIST (TABLE) --- */}
        <div className="card shadow-sm border-0">
          <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
            <h5 className="mb-0 fw-bold text-secondary">
              <i className="fa-solid fa-users-viewfinder me-2"></i> Customer Database
            </h5>
            <div className="input-group" style={{ maxWidth: '300px' }}>
              <span className="input-group-text bg-light border-end-0">
                <i className="fa-solid fa-search"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-0"
                placeholder="Search name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="card-body p-0" style={{ maxWidth: '98vw' }}>
            <div className="table-responsive" style={{ maxHeight: '400px' }}>
              <table className="table table-hover table-striped mb-0 align-middle">
                <thead className="bg-light sticky-top">
                  <tr>
                    <th className="py-3 ps-4">Name</th>
                    <th>Phone No 1</th>
                    <th>Address</th>
                    <th>Landmark</th>
                    <th>Remark</th>
                    <th className="text-end pe-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan="6" className="text-center py-5">
                        Loading Customers...
                      </td>
                    </tr>
                  ) : filteredCustomers.length > 0 ? (
                    filteredCustomers.map((cust) => (
                      <tr
                        key={cust.id}
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleEdit(cust)}
                      >
                        <td className="ps-4 fw-bold text-primary">{cust.name}</td>
                        <td>{cust.phone}</td>
                        <td>{cust.address || '-'}</td>
                        <td>{cust.landMark || '-'}</td>
                        <td>
                          {cust.remark ? (
                            <span className="badge bg-info text-dark">{cust.remark}</span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="text-end pe-4">
                          <button
                            className="btn btn-sm btn-outline-primary me-2"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEdit(cust)
                            }}
                            title="Edit"
                          >
                            <i className="fa-solid fa-pen"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(cust.id)
                            }}
                            // disabled = 'true'
                            title="Delete"
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-5 text-muted">
                        No customers found. Add a new one above.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="card-footer bg-light py-2 text-end text-muted small">
            Total Records: {filteredCustomers.length}
          </div>
        </div>
      </div>
      <Toaster />
    </>
  )
}
