import { useState, useEffect } from 'react'
import toast, { Toaster } from 'react-hot-toast';
import '../assets/dashboard.css'
import React from 'react'
export const dashboard = ({userId, customers, setCustomers, rate, setRate}) => {
  const [isLoading, setIsLoading] = useState(false)
  // let [rate, setRate] = useState(null)
  const handleSubmit = (e) => {
    e.preventDefault()
    console.log(rate)
    toast.success(`Today's Rate set to ${rate} per gram`)
  }
  
  // Customer fetching is now handled after login in `Login.jsx`.
  
  return (
    <>
      <div className="d-flex dashboardContainer align-items-center justify-content-center bg-dark">
        <div className="card shadow" style={{ maxWidth: '400px', width: '100%' }}>
          <div className="card-body p-4">
            {' '}
            <div className="text-center mb-4">
              <h3 className="card-title fw-bold">Today's Rate</h3>
            </div>
            <div className="Irate">
              <input
                type="number"
                placeholder="Rate per gram"
                value={rate}
                onChange={
                  (e) => (setRate(e.target.value))
                }
              ></input>
            </div>
            <div className="d-grid">
              <button type="button" className="btn btn-primary btn-lg" onClick={handleSubmit}>
                set
              </button>
            </div>
          </div>
        </div>
      </div>
      <Toaster 
        position='bottom-right'
      />
    </>
  )
}
