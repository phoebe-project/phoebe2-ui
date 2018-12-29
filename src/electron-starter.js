// adapted from: https://github.com/csepulv/electron-with-create-react-app

const fetch = require('electron-fetch').default;
const child_process = require('child_process');

const electron = require('electron');
// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

const path = require('path');
const url = require('url');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({
      backgroundColor: "#2B71B1",
      width: 1200,
      minWidth: 1000,
      height: 800,
      minHeight: 500,
      icon: __dirname + '/icons/phoebe.png'
    });

    // and load the index.html of the app.
    const startUrl = process.env.ELECTRON_START_URL || url.format({
            pathname: path.join(__dirname, '/../build/index.html'),
            protocol: 'file:',
            slashes: true
        });
    mainWindow.loadURL(startUrl);
    // Open the DevTools.
    // mainWindow.webContents.openDevTools();

    // Confirm before closing the app as that will kill the child-process server
    mainWindow.showExitPrompt = true;
    mainWindow.on('close', function(e) {
      if (mainWindow.showExitPrompt) {
        e.preventDefault();

        if (global.pyPort) {
          fetch("http://localhost:"+global.pyPort+"/info")
            .then(res => res.json())
            .then(json => {
              // TODO: only show this if there are clients connected to the server.  Will need to have all clients subscribe and then have the server return the clientids in this fetch.
              var choice = electron.dialog.showMessageBox(
                {
                    type: 'question',
                    buttons: ['Quit', 'Cancel'],
                    title: 'Quit PHOEBE and Kill Server?',
                    message: `Are you sure you want to quit?  Closing this window will kill the child-process server running PHOEBE ${json.data.phoebe_version}`
                });

              if (choice===0) {
                mainWindow.showExitPrompt = false;
                mainWindow.close();
              }
            })
            .catch(err => {
              mainWindow.showExitPrompt = false;
              mainWindow.close();
            });
        } else {
          mainWindow.showExitPrompt = false;
          mainWindow.close();
        }
      }
    })

    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null
    })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
});

app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow()
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

// functions that will be available to electron apps only.  These can be accessed
// from JSX files if app.isElectron via
// require('electron').remote.getGlobal('launchPythonClient'), for example

// const electronStorage = require('electron-json-storage')
// global.electronStorage = electronStorage

const launchPythonClient = (cmd) => {
  return child_process.spawn('gnome-terminal', ['-e', 'python -i -c \''+cmd+'\'']);
}
global.launchPythonClient = launchPythonClient;

const executeJSwithUserGesture = (code) => {
  return mainWindow.webContents.executeJavaScript(code, true)
}
global.executeJSwithUserGesture = executeJSwithUserGesture;


// handle spawning a separate process to interact with PHOEBE via a flask server
let pyProc = null;
let pyPort = null;

const selectPort = () => {
  // TODO: logic for scanning for an unused port or try except if 5000 is already used
  return '5000';
}

const createPyProc = () => {
  pyPort = selectPort();
  global.appid = 'desktop-randomstring'
  pyProc = child_process.spawn('phoebe-server', [pyPort, global.appid]);
  if (pyProc != null) {
    console.log('phoebe-server started on port: '+pyPort);
    // allow pyPort to be accessible from within the React app
    global.pyPort = pyPort;
  }
}

const exitPyProc = () => {
  pyProc.kill();
  console.log('phoebe-server killed on port: '+pyPort);
  pyProc = null;
  pyPort = null;
}


app.on('ready', createPyProc);

app.on('will-quit', exitPyProc);
