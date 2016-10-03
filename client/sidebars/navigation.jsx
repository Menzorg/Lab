import React from 'react';

import Sidebar from 'react-sidebar';
import colors from 'material-ui/styles/colors';
import AppBar from 'material-ui/AppBar';
import IconButton from 'material-ui/IconButton';

import Layers from 'material-ui/svg-icons/maps/layers';
import LayersClear from 'material-ui/svg-icons/maps/layers-clear';
import ArrowBack from 'material-ui/svg-icons/navigation/arrow-back';

export default class extends React.Component {
  constructor() {
    super();
    
    this.state = {
      open: false,
      layers: false
    };
  }

  toggleOpen() {
    this.setState({
      open: !this.state.open
    });
  }

  toggleLayers() {
    this.setState({
      layers: !this.state.layers
    });
  }
  
  handleOuterClick() {
    if (this.state.open && this.state.layers) {
      this.setState({ open: false });
    }
  }
  
  render() {
    var LayersTag = this.state.layers?LayersClear:Layers;
    
    return (
      <Sidebar
        open={this.state.layers?this.state.open:false}
        sidebar={
          <div style={{
            width: 300,
            height: '100%',
            backgroundColor: colors.white
          }}>
            <AppBar
              style={{ backgroundColor: colors.white }}
              iconElementRight={
                <IconButton
                  onTouchTap={() => {
                    this.toggleLayers();
                  }}
                >
                  <LayersTag color={colors.black}/>
                </IconButton>
              }
              iconElementLeft={
                <IconButton
                  onTouchTap={() => {
                    this.toggleOpen();
                  }}
                >
                  <ArrowBack color={colors.black}/>
                </IconButton>
              }
            />
          </div>
        }
        docked={this.state.layers?false:this.state.open}
        onSetOpen={(open) => this.setState({ open: open }) }
        styles={{
          sidebar: {
            zIndex: 1200
          }
        }}
      >
        <span>
          {this.props.children}
        </span>
      </Sidebar>
    );
  }
}