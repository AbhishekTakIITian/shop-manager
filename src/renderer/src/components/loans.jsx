import React, { useState, useEffect } from 'react'
import '../assets/loanPayment.css'
import { ToWords } from 'to-words'
import toast, { Toaster } from 'react-hot-toast'

export const loans = ({ userId, customers, currentRate }) => {
  // Capitalized component name 'Loans' is standard practice

  // --- STATE ---
  const [selectedCustomerId, setSelectedCustomerId] = useState('')

  // Customer Auto-fill Data
  const [customerDetails, setCustomerDetails] = useState({
    name: '',
    phone: '',
    image_path: null
  })

  const initialLoanData = {
    loanId: '', // <--- ADDED HERE
    jewelleryName: '',
    jewelleryDetails: '',
    netWeight: '',
    fineWeight: '',
    goldRate: '',
    valuation: '',
    loanAmount: '',
    amountInWords: '',
    interestRate: '3',
    loanDate: new Date().toISOString().split('T')[0],
    dueDate: ''
  }
  // Form Data
  const [loanData, setLoanData] = useState(initialLoanData)

  // Images State
  const [images, setImages] = useState([null, null, null])
  const [imagePaths, setImagePaths] = useState([null, null, null])

  const isCustomerSelected = !!selectedCustomerId

  // --- HANDLERS ---

  const handleCustomerChange = async (e) => {
    const customerId = e.target.value
    setSelectedCustomerId(customerId)

    const customer = customers.find((c) => c.id.toString() === customerId)

    if (customer) {
      let details = {
        name: customer.name,
        phone: customer.phone,
        image: customer.image
      }
      setCustomerDetails(details)
    } else {
      setCustomerDetails({ name: '', phone: '', image: null })
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    let updatedData = { ...loanData, [name]: value }

    if (name === 'loanAmount') {
      updatedData.amountInWords = convertNumberToWords(value)
    }
    if (name === 'fineWeight') {
      updatedData.valuation = value * currentRate
      console.log(value, currentRate)
    }

    setLoanData(updatedData)
  }

  const handleImageUpload = (index, e) => {
    const file = e.target.files[0]
    if (file) {
      const previewUrl = URL.createObjectURL(file)
      const newImages = [...images]
      newImages[index] = previewUrl
      setImages(newImages)
      let realPath = null
      try {
        realPath = window.api.getFilePath(file)
        const newPaths = [...imagePaths]
        newPaths[index] = realPath
        setImagePaths(newPaths)
        console.log(realPath)
      } catch (e) {
        console.error(`Error found while getting the realPath ${e}`)
      }
    }
  }

  const convertNumberToWords = (amount) => {
    if (!amount) return ''
    const toWords = new ToWords()
    return `${toWords.convert(amount)} (Rupees Only)`
  }

  const handleSave = () => {
    setLoanData(initialLoanData) 
    setSelectedCustomerId('')
    setImages([null, null, null])
    setImagePaths([null, null, null])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if(!loanData.loanId || loanData.loanId.trim() === ''){
      toast.error('Receipt ID is required')
      return
    }

    let newImagePaths = []
    console.log('Saving images')
    try {
      for (const imgPath of imagePaths) {
        if (imgPath) {
          const response = await window.api.saveImage({ sourcePath: imgPath, type: 'loan' })
          console.log(response)
          // `saveImage` in main returns a filename string. Some handlers may return
          // an object like { savedFileName } — handle both cases.
          const savedName = (response && response.savedFileName) ? response.savedFileName : response
          newImagePaths.push(savedName)
        } else {
          newImagePaths.push(null)
        }
      }
      console.log('Saved image paths:', newImagePaths)
      setImagePaths(newImagePaths)
      toast.success('Images saved successfully')
    } catch (e) {
      console.error(`Error saving images ${e}`)
      toast.error(`Error saving images: ${e.message}`)
    }

    console.log('Submitting:', { ...loanData, customerId: selectedCustomerId, imagePaths: newImagePaths })
    toast.loading('Saving Loan...')
    try {
      const response = await window.api.addLoan({
        ...loanData,
        customerId: selectedCustomerId,
        imagePaths: newImagePaths
      })
      toast.dismiss()
      if (response.success) {
        console.log('Loan saved with ID:', response.loanId, response)
        toast.success('Loan saved successfully')
      } else {
        toast.error('Error saving loan')
        console.error(response.message)
      }
    } catch (e) {
      toast.dismiss()
      console.error(`Error saving images ${e}`)
      toast.error(`Error saving images: ${e.message}`)
    }
    
    handleSave()
  }

  return (
    <>
      <div className="loan-page-container">
        <div className="card shadow-sm border-0 mb-5">
          {/* HEADER */}
          <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
            <h5 className="mb-0 fw-bold text-primary">
              <i className="fa-solid fa-scale-balanced me-2"></i> New Gold Loan
            </h5>

            {/* --- NEW INPUT FOR RECEIPT ID --- */}
            <div className="d-flex align-items-center">
              <label className="me-2 fw-bold text-secondary small">Receipt ID:</label>
              <input
                type="text"
                name="loanId"
                className="form-control form-control-sm fw-bold"
                style={{ width: '150px' }}
                value={loanData.loanId}
                onChange={handleInputChange}
                placeholder="Enter Receipt No"
                disabled={!isCustomerSelected}
              />
            </div>
          </div>

          <div className="card-body search-card-body" style={{ maxWidth: '100vw' }}>
            <form onSubmit={handleSubmit}>
              {/* --- SECTION 1: CUSTOMER INFO --- */}
              <div className="row g-3 mb-4 p-3 bg-light rounded border">
                <div className="col-md-4">
                  <label className="form-label fw-bold small text-secondary">Customer Name</label>
                  <select
                    className="form-select"
                    value={selectedCustomerId}
                    onChange={handleCustomerChange}
                  >
                    <option value="">-- Select --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold small text-secondary">Phone No</label>
                  <input
                    type="text"
                    className="form-control"
                    value={customerDetails.phone}
                    readOnly
                    disabled
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold small text-secondary">Status</label>
                  <input type="text" className="form-control" value="Active" readOnly disabled />
                </div>
                {/* Customer Photo Preview */}
                <div className="col-md-2 d-flex align-items-center justify-content-center">
                  {customerDetails.image ? (
                    <div
                      className="ratio ratio-1x1 rounded overflow-hidden shadow-sm"
                      style={{ width: '100px' }}
                    >
                      <img
                        src={customerDetails.image}
                        alt="Cust"
                        className="w-100 h-100"
                        style={{ objectFit: 'cover' }}
                      />
                    </div>
                  ) : (
                    <div
                      className="ratio ratio-1x1 rounded bg-light d-flex align-items-center justify-content-center shadow-sm text-secondary border"
                      style={{ width: '100px' }}
                    >
                      <i className="fa-solid fa-user fa-3x"></i>
                    </div>
                  )}
                </div>
              </div>

              {/* --- SECTION 2: JEWELLERY DETAILS --- */}
              <h6 className="fw-bold text-dark border-bottom pb-2 mb-3">Jewellery Details</h6>

              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label fw-bold small">Jewellery Name</label>
                  <input
                    type="text"
                    className="form-control"
                    name="jewelleryName"
                    value={loanData.jewelleryName}
                    onChange={handleInputChange}
                    placeholder="e.g. Gold Necklace, Ring"
                    disabled={!isCustomerSelected}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold small">
                    Jewellery Details / Description
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    name="jewelleryDetails"
                    value={loanData.jewelleryDetails}
                    onChange={handleInputChange}
                    placeholder="e.g. 22K Hallmarked, broken clasp..."
                    disabled={!isCustomerSelected}
                  />
                </div>
              </div>

              <div className="row g-3 mb-4">
                <div className="col-md-3">
                  <label className="form-label fw-bold small">Net Weight (gms)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    name="netWeight"
                    value={loanData.netWeight}
                    onChange={handleInputChange}
                    disabled={!isCustomerSelected}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold small">Fine Weight (gms)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    name="fineWeight"
                    value={loanData.fineWeight}
                    onChange={handleInputChange}
                    disabled={!isCustomerSelected}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold small">Current Gold Rate (₹)</label>
                  <input
                    type="number"
                    className="form-control"
                    name="goldRate"
                    onChange={handleInputChange}
                    value={currentRate}
                    disabled={!isCustomerSelected || currentRate}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold small">Jewellery's Value (₹)</label>
                  <input
                    type="number"
                    className="form-control bg-light"
                    name="valuation"
                    value={loanData.valuation}
                    onChange={handleInputChange}
                    disabled={!isCustomerSelected}
                    readOnly
                  />
                </div>
              </div>

              {/* --- SECTION 3: LOAN FINANCIALS --- */}
              <h6 className="fw-bold text-dark border-bottom pb-2 mb-3">Loan Particulars</h6>

              <div className="row g-3 mb-3">
                <div className="col-md-4">
                  <label className="form-label fw-bold small">Loan Amount (₹)</label>
                  <input
                    type="number"
                    className="form-control fw-bold"
                    name="loanAmount"
                    value={loanData.loanAmount}
                    onChange={handleInputChange}
                    style={{ fontSize: '1.1rem' }}
                    disabled={!isCustomerSelected}
                  />
                </div>
                <div className="col-md-8">
                  <label className="form-label fw-bold small">Amount in Words</label>
                  <input
                    type="text"
                    className="form-control fst-italic text-muted"
                    value={loanData.amountInWords}
                    readOnly
                  />
                </div>
              </div>

              <div className="row g-3 mb-4">
                <div className="col-md-3">
                  <label className="form-label fw-bold small">Interest Rate (%)</label>
                  <input
                    type="number"
                    className="form-control"
                    name="interestRate"
                    value={loanData.interestRate}
                    onChange={handleInputChange}
                    disabled={!isCustomerSelected}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold small">Issue Date</label>
                  <input
                    type="date"
                    className="form-control"
                    name="loanDate"
                    value={loanData.loanDate}
                    onChange={handleInputChange}
                    disabled={!isCustomerSelected}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold small">Due Date</label>
                  <input
                    type="date"
                    className="form-control"
                    name="dueDate"
                    onChange={handleInputChange}
                    disabled={!isCustomerSelected}
                  />
                </div>
              </div>

              {/* --- SECTION 4: IMAGE UPLOADS --- */}
              <h6 className="fw-bold text-dark border-bottom pb-2 mb-3">Jewellery Images</h6>
              <div className="row g-3">
                {[0, 1, 2].map((index) => (
                  <div key={index} className="col-md-4">
                    <div
                      className="border rounded bg-light d-flex flex-column justify-content-center align-items-center position-relative"
                      style={{ height: '200px', borderStyle: 'dashed' }}
                    >
                      {images[index] ? (
                        <img
                          src={images[index]}
                          alt="Preview"
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                      ) : (
                        <div className="text-center text-muted">
                          <i className="fa-solid fa-camera fa-2x mb-2"></i>
                          <p className="small mb-0">Upload Image {index + 1}</p>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="position-absolute w-100 h-100 opacity-0"
                        style={{ cursor: 'pointer' }}
                        onChange={(e) => handleImageUpload(index, e)}
                        disabled={!isCustomerSelected}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* --- FOOTER BUTTONS --- */}
              <div className="d-flex justify-content-end gap-2 mt-5 pt-3 border-top">
                <button type="button" className="btn btn-secondary px-4" onClick={handleSave}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-success px-5 fw-bold"
                  onClick={handleSubmit}
                >
                  Save Loan
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <Toaster></Toaster>
    </>
  )
}
