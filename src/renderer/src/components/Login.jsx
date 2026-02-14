import React, { useState } from 'react'
import '@fortawesome/fontawesome-free/css/all.min.css'
import '../assets/login.css'
import toast, { Toaster } from 'react-hot-toast';

export default function Login({onLoginSuccess, setCustomers}){
  let [userId, setUserId] = useState(null)
  let [username, setUsername] = useState('')
  let [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  
  

  const onhandleSubmit = async (e)=> {
    e.preventDefault()
    setErrorMessage('') // Clear previous errors

    // 1. Validation
    if (!username || !password) {
      setErrorMessage('Please fill in all fields')
      return
    }

    try {
      // 2. Call the API defined in preload/index.js
      // We wrap it in a try-catch to handle any system errors
      const response = await window.api.login({ username, password })

      // 3. Handle the Result
      if (response.success) {
        console.log('Login Successful:', response.user)
        setUserId(response.user.userId);
        onLoginSuccess(response.user); // Notify parent component
        toast.success(`Welcome back, ${response.user.username}!`)

        // Fetch customers immediately after successful login and populate App state
        if (setCustomers) {
          try {
            toast.loading('Loading customers...')
            const data = await window.api.getAllcustomers(response.user.userId)
            const customersWithImages = await Promise.all(
              data.map(async (c) => {
                let currImagePath = c.image || null
                let viewableImage = null
                if (c.image) {
                  viewableImage = await window.api.readImage(c.image)
                }
                return { ...c, image: viewableImage, imagePath: currImagePath }
              })
            )
            setCustomers(customersWithImages)
            toast.dismiss()
            toast.success('Customers loaded successfully!')
          } catch (err) {
            console.error('Error loading customers after login:', err)
            toast.dismiss()
            toast.error('Failed to load customers')
          }
        }
      } else {
        setErrorMessage(response.message) // e.g. "Invalid password"
      }
    } catch (error) {
      console.error(error)
      setErrorMessage('System error. Check console.')
    }
    
  }
  
  return (
    <>
    <div className="d-flex vh-100 align-items-center justify-content-center bg-dark">
      <div className="card shadow" style={{ maxWidth: '400px', width: '100%' }}>
        <div className="card-body p-4">
          {' '}
          <div className="text-center mb-4">
            <i className="fa-solid fa-lock fa-2x text-primary mb-2"></i>
            <h3 className="card-title fw-bold">Login</h3>
          </div>
          {/* ERROR MESSAGE DISPLAY */}
          {errorMessage && (
            <div className="alert alert-danger text-center p-2 mb-3" role="alert">
              {errorMessage}
            </div>
          )}
          <div className="mb-3">
            <label className="form-label fw-bold">Username</label>
            <div className="input-group">
              <span className="input-group-text">
                <i className="fa-solid fa-circle-user"></i>
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="form-label fw-bold">Password</label>
            <div className="input-group">
              <span className="input-group-text">
                <i className="fa-solid fa-key"></i>
              </span>
              <input
                type="password"
                className="form-control"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          <div className="d-grid">
            <button type="button" className="btn btn-primary btn-lg" onClick={onhandleSubmit}>
              Login
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
