import React, { Component } from 'react';

import {Link, DisconnectServerButton} from './common';

export class Bundle extends Component {
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
          <Link to={'/'+bundleid+'/add_compute'}>b.add_compute</Link>
        }
        <br/><br/>
        <Link to={'/'}>Close Bundle</Link>
        <br/><br/>
        <DisconnectServerButton app={this.props.app} closeBundle={true}/>
      </div>
    )
  }
}

class Modal extends Component {
  render() {
    return (
      <div>
        <p>{this.props.children}</p>
        <Link to={'/'+this.props.match.params.bundleid}>Close Modal</Link>
      </div>
    )
  }
}
