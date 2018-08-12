import React, { Component } from "react";
import PropTypes from "prop-types";

import WODLog from "../WODLog";

import "./style.css";

class WODLogs extends Component {
  render() {
    const { wods } = this.props;
    return (
      <div className="WODLogs m-t-md text-left">
        {wods.map((wod, key) => (
          <WODLog key={key} wod={wod} />
        ))}
      </div>
    );
  }
}

WODLogs.propTypes = {
  wods: PropTypes.array.isRequired
};

WODLogs.defaultProps = {};

export default WODLogs;
