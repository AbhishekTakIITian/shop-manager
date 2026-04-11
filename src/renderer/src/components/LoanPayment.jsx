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
    console.log('Edit loan clicked', loan)
    toast('Edit action not implemented yet.', { icon: '✏️' })
  }

  const handlePaymentLoan = (loan) => {
    console.log('Payment loan clicked', loan)
    toast('Payment action not implemented yet.', { icon: '💰' })
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
                    <tr key={loan.loanId ?? index}>
                      {Object.values(loan).map((value, idx) => (
                        <td key={idx} className="text-nowrap text-center">
                          {value?.toString?.() ?? ''}
                        </td>
                      ))}
                      <td className="text-nowrap text-center">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary me-2"
                          onClick={() => handleEditLoan(loan)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-success"
                          onClick={() => handlePaymentLoan(loan)}
                        >
                          Payment
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
     
      
      <Toaster></Toaster>
    </>
  )
}