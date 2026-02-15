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

  const printReceipt = (loan, customer) => {
    // Terms extracted from your file
    const terms = [
      "व्याज दर 1 महिन्याचे देणे आहे.",
      "पत्ता बदलल्यास कळवावे.",
      "एक वर्षानंतर किंवा त्यापूर्वी बाकी व तारण मालाची किंमत सारखी झाल्यास विक्री करून बाकी वसूल केले जाईल.",
      "तारण माल चोरी / तोडफोड झाल्यास अथवा १ ग्रॅम सोने फॉर्मिंगचा नजर चुकीने ठेवल्यास त्याची जबाबदारी कर्जदारावर राहील.",
      "एक वर्षानंतर कर्जदारास तारण मालाची विक्री झाल्यास तारण माल परत मिळणार नाही व रेकॉर्ड पाहण्यास मिळणार नाही.",
      "दिलेले कर्ज बिगरशेती, दवाखाना, घरखर्च, शिक्षण इ. असल्याने या कर्जास कर्जमुक्ती कायदा लागू होणार नाही. या प्रमाणे पावती मिळाली.",
      "सदर तारण माल पैसे जमा केल्यास 1 दिवसा नंतर मिळेल.",
      "मालकाशिवाय व पावतीशिवाय वस्तु मिळणार नाही."
    ]

    // Construct the HTML String
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Loan Receipt</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;700&display=swap');
          body { font-family: 'Noto Sans Devanagari', sans-serif; padding: 20px; color: #000; }
          .container { border: 2px solid #000; padding: 15px; width: 100%; box-sizing: border-box; }
          .header { text-align: center; margin-bottom: 20px; }
          .shree { font-weight: bold; margin-bottom: 5px; }
          .ass-logo { font-weight: 900; font-size: 24px; border: 2px solid #000; display: inline-block; padding: 2px 10px; border-radius: 50%; margin-bottom: 5px; }
          .shop-name { font-size: 26px; font-weight: bold; margin: 5px 0; }
          .address { font-size: 14px; margin-bottom: 4px; }
          .contact { font-size: 14px; font-weight: bold; }
          .meta-row { display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 15px; border-bottom: 1px solid #000; padding-bottom: 10px; }
          .row { display: flex; margin: 6px 0; align-items: baseline; }
          .label { font-weight: bold; min-width: 180px; font-size: 14px; }
          .value { border-bottom: 1px dotted #000; flex-grow: 1; padding-left: 10px; font-weight: 500; font-size: 14px; }
          .terms-box { margin-top: 15px; border-top: 2px solid #000; padding-top: 10px; }
          .terms-title { font-weight: bold; text-decoration: underline; margin-bottom: 5px; font-size: 14px; }
          .terms-list { padding-left: 20px; font-size: 11px; line-height: 1.3; margin: 0; }
          .footer { display: flex; justify-content: space-between; margin-top: 40px; padding-top: 10px; }
          .sig-block { text-align: center; width: 200px; border-top: 1px solid #000; padding-top: 5px; font-weight: bold; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="shree">|| श्री ||</div>
            <div class="ass-logo">ASS</div>
            <div class="shop-name">आमोल सुधाकर शहाणे</div>
            <div class="address">पत्ता : ८७८, प.म.पेठ, शेटे मार्केट, सराफ बाजार, सोलापूर</div>
            <div class="contact">मो. नं. : ९८८९५२५९९०, ७७७०२२४५४२०</div>
          </div>

          <div class="meta-row">
            <div>अनुक्रमांक (Receipt No): ${loan.loanId || ''}</div>
            <div>दिनांक (Date): ${loan.loanDate || ''}</div>
          </div>

          <div class="row"><div class="label">कर्जदाराचे नाव :</div><div class="value">${customer.name || ''}</div></div>
          <div class="row"><div class="label">पत्ता :</div><div class="value">${customer.address || ''}</div></div>
          <div class="row"><div class="label">कर्जाऊ रक्कम रुपये :</div><div class="value">${loan.loanAmount || ''} /-</div></div>
          <div class="row"><div class="label">अक्षरी (In Words) :</div><div class="value">${loan.amountInWords || ''}</div></div>
          <div class="row"><div class="label">कर्जाची तारीख :</div><div class="value">${loan.loanDate || ''}</div></div>
          <div class="row"><div class="label">कर्जाची मुदत पूरी होण्याची तारीख :</div><div class="value">${loan.dueDate || ''}</div></div>

          <div style="margin-top: 10px;">
            <div class="row"><div class="label">तारण असल्यास त्याचे स्वरूप :</div><div class="value">${loan.jewelleryName || ''} - ${loan.jewelleryDetails || ''}</div></div>
            <div class="row"><div class="label">तारण मालाचे अंदाजे वजन (ग्राम) :</div><div class="value">${loan.netWeight || ''} gm</div></div>
            <div class="row"><div class="label">तारण मालाचे अंदाजे किंमत रुपये :</div><div class="value">${loan.valuation || ''} /-</div></div>
          </div>

          <div class="terms-box">
            <div class="terms-title">कर्जास शर्ती :</div>
            <ol class="terms-list">${terms.map(item => `<li>${item}</li>`).join('')}</ol>
          </div>

          <div class="footer">
            <div class="sig-block">सावकाराची सही</div>
            <div class="sig-block">कर्जदाराची सही किंवा नि. डावे हाताचा अंगठा</div>
          </div>
        </div>
      </body>
      </html>
    `

    // Send to Main Process
    toast.loading('Generating Receipt...')
    window.api.printReceipt(html)
    setTimeout(() => toast.dismiss(), 1000)
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
        printReceipt(loanData, customerDetails, response.id)
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
