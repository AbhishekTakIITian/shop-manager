import React, { useState } from 'react'
import '../assets/loanPayment.css'

export const Pushkraj = () => {
  const [activeTab, setActiveTab] = useState('details')

  // --- STATE: REGISTRATION TAB ---
  const [borrowers, setBorrowers] = useState([
    { id: 1, name: 'Om Jewellers', phone1: '9000000000', address: 'Market Yard', remark: 'Regular' },
    { id: 2, name: 'Saraf & Co', phone1: '8888888888', address: 'Main Road', remark: '' }
  ])
  const [regForm, setRegForm] = useState({
    name: '', address: '', landmark: '', phone1: '', phone2: '', remark: '', image: null
  })

  // --- STATE: DETAILS TAB ---
  // isPayMode: FALSE = Creating New Loan | TRUE = Paying back existing loan
  const [isPayMode, setIsPayMode] = useState(false) 

  const [transactions, setTransactions] = useState([
    { 
      id: 101, borrowerId: '1', borrowerName: 'Om Jewellers', borrowedAmt: '50000', borrowedDate: '2025-02-01', 
      jewName: 'Gold Ring', custName: 'Ramesh Patil', paidDate: '', paidAmt: '', paidInt: ''
    }
  ])

  const initialDetailForm = {
    id: null, // Track which ID we are editing
    borrowerId: '', borrowedAmt: '', borrowedDate: new Date().toISOString().split('T')[0],
    jewName: '', custName: '', 
    paidDate: new Date().toISOString().split('T')[0], paidAmt: '', paidInterest: ''
  }

  const [detailForm, setDetailForm] = useState(initialDetailForm)

  // --- HANDLERS ---

  // 1. Handle Input Changes
  const handleDetailChange = (e) => setDetailForm({...detailForm, [e.target.name]: e.target.value})

  // 2. Handle "New" Button (Reset to Default Mode)
  const handleReset = () => {
    setDetailForm(initialDetailForm)
    setIsPayMode(false) // Enable Borrowing, Disable Payment
  }

  // 3. Handle "Pay" Button Click (in Table)
  const handlePayClick = (tx) => {
    setIsPayMode(true) // Enable Payment, Disable Borrowing
    
    // Populate form with existing data
    setDetailForm({
      id: tx.id,
      borrowerId: tx.borrowerId,
      borrowedAmt: tx.borrowedAmt,
      borrowedDate: tx.borrowedDate,
      jewName: tx.jewName,
      custName: tx.custName,
      // Payment fields: Default to today, empty amounts
      paidDate: new Date().toISOString().split('T')[0],
      paidAmt: '', 
      paidInterest: ''
    })
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // 4. Save Logic (Handles both New Loan & Repayment)
  const handleDetailSave = (e) => {
    e.preventDefault()

    if (isPayMode) {
      // UPDATE EXISTING TRANSACTION (Repayment)
      setTransactions(transactions.map(t => t.id === detailForm.id ? {
        ...t,
        paidDate: detailForm.paidDate,
        paidAmt: detailForm.paidAmt,
        paidInt: detailForm.paidInterest
      } : t))
      alert("Payment Updated Successfully!")
    } else {
      // CREATE NEW TRANSACTION (Borrowing)
      const borrower = borrowers.find(b => b.id.toString() === detailForm.borrowerId)
      const newTx = {
        ...detailForm,
        id: Date.now(),
        borrowerName: borrower ? borrower.name : 'Unknown',
        paidDate: '-', paidAmt: '-', paidInt: '-' // No payment yet
      }
      setTransactions([newTx, ...transactions])
      alert("New Loan Record Added!")
    }
    handleReset()
  }

  // Registration Handlers (Unchanged)
  const handleRegChange = (e) => setRegForm({...regForm, [e.target.name]: e.target.value})
  const handleRegSave = (e) => { e.preventDefault(); setBorrowers([...borrowers, {...regForm, id: Date.now()}]); alert("Saved"); }

  return (
    <div className="loan-page-container">
      
      {/* TABS */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-white p-0">
          <ul className="nav nav-tabs card-header-tabs m-0">
            <li className="nav-item">
              <button className={`nav-link py-3 px-4 fw-bold rounded-0 border-top-0 border-start-0 ${activeTab === 'details' ? 'active text-primary' : 'text-secondary bg-light'}`} onClick={() => setActiveTab('details')}>
                <i className="fa-solid fa-list-check me-2"></i> Amount Registration
              </button>
            </li>
            <li className="nav-item">
              <button className={`nav-link py-3 px-4 fw-bold rounded-0 border-top-0 ${activeTab === 'registration' ? 'active text-primary' : 'text-secondary bg-light'}`} onClick={() => setActiveTab('registration')}>
                <i className="fa-solid fa-building me-2"></i> Borrower Registration
              </button>
            </li>
          </ul>
        </div>

        {/* ======================= TAB 1: DETAILS ======================= */}
        {activeTab === 'details' && (
          <div className="cdy search-card-body animate__animated animate__fadeIn" style={{maxWidth:'98vw'}}>
            <form onSubmit={handleDetailSave}>
              
              <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
                 <h6 className="fw-bold text-dark m-0">
                    {isPayMode ? <span className="text-success">RECEIVING PAYMENT</span> : <span className="text-primary">NEW BORROWING ENTRY</span>}
                 </h6>
                 {isPayMode && <span className="badge bg-warning text-dark">Payment Mode Active</span>}
              </div>
              
              {/* Row 1: BORROWING DETAILS */}
              <div className="row g-3 mb-3">
                <div className="col-md-3">
                   <label className="form-label fw-bold small text-secondary">Borrower Name (Firm)</label>
                   <select 
                      className="form-select form-select-sm" 
                      name="borrowerId" 
                      value={detailForm.borrowerId} 
                      onChange={handleDetailChange}
                      disabled={isPayMode} // DISABLED WHEN PAYING
                   >
                      <option value="">-- SELECT FIRM --</option>
                      {borrowers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                   </select>
                </div>
                <div className="col-md-3">
                   <label className="form-label fw-bold small text-secondary">Borrowed Amt</label>
                   <input 
                      type="number" className="form-control form-control-sm" 
                      name="borrowedAmt" value={detailForm.borrowedAmt} onChange={handleDetailChange} 
                      disabled={isPayMode} // DISABLED WHEN PAYING
                   />
                </div>
                <div className="col-md-3">
                   <label className="form-label fw-bold small text-secondary">Borrowed Date</label>
                   <input 
                      type="date" className="form-control form-control-sm" 
                      name="borrowedDate" value={detailForm.borrowedDate} onChange={handleDetailChange} 
                      disabled={isPayMode} // DISABLED WHEN PAYING
                   />
                </div>
                <div className="col-md-3">
                   <label className="form-label fw-bold small text-secondary">Jew Name/No</label>
                   <input 
                      type="text" className="form-control form-control-sm" 
                      name="jewName" value={detailForm.jewName} onChange={handleDetailChange} 
                      disabled={isPayMode} // DISABLED WHEN PAYING
                   />
                </div>
              </div>

              {/* Row 2: PAYMENT DETAILS & CUST NAME */}
              <div className="row g-3 mb-3">
                 <div className="col-md-3">
                    <label className="form-label fw-bold small text-secondary">Cust Name (Refinance)</label>
                    <input 
                       type="text" className="form-control form-control-sm" 
                       name="custName" value={detailForm.custName} onChange={handleDetailChange} 
                       disabled={isPayMode} // DISABLED WHEN PAYING
                    />
                 </div>
                 
                 {/* PAYMENT INPUTS - DISABLED unless in Pay Mode */}
                 <div className="col-md-3">
                    <label className="form-label fw-bold small text-success">Paid Date</label>
                    <input 
                       type="date" className="form-control form-control-sm border-success" 
                       name="paidDate" value={detailForm.paidDate} onChange={handleDetailChange} 
                       disabled={!isPayMode} // ENABLED ONLY WHEN PAYING
                    />
                 </div>
                 <div className="col-md-3">
                    <label className="form-label fw-bold small text-success">Paid Amt</label>
                    <input 
                       type="number" className="form-control form-control-sm border-success" 
                       name="paidAmt" value={detailForm.paidAmt} onChange={handleDetailChange} 
                       disabled={!isPayMode} // ENABLED ONLY WHEN PAYING
                    />
                 </div>
                 <div className="col-md-3">
                    <label className="form-label fw-bold small text-success">Paid Interest</label>
                    <input 
                       type="number" className="form-control form-control-sm border-success" 
                       name="paidInterest" value={detailForm.paidInterest} onChange={handleDetailChange} 
                       disabled={!isPayMode} // ENABLED ONLY WHEN PAYING
                    />
                 </div>
              </div>

              {/* Buttons */}
              <div className="d-flex gap-2 justify-content-center mb-4 border-top pt-3">
                 <button type="button" className="btn btn-primary px-4 fw-bold" onClick={handleReset}>
                    <i className="fa-solid fa-plus me-2"></i> New
                 </button>
                 <button type="submit" className="btn btn-success px-4 fw-bold">
                    <i className="fa-solid fa-floppy-disk me-2"></i> {isPayMode ? 'Update Payment' : 'Save Loan'}
                 </button>
                 <button type="button" className="btn btn-dark px-4 fw-bold" onClick={handleReset}>
                    Cancel
                 </button>
              </div>
            </form>

            {/* TABLE */}
            <div className="table-responsive border rounded" style={{maxHeight: '400px'}}>
               <table className="table table-bordered table-striped table-hover mb-0 small text-center align-middle header-fixed">
                  <thead className="table-light sticky-top">
                     <tr>
                        <th>Borrower Name</th>
                        <th>Borrowed Amt</th>
                        <th>Borrowed Date</th>
                        <th>Jewellery Name</th>
                        <th>Cust Name</th>
                        <th>Paid Date</th>
                        <th>Paid Amt</th>
                        <th>Paid Int</th>
                        <th>Action</th>
                     </tr>
                  </thead>
                  <tbody>
                     {transactions.map(tx => (
                        <tr key={tx.id} className={tx.paidAmt && tx.paidAmt !== '-' ? 'table-success' : ''}>
                           <td className="fw-bold text-start text-primary">{tx.borrowerName}</td>
                           <td>{tx.borrowedAmt}</td>
                           <td>{tx.borrowedDate}</td>
                           <td>{tx.jewName}</td>
                           <td className="fst-italic">{tx.custName}</td>
                           <td>{tx.paidDate || '-'}</td>
                           <td className="fw-bold">{tx.paidAmt || '-'}</td>
                           <td className="text-danger">{tx.paidInt || '-'}</td>
                           <td>
                              <button 
                                 className="btn btn-sm btn-outline-success py-0 fw-bold"
                                 onClick={() => handlePayClick(tx)} // TRIGGERS PAY MODE
                              >
                                 <i className="fa-solid fa-hand-holding-dollar me-1"></i> Pay
                              </button>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
          </div>
        )}

        {/* ======================= TAB 2: REGISTRATION ======================= */}
        {activeTab === 'registration' && (
          <div className="card-body search-card-body animate__animated animate__fadeIn" style={{maxWidth:'98vw'}}>
             <div className="p-2 mb-2 bg-dark text-white fw-bold small rounded">FIRM REGISTRATION :</div>
             <form onSubmit={handleRegSave}>
                 {/* ... (Keep your existing registration form code here) ... */}
                 {/* I've abbreviated this part as it wasn't requested to change, 
                     but keep the code I provided in the previous response for this tab */}
                 <div className="row">
                    <div className="col-md-9">
                        <div className="row g-2 mb-2">
                            <label className="col-sm-2 fw-bold small">Name :</label>
                            <div className="col-sm-10"><input className="form-control form-control-sm" name="name" onChange={handleRegChange} required /></div>
                        </div>
                        {/* Add other fields similarly... */}
                    </div>
                    <div className="col-md-3">
                         {/* Image Upload... */}
                    </div>
                 </div>
                 <button type="submit" className="btn btn-sm btn-success mt-3">Save Firm</button>
             </form>
          </div>
        )}

      </div>
    </div>
  )
}