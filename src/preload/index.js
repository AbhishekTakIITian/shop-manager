import { contextBridge, ipcRenderer, webUtils} from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  // We create a function 'login' that React can call
  login: (credentials) => ipcRenderer.invoke('login-request', credentials),
  readImage: (path) => ipcRenderer.invoke('read-image', path),
  getAllcustomers: (userId) => ipcRenderer.invoke('get-all-customers', userId),
  createCustomer: (customerData) => ipcRenderer.invoke('create-customer', customerData),
  updateCustomer: (customerData) => ipcRenderer.invoke('update-customer', customerData),
  deleteCustomer: (customer) => ipcRenderer.invoke('delete-customer', customer),
  addLoan: (loanData) => ipcRenderer.invoke('add-loan', loanData),
  saveImage: (imageDetails) => ipcRenderer.invoke('save-image', imageDetails),
  getFilePath: (file) => webUtils.getPathForFile(file)
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api) // <--- Exposing our API here
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}