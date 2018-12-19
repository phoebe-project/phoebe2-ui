import React, { Component } from 'react';
import {Redirect} from 'react-router-dom';

// import isElectron from 'is-electron'; // https://github.com/cheton/is-electron
import PanelGroup from 'react-panelgroup'; // https://www.npmjs.com/package/react-panelgroup

import {TagPanel} from './panel-tags';
import {PSPanel} from './panel-ps';
import {FigurePanel} from './panel-figures';
import {Link, generatePath} from './common';
import {Toolbar, Statusbar, Panel} from './ui';

export class Bundle extends Component {
  render() {
    var bundleid = this.props.match.params.bundleid

    var modal = this.props.match.params.modal
    var modalContent = null;

    if (modal) {
      modalContent = <Modal {...this.props} title={modal}>
                        MODAL CONTENT HERE
                     </Modal>
    }

    return (
      <div className="App">
        {modalContent}
        <Toolbar app={this.props.app}/>
        <Statusbar app={this.props.app} bundleid={bundleid}/>

        <div className="d-none d-lg-block" style={{paddingTop: "50px", paddingBottom: "28px", height: "100%"}}>
          {/* need to support down to width of 990 for d-lg */}
          <PanelGroup panelWidths={[
                                      {size: 400, minSize:300, resize: "dynamic"},
                                      {minSize:440, resize: "stretch"},
                                      {size: 400, minSize:250, resize: "dynamic"}
                                   ]}>
            <TagPanel app={this.props.app} bundleid={bundleid}/>
            <PSPanel app={this.props.app} bundleid={bundleid} showPopoutButton={true}/>
            <FigurePanel app={this.props.app} bundleid={bundleid}/>
          </PanelGroup>
        </div>
        <div className="d-block d-lg-none" style={{paddingTop: "50px", paddingBottom: "28px", height: "100%"}}>
          <PSPanel app={this.props.app} bundleid={bundleid}/>
        </div>


      </div>
    )
  }
}

class Modal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      redirect: null,
    };
  }
  close = (e) => {
    e.preventDefault();
    e.stopPropagation();
    this.setState({redirect: generatePath(this.props.app.state.serverHost, this.props.match.params.bundleid)})
  }
  preventPropagationClose = (e) => {
    e.preventDefault();
    e.stopPropagation();
  }
  render() {
    if (this.state.redirect) {
      return (<Redirect to={this.state.redirect}/>)
    }
    return (
      <div className="phoebe-modal-screen" onClick={this.close}>
        <div className="phoebe-modal" onClick={this.preventPropagationClose}>
          <div style={{float: "right", margin: "6px"}}>
            <Link title="close modal" to={generatePath(this.props.app.state.serverHost, this.props.match.params.bundleid)}><span className="fa-lg fa-fw fas fa-times"/></Link>
          </div>
          <div style={{textAlign: "center", fontSize: "1.3em", fontWeight: "bold"}}>
            {this.props.title}
          </div>

          <p>{this.props.children}</p>
        </div>
      </div>
    )
  }
}
