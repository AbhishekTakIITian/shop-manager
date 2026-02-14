import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { initDB, loginUser, getAllCustomers, createCustomer, updateCustomer, deleteCustomer, addLoan} from './db'
import path from 'path'
import fs from 'fs'

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  initDB() // Initialize the database and tables

  ipcMain.handle('login-request', async (event, credentials) => {
    const { username, password } = credentials
    console.log('Login attempt for:', username)

    // Call our database function
    const result = loginUser(credentials)
    return result
  })

  ipcMain.handle('get-all-customers', async (event, userId) => {
    console.log('Fetching all customers from database')
    const customers = getAllCustomers(userId)
    // console.log("Retrieved customers:", customers);
    return customers
  })

  ipcMain.handle('create-customer', async (event, customerData) => {
    console.log('Creating customer:', customerData.name)
    const result = createCustomer(customerData)
    return result
  })

  ipcMain.handle('update-customer', async (event, customerData) => {
    console.log('Updating customer:', customerData.name, customerData.id)
    const result = updateCustomer(customerData)
    return result
  })

  ipcMain.handle('delete-customer', async (event, customer) => {
    console.log('Deleting customer with ID:', customer.id)
    if(!customer.image){
      console.log('No image associated with this customer.')
    }else{
      try{
        const userDataPath = app.getPath('userData');
        const filePath = path.join(userDataPath, 'customerImages', customer.image);
        if(fs.existsSync(filePath)){
          fs.unlinkSync(filePath);
          console.log('Deleted customer image:', filePath);
        }else{
          console.log('Customer image file does not exist:', filePath);
        }
      }catch(e){
        console.error('Error deleting customer image:', e);
        return {success: false, message: `Error deleting customer image: ${e.message}`};
      }
    }
    const result = deleteCustomer(customer.id)
    return result
  })



  ipcMain.handle('add-loan', async (event, loanData) => {
    console.log('Adding loan for customer ID:', loanData)  
    const result = addLoan(loanData)
    console.log('Loan added with result:', result)
    return result
  })


  ipcMain.handle('save-image', async (event, imageDetails) => {
    const { sourcePath, type } = imageDetails;
    console.log('Saving image from path:', sourcePath, 'of type:', type)
    if(type === 'customer'){
      console.log('Saving customer image from path:', sourcePath)
        try {
        // 1. Get path to AppData/YourAppName/customerImages
        const userDataPath = app.getPath('userData')
        const imagesDir = path.join(userDataPath, 'customerImages')

        // 2. Create directory if it doesn't exist
        if (!fs.existsSync(imagesDir)) {
          fs.mkdirSync(imagesDir, { recursive: true })
        }

        // 3. Generate a unique filename (to avoid overwriting)
        const fileExtension = path.extname(sourcePath)
        const fileName = `cust_${Date.now()}${fileExtension}`
        const destinationPath = path.join(imagesDir, fileName)

        // 4. Copy the file
        fs.copyFileSync(sourcePath, destinationPath)

        // console.log('Image saved to:', destinationPath)
        return fileName // Return ONLY the filename to save in the DB
      } catch (error) {
        console.error('Error saving image:', error)
        throw error
      }
    }else{
      console.log('Saving loan image from path:', sourcePath)
      try {
        // 1. Get path to AppData/YourAppName/customerImages
        const userDataPath = app.getPath('userData')
        const imagesDir = path.join(userDataPath, 'loanImages')

        // 2. Create directory if it doesn't exist
        if (!fs.existsSync(imagesDir)) {
          fs.mkdirSync(imagesDir, { recursive: true })
        }

        // 3. Generate a unique filename (to avoid overwriting)
        const fileExtension = path.extname(sourcePath)
        const fileName = `loan_${Date.now()}${fileExtension}`
        const destinationPath = path.join(imagesDir, fileName)

        // 4. Copy the file
        fs.copyFileSync(sourcePath, destinationPath)

        // console.log('Image saved to:', destinationPath)
        return fileName // Return ONLY the filename to save in the DB
      } catch (error) {
        console.error('Error saving image:', error)
        throw error
      }
    }
    
  })

  ipcMain.handle('read-image', async (event, relativePath) => {
    try {
      // 1. Construct the full path
      // Assuming images are stored in a folder named 'customer_images' inside AppData
      const userDataPath = app.getPath('userData')
      const fullPath = join(userDataPath, 'customerImages', relativePath)

      // 2. Check if file exists
      if (!fs.existsSync(fullPath)) {
        return null // Return null if no image found
      }

      // 3. Read the file as a buffer and convert to Base64
      const fileData = fs.readFileSync(fullPath)
      const base64Image = `data:image/jpeg;base64,${fileData.toString('base64')}`

      return base64Image
    } catch (error) {
      console.error('Error reading image:', error)
      return null
    }
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
