import React, { Component } from "react";
import PropTypes from "prop-types";
import moment from "moment";

import "./style.css";

class WODLog extends Component {
  render() {
    const { wod } = this.props;

    return (
      <div className="WODLog">
        <h4>
          {moment(wod.created_on).format("ddd MM/DD")}
          {wod.name.length > 0 && ` - ${wod.name}`}
        </h4>
      </div>
    );
  }
}

WODLog.propTypes = {
  wod: PropTypes.object.isRequired
};

WODLog.defaultProps = {};

export default WODLog;
