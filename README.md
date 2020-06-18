# PHOEBE2-UI

Web app and desktop app for interacting with [PHOEBE 2](https://github.com/phoebe-project/phoebe2).


# Developing

PHOEBE2-UI is built on the following:
* ReactJS
* Electron
* Setup inspired by [electron-with-create-app](https://github.com/csepulv/electron-with-create-react-app)
* Web-sockets to communicate to phoebe-server

## Running Locally

### Dependencies

see [installing node and npm on Ubuntu](https://tecadmin.net/install-latest-nodejs-npm-on-ubuntu/)

  * node
  * npm
  * [phoebe2](https://www.github.com/phoebe-project/phoebe2) (currently needs the latest version of the `fitting` branch installed which requires `pip install flask flask-sqlalchemy flask-socketio gevent-websocket "python-socketio[client]"`, once released, PHOEBE 2.3+ will only be required for running the server locally).

while in top-level directory, install all local dependencies into the `node_modules` directory (not under version-control):

```bash
npm install
```

### Local Development

```bash
npm run dev
```

will launch the webserver on http://localhost:3000 and open the Electron app.  Both will update/refresh when updates are made to the code.

## Deploying Web App

```bash
npm run build
```

(eventually will add a deploy option, for now will need to copy all files to directory on the web-server)

## Packaging Electron App

Dependencies:
* `wine`, `mono-develop` (if using Linux and trying to build for windows)
* `rpm` (if using Debian-based system and trying to create rpm installer)

```bash
npm run package
```

will package PHOEBE2-UI for your system.


```bash
npm run package:all
```

will package PHOEBE2-UI for all systems and also create appropriate archives.

These commands will create a directory for each distribution type in the `dist` directory (not under version-control).

### Creating Installers

**NOTE**: this can take a *long* time and generally only needs to be done when preparing to publish a release.

To create installers for all supported distributions (currently includes .deb, .exe, .dmg, .rpm):

```bash
npm run package:installer:all
```

will create installers in the `dist/installers` directory (not under version-control) from the latest created package versions (call `npm run package:all` first, if necessary).

Alternatively, you can call `npm run package:installer:deb64`, `npm run package:installer:rpm64`, `npm run package:installer:dmg`, `npm run package:installer:exe32`, `npm run package:installer:exe64` separately.  See the dependencies section above for possible packages that may need to be installed in order to generate installers.

To include other installers, see the available list [here](https://github.com/electron-userland/electron-packager#distributable-creators) and edit the scripts entry in [package.json](package.json) (make sure to include a link from the package:installer:all entry as well).

## Development notes

* Most state is held in the App component in [App.js](/src/App.js) (including the server connection) or the Bundle component in [bundle.jsx](/src/Bundle.jsx) (including information about all parameters, filtering, etc).  Flux, Redux, etc are currently overkill for what we need, so this allows all state to be in one place and easily passed down to other components by passing `app` and/or `bundle` as properties.

* All Router components in [App.js](/src/App.js) should be wrapped in a Server component to handle parsing the URL and making sure the connection is correct.

* All electron-only capability is handled in [electron-starter.js](/src/electron-starter.js) and exposed via `global.`.  These are then available from React components via `window.require('electron').remote.getGlobal()`.

All .jsx files use [Babel](https://babeljs.io/) syntax with [ES6](http://es6-features.org/) support.
