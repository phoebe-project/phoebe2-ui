import React, { Component } from 'react';

import {Link as RouterLink} from 'react-router-dom';

import history from './history'

export class Link extends Component {
  render() {
    return (
      <RouterLink {...this.props}>{this.props.children}</RouterLink>
    )
  }
}

export class DisconnectServerButton extends Component {
  onClick = () => {
    this.props.app.disconnectServer();
    if (this.props.closeBundle) {
      history.push("/")
    }

  }
  render() {
    var buttonText = this.props.buttonText || "Disconnect Server"
    if (this.props.closeBundle && !this.props.buttonText) {
      buttonText = "Close Bundle and Disconnect Server"
    }

    return (
      <button onClick={this.onClick}>{buttonText}</button>
    )
  }
}
