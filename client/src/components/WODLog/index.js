import React, { Component } from "react";
import PropTypes from "prop-types";
import moment from "moment";

import "./style.css";

class WODLog extends Component {
  render() {
    const { wod } = this.props;

    return (
      <div className="WODLog">
        <h2>
          {moment(wod.wod_date || wod.created_on).format("ddd, M/DD")}
          {wod.name.length > 0 && ` - ${wod.name}`}
          <span className="pull-right text-muted">{wod.type}</span>
        </h2>
      </div>
    );
  }
}

WODLog.propTypes = {
  wod: PropTypes.object.isRequired
};

WODLog.defaultProps = {};

export default WODLog;
