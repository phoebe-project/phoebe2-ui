import React, { Component } from 'react';
import './App.css';

import isElectron from 'is-electron'; // https://github.com/cheton/is-electron

class App extends Component {
  render() {
    return (
      <div className="App">
        <div className="App-header">
          <h2>Welcome to PHOEBE2-UI</h2>
        </div>
        <p className="App-intro">
          Welcome to PHOEBE User Interface!
        </p>
        { isElectron() ?
          <p>Running from within Electron</p>
          :
          <p>Running as a web-app</p>
        }
      </div>
    );
  }
}

export default App;
