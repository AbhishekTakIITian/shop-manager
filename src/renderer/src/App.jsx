import Login from './components/login'
import { dashboard as Dashboard } from './components/dashboard'
import { useState } from 'react'
import { nav as Nav } from './components/nav'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import { loans as Loans } from './components/loans'
import { LoanPayment } from './components/LoanPayment'
import { LoanDetails } from './components/LoanDetails'
import { Customers } from './components/Customers'
import { Pushkraj } from './components/Pushkraj'

function App() {
  const ipcHandle = () => window.electron.ipcRenderer.send('ping')
  const [customers, setCustomers] = useState([])
  const [isLoggedIn, setIsLoggedIn] = useState(false) // Example condition for demonstration
  const [user, setUser] = useState(null)
  const [rate, setRate] = useState(null)

  const handleLoginSuccess = (userData) => {
    console.log('Login success signal received in App.jsx')
    setUser(userData)
    console.log(userData)
    setIsLoggedIn(true) // <--- This triggers the screen switch
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setUser(null)
  }

  return (
    <Router>
      {!isLoggedIn ? (
        <Login onLoginSuccess={handleLoginSuccess} setCustomers={setCustomers} />
      ) : (
        <>
          <Nav></Nav>
          <Routes>
            <Route
              path="/"
              element={
                <Dashboard
                  userId={user.userId}
                  customers={customers}
                  setCustomers={setCustomers}
                  rate={rate}
                  setRate={setRate}
                ></Dashboard>
              }
            />
            <Route
              path="/loans"
              element={
                <Loans userId={user.userId} customers={customers} currentRate={rate}></Loans>
              }
            />
            <Route
              path="/loan-payment"
              element={
                <LoanPayment
                  customers={customers}
                  userId={user.userId}
                  currentRate={rate}
                ></LoanPayment>
              }
            />
            <Route path="/loan-details" element={<LoanDetails></LoanDetails>} />
            <Route
              path="/customers"
              element={
                <Customers
                  userId={user.userId}
                  customers={customers}
                  setCustomers={setCustomers}
                ></Customers>
              }
            />
            <Route path="/pushkraj" element={<Pushkraj></Pushkraj>} />
          </Routes>
        </>
      )}
    </Router>
  )
}
export default App
