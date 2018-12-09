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
  * [phoebe2](https://www.github.com/phoebe-project/phoebe2) (currently needs the latest version of the `client` branch installed which requires `pip install flask flask-sqlalchemy flask-socketio gevent-websocket socketIO-client`, eventually phoebe will only be required for running the server locally).

while in top-level directory, install all local dependencies into the `node_modules` directory (not under version-control):

```bash
npm install
```

### Local Development

```bash
npm run dev
```

will launch the webserver on http://localhost:3000 and open a the Electron app.  Both will update/refresh when updates are made to the code.

## Deploying Web App

```bash
npm run build
```

(eventually will add a deploy option, for now will need to copy all files to directory on the web-server)

## Packaging Electron App

Dependencies:
* `wine` (if using Linux and trying to build for windows)
* `rpm` (if using Debian-based system and trying to create rmp installer)

```bash
npm run package
```

will package PHOEBE2-UI for your system.


```bash
npm run package:all
```

will package PHOEBE2-UI for all systems.

These commands will create a directory for each distribution type in the `dist` directory (not under version-control).

### Creating Installers

**NOTE**: this can take a *long* time and generally only needs to be done when preparing to publish a release.

To create installers for all supported distributions (currently includes .deb, .exe. .dmg, .rpm):

```bash
npm run package:installer:all
```

will create installers in the `dist/installers` directory (not under version-control).

Alternatively, you can call `npm run package:installer:deb64`, `npm run package:installer:rpm64`, `npm run package:installer:dmg`, and `npm run package:installer:exe` separately.  


To include other installers, see the available list [here](https://github.com/electron-userland/electron-packager#distributable-creators) and edit the scripts entry in [package.json](package.json) (make sure to include a link from the package:installer:all entry as well).


## Development notes

All .jsx files use [Babel](https://babeljs.io/) syntax with [ES6](http://es6-features.org/) support.
