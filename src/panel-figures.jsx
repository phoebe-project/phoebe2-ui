import React, { Component } from 'react';
import {Redirect} from 'react-router-dom';

import {SortableContainer, SortableElement, SortableHandle, arrayMove} from 'react-sortable-hoc'; // https://github.com/clauderic/react-sortable-hoc


import {Link, generatePath, randomstr} from './common';
import {Tour} from './tour';
import {Panel} from './ui';

const DragHandle = SortableHandle(() => <span className='fas fa-grip-lines' style={{paddingRight: "10px"}}/>); // This can be any component you want

export class FigurePanel extends Component {

  render() {

    return (
      <Panel inactive={this.props.inactive}>
        <Tour app={this.props.app} bundle={this.props.bundle} bundleid={this.props.bundleid}/>

        <div style={{padding: "0px"}}>
          <SortableFigureList figures={this.props.bundle.state.figures} app={this.props.app} bundle={this.props.bundle} onSortEnd={this.props.bundle.onFigureSortEnd} useDragHandle={true} />
          {/* <TagSectionActionButton app={this.props.app} type='add' sectionLabel='Figure' label=' Add New Figure' tagLabelsList={[]}/> */}
        </div>

      </Panel>
    )
  }
}


const SortableFigureItem = SortableElement(({figure, app, bundle}) => {
  return (
    <div className="phoebe-parameter" style={{marginLeft: "0px", marginRight: "0px", width: "100%"}}>
      <DragHandle />
      {figure}
      <div className="ReactFigureActions">
        <FigureEditButton app={app} bundle={bundle} figure={figure}/>
        <FigureMPLButton app={app} bundle={bundle} figure={figure}/>
        <FigureExpandButton app={app} bundle={bundle} figure={figure} />
      </div>
      <div className="ReactFigureImage">
        <FigureThumb app={app} bundle={bundle} figure={figure} />
        <div className="ReactFigureActionsBottom">
          <FigureSaveButton app={app} bundle={bundle} figure={figure} />
        </div>
      </div>

    </div>
  );
});

const SortableFigureList = SortableContainer(({figures, app, bundle}) => {
  return (
    <ul style={{padding: '0px'}}>
      {figures.map((figure, index) => (
        <SortableFigureItem key={`item-${index}`} index={index} figure={figure} app={app} bundle={bundle} />
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
    // var app = this.props.app;
    // var url = 'http://'+app.getSocketURI('/'+app.state.bundleid+'/figure/'+this.props.figure+'?'+randomstr(10));
    var url = 'undefined url'
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
      <span style={{width: "24px"}} className="btn btn-tag btn-tag-clear" onClick={this.onClick}><span className='fas fa-fw fa-pen'></span></span>
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
    // console.log("FigureMPLButton clicked");

    // var app = this.props.app;
    // var url = 'http://'+app.getSocketURI('/'+app.state.bundleid+'/figure_mpl/'+this.props.figure+'?'+randomstr(10));

    alert("autofig show not yet implemented")

    // var spawn = require('child_process').spawn('mplshow', [url]);
    // spawn.on('error', function(err) {
      // alert('mplshow failed to launch');
    // });
  }
  render() {
    return (
      <span style={{width: "24px"}} className="btn btn-tag btn-tag-clear" onClick={this.onClick}><span className='fas fa-fw fa-chart-line'></span></span>
    );
  }
}

class FigureExpandButton extends React.Component {
  constructor(props) {
    super(props);
    this.state = {

    };
  }
  onClick = () => {
    alert("expanding figures coming soon");
    // this.props.app.setState({activeView: 'Figure', activeFigure: this.props.figure});
  }
  render() {
    return (
      <span style={{width: "24px"}} className="btn btn-tag btn-tag-clear" onClick={this.onClick}><span className='fas fa-fw fa-expand'></span></span>
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
  }
  render() {
    return (
      <span style={{width: "24px"}} className="btn btn-tag btn-tag-clear" onClick={this.onClick}><span className='fas fa-fw fa-save'></span></span>
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

    if (this.props.figure==null) {
      return null;
    }

    // var url = 'http://'+app.getSocketURI('/'+app.state.bundleid+'/figure/'+this.props.figure+'?'+randomstr(10));
    var url = 'undefined url for '+this.props.figure


    return (
      <img style={{width: "80%"}} src={url}></img>
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

    // var url = 'http://'+app.getSocketURI('/'+app.state.bundleid+'/figure/'+this.props.figure+'?'+randomstr(10));
    var url = 'undefined url for '+this.props.figure


    return (
      <div className="ReactFigureFullScreen" style={this.props.visible ? {} : { display: 'none' }}>
        <h2>{this.props.figure}</h2>
        <img minWidth="200px" src={url}></img>
      </div>
    );
  }

}
