import React, { Component } from 'react';

export class NotFound extends Component {
  render() {
    return (
      <div>
        <h1 style={{textAlign: 'center', color: 'red'}}>Sorry, this page couldn't be found</h1>
        <div style={{textAlign: 'center', paddingTop: '20px'}}>{this.props.children}</div>
      </div>
    )
  }
}
