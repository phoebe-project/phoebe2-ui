import React, { Component } from 'react';

// import isElectron from 'is-electron'; // https://github.com/cheton/is-electron

import {Link, generatePath} from './common';




export class Bundle extends Component {
  launchPythonClient = () => {
    console.log("Bundle.launchPythonClient")
    if (this.props.app.state.isElectron) {
      window.require('electron').remote.getGlobal('launchPythonClient')('import phoebe');
    } else {
      alert("cannot launch from webapp... eventually this will raise a modal with a script you can copy and paste into a terminal")
    }
  }

  render() {
    var bundleid = this.props.match.params.bundleid

    var modal = this.props.match.params.modal
    var modalContent = null;

    if (modal) {
      modalContent = <Modal {...this.props}>{modal}</Modal>
    }

    return (
      <div>
        <h1 style={{textAlign: 'center', color: 'blue'}}>Bundle ({bundleid}) Content Here</h1>
        <p>Server running PHOEBE v{this.props.app.state.serverPhoebeVersion}</p>
        {modal ?
          modalContent
          :
          <Link to={generatePath(this.props.app.state.serverHost, bundleid, 'add_compute')}>b.add_compute</Link>
        }
        <br/><br/>
        <button onClick={this.launchPythonClient}>Launch Python Client</button>
        <br/><br/>
        <Link to={generatePath(this.props.app.state.serverHost)}>Close Bundle</Link>
        <br/><br/>
        <Link to={generatePath()}>Close Bundle & Disconnect Server</Link>
      </div>
    )
  }
}

class Modal extends Component {
  render() {
    return (
      <div>
        <p>{this.props.children}</p>
        <Link to={generatePath(this.props.app.state.serverHost, this.props.match.params.bundleid)}>Close Modal</Link>
      </div>
    )
  }
}
