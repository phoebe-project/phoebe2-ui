// adapted from: https://github.com/csepulv/electron-with-create-react-app

const fetch = require('electron-fetch').default;
const child_process = require('child_process');
yargs = require('yargs');

const path = require('path');
const url = require('url');

const electron = require('electron');
// Module to control application life.
const app = electron.app;
// Module to create native browser window.

// parse commandline arguments
version = app.getVersion()
options = yargs(process.argv.slice(1))
options.alias('h', 'help').boolean('help').describe('h', 'show this help and exit')
options.alias('v', 'version').boolean('v').describe('v', 'show the UI version and exit')
options.alias('s', 'server').string('s').describe('s', 'host of the phoebe-server instance (i.e. server.phoebe-project.org, localhost:5000)')
options.alias('b', 'bundle').string('b').describe('b', 'bundleid (must either be already available OR pass j), will be ignored if server not provided')
options.alias('j', 'file').string('j').describe('j', 'json representation of bundle.  If server is not provided, will use the child process.')
options.alias('w', 'wait').boolean('w').describe('w', 'wait until bundleid is available on the server.')
options.alias('f', 'filter').string('f').describe('f', 'filter to apply, will be ignored if server and bundle not provided')
options.alias('a', 'action').string('a').describe('a', 'launch at a given "action" (i.e. ps, figures, run_compute), will be ignore if server and bundle not provided')
options.alias('p', 'portChildServer').number('p').describe('p', 'port to launch child server (defaults to 5000)')
options.alias('n', 'skipChildServer').boolean('n').boolean('skip-child-server').describe('n', 'do not launch a server as a child process')
options.alias('d', 'disableBundleChange').boolean('d').boolean('disable-bundle-change').describe('d', 'disable "new" and "open" bundle buttons')
options.alias('c', 'noWarnOnClose').boolean('c').describe('c', 'do not warn about killing a child server or unsaved changes on close')
options.alias('u', 'webClientUrl').boolean('u').describe('u', 'return the static URL to open as a web-app outside of electron and exit (does not support j)')

global.args = options.argv

if (options.argv.help) {
  process.stdout.write(options.help())
  process.exit(0)
}

if (options.argv.version) {
  process.stdout.write("#"+version+"\n")
  process.exit(0)
}

if (options.argv.u) {
  var u = path.join(__dirname, '/../build/index_static.html')
  if (options.argv.f) {
    u += "?"+options.argv.f
  }
  if (options.argv.s) {
    u += "\#/"+options.argv.s
    if (options.argv.b) {
      u += "/" + options.argv.b
      if (options.argv.a) {
        u += "/" +options.argv.a
      }
    }
  }
  process.stdout.write(u)
  process.exit(0)
}

// if (options.argv.j!==undefined && (options.argv.s===undefined && options.argv.n)) {
//   process.stderr.write("must provide server if choosing to skip child server")
//   process.exit(1)
// }

if (options.argv.p && (options.argv.p < 1000 || options.argv.p > 9999)) {
  process.stderr.write("port must be in range 1000-9999")
  process.exit(1)
}

// if args.help
//   process.stdout.write(options.help())
//   process.exit(0)
//
// if args.version
//   process.stdout.write("#{version}\n")
//   process.exit(0)

global.ignoreArgs = false;
const setIgnoreArgs = (v) => {
  global.ignoreArgs = v
}
global.setIgnoreArgs = setIgnoreArgs;


const prompt = require('electron-prompt');


// make sure the packaged version of chromium can display the built index.html file
//app.commandLine.appendSwitch('allow-file-access');

const BrowserWindow = electron.BrowserWindow;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
var showExitPrompt = true;

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({
      backgroundColor: "#2B71B1",
      width: 1200,
      minWidth: 1000,
      height: 800,
      minHeight: 500,
      icon: __dirname + '/icons/phoebe.png',
      webPreferences: { nodeIntegration: true }
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
    mainWindow.on('close', function(e) {
      if (showExitPrompt) {
        e.preventDefault();

        if (global.pyPort) {
          fetch("http://localhost:"+global.pyPort+"/info")
            .then(res => res.json())
            .then(json => {
              var choice = 0
              var connectedClients = json.data.clients.filter(client => client !== global.clientid)
              if (connectedClients.length > 0 && !options.argv.c) {
                // TODO: only show this if there are clients connected to the server.  Will need to have all clients subscribe and then have the server return the clientids in this fetch.
                choice = electron.dialog.showMessageBoxSync(
                  {
                      type: 'question',
                      buttons: ['Quit', 'Cancel'],
                      title: 'Quit PHOEBE and Kill Server?',
                      message: `Are you sure you want to quit?  Closing this window will kill the child-process server which is connected to ${connectedClients.length} other client(s): ${connectedClients}.`
                  });

              }
              if (choice===0) {
                showExitPrompt = false;
                mainWindow.close();
              }
            })
            .catch(err => {
              showExitPrompt = false;
              mainWindow.close();
            });
        } else {
          showExitPrompt = false;
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

const launchPythonClient = (terminal_cmd, terminal_execute_args, python_cmd, cmd) => {
  return child_process.spawn(terminal_cmd, terminal_execute_args.concat([python_cmd+' -i -c \"'+cmd+'\"']));
}
global.launchPythonClient = launchPythonClient;

const electronPrompt = (title, label, value, width) => {
  prompt({
      title: title,
      label: "<p>"+label+"</p>",
      value:  value,
      width: width,
      useHtmlLabel: true,
      resizable: true,
      inputAttrs: {
          type: 'text'
      },
      type: 'input'
  })
  // .then((r) => {
  //     if(r === null) {
  //         console.log('user cancelled');
  //     } else {
  //         console.log('result', r);
  //     }
  // })
  .catch(console.error);
}
global.electronPrompt = electronPrompt;

const launchCommand = (cmd) => {
  cmd0 = cmd.split(' ')[0];
  args = cmd.split(' ').slice(1);
  return child_process.spawn(cmd0, args);
}
global.launchCommand = launchCommand;

const executeJSwithUserGesture = (code) => {
  return mainWindow.webContents.executeJavaScript(code, true)
}
global.executeJSwithUserGesture = executeJSwithUserGesture;

function randomstr(N) {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < N; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

global.clientid = 'desktop-'+randomstr(5)

// handle spawning a separate process to interact with PHOEBE via a flask server
let pyProc = null;
let pyPort = null;

const selectPort = () => {
  // TODO: logic for scanning for an unused port or try except if 5000 is already used
  return '5000';
}

const testAutofigInstalled = () => {
  ret = child_process.spawnSync('phoebe-autofig');
  if (ret.stdout!==null) {
    return 'phoebe-autofig';
  };
  ret = child_process.spawnSync('autofig');
  if (ret.stdout!==null) {
    return 'autofig';
  } else {
    return null;
  }
}
global.testAutofigInstalled = testAutofigInstalled;

global.pyPort = null;
const launchChildProcessServer = () => {
  // TODO: can we detect if phoebe-server is already running on this port and if so skip?  If something else is on this port, we should raise an error and exit or choose a new port
  if (!pyPort) {
    pyPort = options.argv.p || 5000;
    pyProc = child_process.spawn('phoebe-server', ['--port', pyPort, '--parent', global.clientid]);
    pyProc.on('error', () => {killChildProcessServer()});
  }

  // allow pyPort to be accessible from within the React app
  global.pyPort = pyPort; // if this is null, then phoebe-server not able to launch
}
global.launchChildProcessServer = launchChildProcessServer;

const killChildProcessServer = () => {
  if (pyProc) {
    pyProc.kill();
    // console.log('phoebe-server killed on port: '+global.pyPort);
  }
  pyProc = null;
  pyPort = null;
  global.pyPort = pyPort;
}

if (!options.argv.n) {
  app.on('ready', launchChildProcessServer);
}

app.on('will-quit', killChildProcessServer);

// if (!app.isDefaultProtocolClient('phoebe')) {
//   console.log('setting as protocolclient for phoebe')
//   app.setAsDefaultProtocolClient('phoebe')
// }
