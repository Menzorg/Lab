import lodash from 'lodash';

import React from 'react';

class Recursion extends React.Component {
  getChildContext() {
    var __recursion;
    if (this.context.__recursion) {
      __recursion = lodash.cloneDeep(this.context.__recursion);
    } else {
      __recursion = [];
    }
    __recursion.push(this.props.document.ref());
    return {
      __recursion: __recursion
    };
  }
  render() {
    return <span>{this.props.children}</span>;
  }
}

Recursion.contextTypes = {
  __recursion: React.PropTypes.array
};

Recursion.childContextTypes = {
  __recursion: React.PropTypes.array
};

export default Recursion;