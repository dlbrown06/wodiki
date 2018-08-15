import React, { Component } from "react";
import PropTypes from "prop-types";

import StrengthLog from "../StrengthLog";

class StrengthLogs extends Component {
  render() {
    const { strength } = this.props;
    return (
      <div className="StrengthLogs m-t-md text-left">
        {strength.map((item, key) => (
          <StrengthLog key={key} strength={item} />
        ))}
      </div>
    );
  }
}

StrengthLogs.propTypes = {
  strength: PropTypes.array.isRequired
};

StrengthLogs.defaultProps = {};

export default StrengthLogs;
