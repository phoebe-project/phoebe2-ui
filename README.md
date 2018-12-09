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

### Deploying Web App

```bash
npm build
```

(eventually will add a deploy option, for now will need to copy all files to directory on the web-server)

### Packaging Electron App

TBD


## Development notes

All .jsx files use [Babel](https://babeljs.io/) syntax with [ES6](http://es6-features.org/) support.
