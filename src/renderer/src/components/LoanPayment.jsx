import React, { useState } from 'react'
import '../assets/loanPayment.css' // We will update this CSS next
import {Toaster,toast} from 'react-hot-toast'

export const LoanPayment = ({customers, userId, currentRate}) => {
  // 1. Define Search Options
  const searchAttributes = ['Customer Name', 'Phone Number']

  // 2. MOCK DATA (In real app, this comes from your Database)
  // We use this to show the "suggestions" dropdown as you type
  // const allData = [
  //   { name: 'Amol Patil', loanId: 'LN-101', phone: '9876543210' },
  //   { name: 'Amit Sharma', loanId: 'LN-102', phone: '9988776655' },
  //   { name: 'Vijay Kumar', loanId: 'LN-103', phone: '8877665544' },
  //   { name: 'Priya Deshmukh', loanId: 'LN-104', phone: '7766554433' },
  // ]

  // 3. STATE MANAGEMENT
  
  const today = new Date().toISOString().split('T')[0];

  const [filters, setFilters] = useState({
    searchBy: 'Customer Name',
    searchText: '',
    startDate: '',
    endDate: today
  })
  
  const [suggestions, setSuggestions] = useState([])
  const [searchedLoans, setSearchedLoans] = useState([]) // This will hold the final search results after form submission

  // Edit and Payment states
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedLoan, setSelectedLoan] = useState(null)
  const [editData, setEditData] = useState({})
  const [paymentData, setPaymentData] = useState({ amount: '', paymentDate: new Date().toISOString().split('T')[0] })

  // 4. HANDLE INPUT CHANGES
  const handleInputChange = (e) => {
    const { name, value } = e.target
    
    setFilters((prev) => ({
      ...prev,
      [name]: value
    }))

    // Special logic for "Search Text" to filter suggestions
    if (name === 'searchText') {
      filterSuggestions(value, filters.searchBy)
    }
    // If we change the "Search By" dropdown, clear the text
    if (name === 'searchBy') {
        setFilters(prev => ({ ...prev, searchBy: value, searchText: '' }))
        setSuggestions([])
    }
  }

  // 5. SUGGESTION LOGIC
  const filterSuggestions = (text, category) => {
    if (!text) {
      setSuggestions([])
      return
    }
    console.log('customers: ', typeof(customers))
    // if (!Array.isArray(customers)) {
    //     console.warn('Customers data is not an array yet:', customers)
    //     return
    // }
    const lowerText = text.toLowerCase()
    
    // Filter the mock data based on what user selected in dropdown
    const filtered = customers.filter(item => {
        if (category === 'Customer Name') return item.name.toLowerCase().includes(lowerText)
        if (category === 'Phone Number') return item.phone.includes(text)
        return false
    }).map(item => {
        // Return just the string we need for the dropdown
        if (category === 'Customer Name') return item.name
        if (category === 'Phone Number') return item.phone
    })

    setSuggestions(filtered)
  }

  // 6. SUBMIT HANDLER
  const handleSubmit = (e) => {
    e.preventDefault()
    console.log("Searching with filters:", filters)
    if(filters.searchText.trim() === ''){
      toast.error('Please enter search keywords.')
      return
    }
    const payload = {
      searchBy: filters.searchBy,
      searchText: filters.searchText,
      startDate: filters.startDate?.trim() || '1900-01-01',
      endDate: filters.endDate?.trim() || today
    }
    const response = window.api.getLoans(payload)
    response.then(result => {
      if(result.success){
        setSearchedLoans(result.data)
        toast.success(`Found ${result.data.length} loans matching your criteria.`)
        console.log('Search results:', result.data)
        console.log('Searched Loans state updated:', searchedLoans)
      }else{
        toast.error('Error fetching loans: ' + result.message)
        console.error('Error fetching loans:', result.message)
      }
    }).catch(err => {
      toast.error('Error in getLoans API call: ' + err.message)
      console.error('Error fetching loans:', err.message)
    })
  }

  const handleEditLoan = (loan) => {
    setSelectedLoan(loan)
    setEditData({
      id: loan.id,
      loanId: loan.loanId,
      jewelleryName: loan.jewelleryName,
      jewelleryDetails: loan.description,
      netWeight: loan.netWeight,
      fineWeight: loan.fineWeight,
      valuation: loan.jewelleryValue,
      loanAmount: loan.amount,
      interestRate: loan.interestRate,
      loanDate: loan.startDate,
      dueDate: loan.endDate
    })
    setShowEditModal(true)
  }

  const handlePaymentLoan = (loan) => {
    setSelectedLoan(loan)
    setPaymentData({ amount: '', paymentDate: new Date().toISOString().split('T')[0] })
    setShowPaymentModal(true)
  }

  const handleSaveEdit = async () => {
    try {
      const response = await window.api.updateLoan(editData)
      if (response.success) {
        toast.success('Loan updated successfully')
        setShowEditModal(false)
        // Refresh the search results
        handleSubmit({ preventDefault: () => {} })
      } else {
        toast.error('Error updating loan: ' + response.message)
      }
    } catch (err) {
      toast.error('Error updating loan: ' + err.message)
    }
  }

  const handleSavePayment = async () => {
    if (!paymentData.amount || paymentData.amount <= 0) {
      toast.error('Please enter a valid payment amount')
      return
    }
    try {
      const response = await window.api.addPayment({
        loanId: selectedLoan.id,
        amount: parseFloat(paymentData.amount),
        paymentDate: paymentData.paymentDate,
        interestPaid: 0 // For now, assume no interest paid separately
      })
      if (response.success) {
        toast.success('Payment added successfully')
        setShowPaymentModal(false)
        // Refresh the search results
        handleSubmit({ preventDefault: () => {} })
      } else {
        toast.error('Error adding payment: ' + response.message)
      }
    } catch (err) {
      toast.error('Error adding payment: ' + err.message)
    }
  }

  const handleDeleteLoan = async (loan) => {
    if (window.confirm(`Are you sure you want to delete loan ${loan.loanId}? This action cannot be undone.`)) {
      try {
        const response = await window.api.deleteLoan(loan.id)
        if (response.success) {
          toast.success('Loan deleted successfully')
          // Refresh the search results
          handleSubmit({ preventDefault: () => {} })
        } else {
          toast.error('Error deleting loan: ' + response.message)
        }
      } catch (err) {
        toast.error('Error deleting loan: ' + err.message)
      }
    }
  }

  const getLoanStatusClass = (loan) => {
    const today = new Date()
    const dueDate = new Date(loan.endDate)
    const balance = loan.balance || loan.amount

    if (balance <= 0) {
      return 'table-success' // Paid - green
    } else if (today > dueDate) {
      return 'table-danger' // Overdue - red
    } else {
      return 'table-warning' // Safe but pending - yellow/orange
    }
  }

  return (
    <>
      <div className="loan-page-container">  
        {/* CARD CONTAINER */}
        <div className="card shadow-sm border-0">
          
          {/* HEADER */}
          <div className="card-header bg-white py-3">
            <h5 className="mb-0 fw-bold text-primary">
              <i className="fa-solid fa-filter me-2"></i> Search Loans
            </h5>
          </div>

          {/* BODY with new "search-card-body" class for padding */}
          <div className="card-body search-card-body" style={{maxWidth:'100vw'}}>
            <form onSubmit={handleSubmit}>
              
              {/* ROW: g-4 adds bigger gaps between columns */}
              <div className="row g-4">
                
                {/* 1. Search Attribute (Takes 2 columns) */}
                <div className="col-lg-2">
                  <label className="form-label fw-bold text-secondary small">Search By</label>
                  <select 
                    className="form-select" 
                    name="searchBy" 
                    value={filters.searchBy} 
                    onChange={handleInputChange}
                  >
                    {searchAttributes.map((attr) => (
                      <option key={attr} value={attr}>{attr}</option>
                    ))}
                  </select>
                </div>

                {/* 2. Search Text (Takes 4 columns - Wider) */}
                <div className="col-md-4">
                  <label className="form-label fw-bold text-secondary small">
                    Keywords
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0">
                      <i className="fa-solid fa-magnifying-glass text-muted"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0 ps-0"
                      name="searchText"
                      value={filters.searchText}
                      onChange={handleInputChange}
                      placeholder="Type to search..."
                      list="search-suggestions" 
                    />
                    <datalist id="search-suggestions">
                      {suggestions.map((item, index) => <option key={index} value={item} />)}
                    </datalist>
                  </div>
                </div>

                {/* 3. Start Date (Takes 2 columns) */}
                <div className="col-md-2">
                  <label className="form-label fw-bold text-secondary small">From Date</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    name="startDate"
                    value={filters.startDate}
                    onChange={handleInputChange}
                  />
                </div>

                {/* 4. End Date (Takes 2 columns) */}
                <div className="col-md-2">
                  <label className="form-label fw-bold text-secondary small">To Date</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    name="endDate"
                    value={filters.endDate}
                    onChange={handleInputChange}
                  />
                </div>

                {/* 5. Search Button (Takes 2 columns) */}
                {/* d-grid makes the button fill the column width */}
                <div className="col-md-2 d-grid align-self-end"> 
                  <button type="submit" className="btn btn-primary fw-bold">
                    Search
                  </button>
                </div>

              </div>
            </form>
          </div>
        </div>
         
      {/* SEARCH RESULTS */}
      <div className="loan-results-container mt-4 w-100">
        {searchedLoans.length === 0 ? (
          <div className="alert alert-info mb-0">
            Search for loans using the form above to see results here.
          </div>
        ) : (
          <div className="card mt-3 w-100">
            <div className="card-header bg-white py-2">
              <h6 className="mb-0 fw-bold text-secondary">
                Found {searchedLoans.length} loan{searchedLoans.length === 1 ? '' : 's'}
              </h6>
              <div className="mt-2 d-flex indicator-container">
                <small className="text-muted">
                  <span className="badge bg-success me-2">Paid</span> • 
                  <span className="badge bg-warning text-dark me-2">Safe</span> • 
                  <span className="badge bg-danger me-2">Overdue</span> 
                </small>
              </div>
            </div>
            <div className="card p-0" style={{ overflowX: 'auto', width: '100%', paddingInline: '2px' }}>
              <table className="table table-sm table-hover table-bordered text-center mb-0 w-100" style={{ tableLayout: 'auto', minWidth: '900px' }}>
                <thead className="table-light">
                  <tr>
                    {Object.keys(searchedLoans[0] || {}).map((col) => (
                      <th key={col} scope="col" className="text-capitalize text-nowrap text-center">
                        {col.replace(/([A-Z])/g, ' $1')}
                      </th>
                    ))}
                    <th scope="col" className="text-nowrap text-center">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {searchedLoans.map((loan, index) => (
                    <tr key={loan.loanId ?? index} className={getLoanStatusClass(loan)}>
                      {Object.values(loan).map((value, idx) => (
                        <td key={idx} className="text-nowrap text-center">
                          {value?.toString?.() ?? ''}
                        </td>
                      ))}
                      <td className="text-nowrap text-center">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary me-1"
                          onClick={() => handleEditLoan(loan)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-success me-1"
                          onClick={() => handlePaymentLoan(loan)}
                        >
                          Payment
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDeleteLoan(loan)}
                          disabled={(loan.balance || loan.amount) > 0}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      </div>
     
      
      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Loan</h5>
                <button type="button" className="btn-close" onClick={() => setShowEditModal(false)}></button>
              </div>
              <div className="modal-body">
                <form>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Loan ID</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editData.loanId}
                        onChange={(e) => setEditData({...editData, loanId: e.target.value})}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Jewellery Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editData.jewelleryName}
                        onChange={(e) => setEditData({...editData, jewelleryName: e.target.value})}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Net Weight (gm)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={editData.netWeight}
                        onChange={(e) => setEditData({...editData, netWeight: e.target.value})}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Fine Weight (gm)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={editData.fineWeight}
                        onChange={(e) => setEditData({...editData, fineWeight: e.target.value})}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Valuation</label>
                      <input
                        type="number"
                        className="form-control"
                        value={editData.valuation}
                        onChange={(e) => setEditData({...editData, valuation: e.target.value})}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Loan Amount</label>
                      <input
                        type="number"
                        className="form-control"
                        value={editData.loanAmount}
                        onChange={(e) => setEditData({...editData, loanAmount: e.target.value})}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Interest Rate (%)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={editData.interestRate}
                        onChange={(e) => setEditData({...editData, interestRate: e.target.value})}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Loan Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={editData.loanDate}
                        onChange={(e) => setEditData({...editData, loanDate: e.target.value})}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Due Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={editData.dueDate}
                        onChange={(e) => setEditData({...editData, dueDate: e.target.value})}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Jewellery Details</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        value={editData.jewelleryDetails}
                        onChange={(e) => setEditData({...editData, jewelleryDetails: e.target.value})}
                      ></textarea>
                    </div>
                  </div>
                </form>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="button" className="btn btn-primary" onClick={handleSaveEdit}>Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add Payment</h5>
                <button type="button" className="btn-close" onClick={() => setShowPaymentModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Loan ID: {selectedLoan?.loanId}</label>
                </div>
                <div className="mb-3">
                  <label className="form-label">Customer: {selectedLoan?.customerName}</label>
                </div>
                <div className="mb-3">
                  <label className="form-label">Outstanding Balance: ₹{selectedLoan?.balance || selectedLoan?.amount}</label>
                </div>
                <div className="mb-3">
                  <label className="form-label">Payment Amount</label>
                  <input
                    type="number"
                    className="form-control"
                    value={paymentData.amount}
                    onChange={(e) => setPaymentData({...paymentData, amount: e.target.value})}
                    placeholder="Enter payment amount"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Payment Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={paymentData.paymentDate}
                    onChange={(e) => setPaymentData({...paymentData, paymentDate: e.target.value})}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPaymentModal(false)}>Cancel</button>
                <button type="button" className="btn btn-success" onClick={handleSavePayment}>Add Payment</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Backdrop */}
      {(showEditModal || showPaymentModal) && <div className="modal-backdrop show"></div>}

      <Toaster></Toaster>
    </>
  )
}