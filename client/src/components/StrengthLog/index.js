import React, { Component } from "react";
import PropTypes from "prop-types";
import moment from "moment";

import "./style.css";

class StrengthLog extends Component {
  render() {
    const { strength } = this.props;

    return (
      <div className="StrengthLog">
        <h2>
          {moment(strength.created_on).format("ddd, M/DD")}
          {strength.name.length > 0 && ` - ${strength.name}`}
          <span className="pull-right text-muted">
            {strength.movement_name}
          </span>
        </h2>
      </div>
    );
  }
}

StrengthLog.propTypes = {
  wod: PropTypes.object.isRequired
};

StrengthLog.defaultProps = {};

export default StrengthLog;
