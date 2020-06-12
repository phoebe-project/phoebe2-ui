import React, { Component } from 'react';
import {Redirect} from 'react-router-dom';

import {SortableContainer, SortableElement, SortableHandle} from 'react-sortable-hoc'; // https://github.com/clauderic/react-sortable-hoc

import {Link, generatePath, popUpWindow, randomstr} from './common';
import {Tour} from './tour';
import {Panel} from './ui';

const DragHandle = SortableHandle(() => <span className='fas fa-grip-lines' style={{paddingRight: "10px"}}/>); // This can be any component you want

export class FigurePanel extends Component {

  popFigures = () => {
    var bundleid = this.props.bundleid || this.props.match.params.bundleid

    var url = generatePath(this.props.app.state.serverHost, bundleid, 'figures');
    var win = popUpWindow(url, window.location.search);
    // TODO: callback to remove from childrenWindows when manually closed?
    this.props.bundle.childrenWindows.push(win);
  }


  render() {

    return (
      <Panel inactive={this.props.inactive} backgroundColor="#f0f0f0">

        {this.props.showPopoutButton ?
          <div style={{float: "right", marginTop: "6px", paddingRight: "10px"}}>
            <span className="btn btn-blue" onClick={this.popFigures} style={{height: "34px", width: "34px"}} title="popout into external window"><span className="fas fa-fw fa-external-link-alt"/></span>
          </div>
          :
          null
        }

        {this.props.FigurePanelOnly ?
          null
          :
          <Tour app={this.props.app} bundle={this.props.bundle} bundleid={this.props.bundleid}/>
        }

        <div style={{padding: "0px"}}>
          <SortableFigureList figures={this.props.bundle.state.figures} app={this.props.app} bundle={this.props.bundle} FigurePanelOnly={this.props.FigurePanelOnly} onSortEnd={this.props.bundle.onFigureSortEnd} useDragHandle={true} axis={this.props.FigurePanelOnly ? 'xy' : 'y'} lockAxis={this.props.FigurePanelOnly ? null : 'y'} />
          {/* <TagSectionActionButton app={this.props.app} type='add' sectionLabel='Figure' label=' Add New Figure' tagLabelsList={[]}/> */}
        </div>


        {this.props.bundle.state.figures.length > 0 && !this.props.FigurePanelOnly ?
          <div>
            <EditFigureTimeSourceButton app={this.props.app} bundle={this.props.bundle}/>
          </div>
          :
          null
        }


      </Panel>
    )
  }
}


const SortableFigureItem = SortableElement(({figure, app, bundle, FigurePanelOnly}) => {

  var figureReady = (Object.keys(bundle.state.figureUpdateTimes).indexOf(figure) !== -1 && bundle.state.figureUpdateTimes[figure] !== 'failed')

  var width = "100%"
  var margin = "0px"
  // var height = "auto";
  if (FigurePanelOnly) {
    width = "250px"
    margin = "10px"
    // height = "350px"
  }

  return (
    <div className="phoebe-parameter" style={{marginLeft: margin, marginRight: margin, width: width, float: "left"}}>
      <DragHandle />
      {figure}
      <div className="ReactFigureActions">
        {FigurePanelOnly ?
          null
          :
          <FigureEditButton app={app} bundle={bundle} figure={figure}/>
        }
        {figureReady ?
          <React.Fragment>
            <FigureMPLButton app={app} bundle={bundle} figure={figure}/>
            {FigurePanelOnly ?
              null
              :
              <FigureExpandButton app={app} bundle={bundle} figure={figure} />
            }
            {/*<FigurePopoutButton app={app} bundle={bundle} figure={figure} /> */}
          </React.Fragment>
          :
          <div style={{border: "1px dotted black", borderRadius: "6px", height: "80px", marginTop: "6px", marginBottom: "6px"}}>
            <span style={{textAlign: "center", display: "inline-block", width: "100%", marginTop: "25px"}}>nothing to show</span>
          </div>
        }

      </div>
      <div className="ReactFigureImage">
        {figureReady ?
          <FigureThumb app={app} bundle={bundle} figure={figure} FigurePanelOnly={FigurePanelOnly} />
          :
          null
        }
        <div className="ReactFigureActionsBottom">
          {figureReady ?
            <FigureSaveButton app={app} bundle={bundle} figure={figure} />
            :
            <span style={{height: "14px", display: "inline-block"}}/>
          }
        </div>
      </div>

    </div>
  );
});

const SortableFigureList = SortableContainer(({figures, app, bundle, FigurePanelOnly}) => {
  return (
    <ul style={{padding: "0px"}}>
      {figures.map((figure, index) => (
        <SortableFigureItem key={`item-${index}`} index={index} figure={figure} app={app} bundle={bundle} FigurePanelOnly={FigurePanelOnly}/>
      ))}
    </ul>
  );
});



export class FigureThumb extends React.Component {
  constructor(props) {
    super(props);
    this.state = {

    };

    // bind callbacks
    this.onClick = this.onClick.bind(this);
  }
  onClick() {
    // for now we'll do the same thing as expanding the figure
    // in the future we may set the times across all figures
    // this.props.app.setState({activeView: 'Figure', activeFigure: this.props.figure});
  }
  render() {
    // randomstr at end of URL forces the browser to reload the image instead of relying on cached version
    var url = 'http://'+this.props.app.state.serverHost+'/'+this.props.bundle.state.bundleid+'/figure/'+this.props.figure+'?'+this.props.bundle.state.figureUpdateTimes[this.props.figure]
    return (
      <div className="ReactFigureThumb">
        <img width="100%" src={url} onClick={this.onClick}></img>
      </div>
    );
  }
}

class FigureEditButton extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      redirect: null
    };
  }

  onClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // if changing the syntax here, will also need to update the logic in panel-action.jsx for finding the figure name
    this.props.bundle.setQueryParams({tmp: '"context:figure,figure:null|'+this.props.figure+'"'})
    this.setState({redirect: generatePath(this.props.app.state.serverHost, this.props.bundle.state.bundleid, "edit_figure", this.props.bundle.getSearchString())});

  }
  componentDidUpdate() {
    if (this.state.redirect) {
      this.setState({redirect: null})
    }
  }
  render() {
    if (this.state.redirect) {
      return (<Redirect to={this.state.redirect}/>)
    }
    return (
      <span style={{width: "24px"}} className="btn btn-tag btn-tag-clear" onClick={this.onClick} title='edit figure parameters'><span className='fas fa-fw fa-pen'></span></span>
    );
  }
}

class EditFigureTimeSourceButton extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      redirect: null
    };
  }

  onClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // if changing the syntax here, will also need to update the logic in panel-action.jsx for finding the figure name
    this.props.bundle.setQueryParams({tmp: '"qualifier:default_time_source|default_time|time_source|time,context:figure"'})
    this.setState({redirect: generatePath(this.props.app.state.serverHost, this.props.bundle.state.bundleid, "edit_figure_times", this.props.bundle.getSearchString())});

  }
  componentDidUpdate() {
    if (this.state.redirect) {
      this.setState({redirect: null})
    }
  }
  render() {
    if (this.state.redirect) {
      return (<Redirect to={this.state.redirect}/>)
    }
    return (
      <span style={{maxWidth: "100%"}} className="btn btn-tag btn-tag-clear" onClick={this.onClick}><span className='fas fa-fw fa-clock'></span> edit times</span>
    );
  }
}

class FigureMPLButton extends React.Component {
  constructor(props) {
    super(props);
    this.state = {

    };
  }
  onClick = () => {
    var url = 'http://'+this.props.app.state.serverHost+'/'+this.props.bundle.state.bundleid+'/figure_afig/'+this.props.figure

    console.log("FigureMPLButton.onClick")
    if (this.props.app.state.isElectron) {
      var autofigCmd = window.require('electron').remote.getGlobal('testAutofigInstalled')()
      if (autofigCmd !== null) {
        window.require('electron').remote.getGlobal('launchCommand')(autofigCmd+' '+url);
      } else {
        alert("Install PHOEBE or autofig locally in order to launch interactive figures.")
      }
    } else {
      prompt("Install the dedicated desktop application to automatically launch an interactive matplotlib window.  If you have PHOEBE installed, paste the following into a terminal (if you have autofig installed but not PHOEBE, replace 'phoebe-autofig' with 'autofig'): ", 'phoebe-autofig '+url);
    }
    // var spawn = require('child_process').spawn('mplshow', [url]);
    // spawn.on('error', function(err) {
      // alert('mplshow failed to launch');
    // });
  }
  render() {
    return (
      <span style={{width: "24px"}} className="btn btn-tag btn-tag-clear" onClick={this.onClick} title='open interactive figure'><span className='fas fa-fw fa-chart-line'></span></span>
    );
  }
}

class FigureExpandButton extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      redirect: null
    };
  }
  onClick = (e) => {
    // var url = 'http://'+this.props.app.state.serverHost+'/'+this.props.bundle.state.bundleid+'/figure/'+this.props.figure+'?'+this.props.bundle.state.figureUpdateTimes[this.props.figure]
    // var win = popUpWindow(url, window.location.search);
    // // TODO: callback to remove from childrenWindows when manually closed?
    // this.props.bundle.childrenWindows.push(win);


    e.preventDefault();
    e.stopPropagation();
    // if changing the syntax here, will also need to update the logic in panel-action.jsx for finding the figure name
    this.props.bundle.setQueryParams({tmp: '"context:figure,figure:null|'+this.props.figure+'"'})
    this.setState({redirect: generatePath(this.props.app.state.serverHost, this.props.bundle.state.bundleid, "view_figure", this.props.bundle.getSearchString())});

  }
  componentDidUpdate() {
    if (this.state.redirect) {
      this.setState({redirect: null})
    }
  }
  render() {
    if (this.state.redirect) {
      return (<Redirect to={this.state.redirect}/>)
    }
    return (
      <span style={{width: "24px"}} className="btn btn-tag btn-tag-clear" onClick={this.onClick} title='view image in middle panel'><span className='fas fa-fw fa-expand'></span></span>
    );
  }
}

class FigurePopoutButton extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
    };
  }
  onClick = (e) => {
    var url = 'http://'+this.props.app.state.serverHost+'/'+this.props.bundle.state.bundleid+'/figure/'+this.props.figure+'?'+this.props.bundle.state.figureUpdateTimes[this.props.figure]
    var win = popUpWindow(url, window.location.search);
    // TODO: callback to remove from childrenWindows when manually closed?
    this.props.bundle.childrenWindows.push(win);
  }
  render() {
    return (
      <span style={{width: "24px"}} className="btn btn-tag btn-tag-clear" onClick={this.onClick} title='open figure image in new window'><span className='fas fa-fw fa-external-link-alt'></span></span>
    );
  }
}

class FigureSaveButton extends React.Component {
  constructor(props) {
    super(props);
    this.state = {

    };
  }
  onClick = () => {
    // console.log("FigureSaveButton clicked");
    alert("saving figures coming soon");
    var url = 'http://'+this.props.app.state.serverHost+'/'+this.props.bundle.state.bundleid+'/figure/'+this.props.figure+'?'+this.props.bundle.state.figureUpdateTimes[this.props.figure]
    // var win = popUpWindow(url, window.location.search);
  }
  render() {
    return (
      <span style={{width: "24px"}} className="btn btn-tag btn-tag-clear" onClick={this.onClick} title='save figure image'><span className='fas fa-fw fa-save'></span></span>
    );
  }
}



export class FigurePanelWidth extends React.Component {
  constructor(props) {
    super(props);
    this.state = {

    };
  }
  render() {
    var app = this.props.app;

    var figureReady = (this.props.figure && Object.keys(this.props.bundle.state.figureUpdateTimes).indexOf(this.props.figure) !== -1 && this.props.bundle.state.figureUpdateTimes[this.props.figure] !== 'failed')

    if (!figureReady) {
      return(
        <div style={{border: "1px dotted black", borderRadius: "6px", height: "150px"}}>
          <span style={{textAlign: "center", display: "inline-block", width: "100%", marginTop: "60px"}}>nothing to show yet, try adding observations to the dataset or running a forward model</span>
        </div>
      )
    }


    var url = 'http://'+this.props.app.state.serverHost+'/'+this.props.bundle.state.bundleid+'/figure/'+this.props.figure+'?'+this.props.bundle.state.figureUpdateTimes[this.props.figure]


    return (
      <img style={{display: "block", marginLeft: "auto", marginRight: "auto", maxWidth: "600px"}} src={url}></img>
    );
  }

}


export class FigureFullScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {

    };
  }
  render() {
    var app = this.props.app;

    if (this.props.figure==null) {
      return null;
    }

    var url = 'http://'+this.props.app.state.serverHost+'/'+this.props.bundle.state.bundleid+'/figure/'+this.props.figure+'?'+this.props.bundle.state.figureUpdateTimes[this.props.figure]


    return (
      <div className="ReactFigureFullScreen" style={this.props.visible ? {} : { display: 'none' }}>
        <h2>{this.props.figure}</h2>
        <img minWidth="200px" src={url}></img>
      </div>
    );
  }

}
