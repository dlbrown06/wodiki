import React, { Component } from "react";
import PropTypes from "prop-types";
import _ from "lodash";

import "./style.css";

class WOD extends Component {
  render() {
    const { wod } = this.props;

    return (
      <div className="workout">
        <div>Name: {wod.name}</div>
        <div>
          Type: {wod.type.abbr} - {wod.type.name}
        </div>
        <div>As Prescribed: {wod.as_prescribed ? "true" : "false"}</div>
        <div>Personal Record: {wod.is_record ? "true" : "false"}</div>
        {wod.movements.map((m, key) => (
          <div key={key}>
            <div>
              Movement {key + 1}: {m.name} - {m.result}{" "}
              {m.measurement.unit.abbr}
            </div>
          </div>
        ))}
      </div>
    );
  }
}

class Strength extends Component {
  render() {
    const { strength } = this.props;

    return (
      <div className="workout">
        <div>Name: {strength.name}</div>
        <div>Movement: {strength.movement.name}</div>
        {strength.sets.map((s, key) => (
          <div key="key">
            Set {key + 1} Results
            {s.results.map((r, rKey) => (
              <div key={rKey} className="set-results text-muted">
                {_.startCase(r.measurement.name)}: {r.result}{" "}
                {r.measurement.unit.abbr}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }
}

class Workouts extends Component {
  render() {
    const { wods, strength } = this.props;
    return (
      <div className="Workouts">
        <div>
          <div className="header">WODs</div>
          <div>
            {wods.length === 0 && (
              <div className="text-muted text-center">No Data</div>
            )}
            {wods.map((w, key) => (
              <WOD key={key} wod={w} />
            ))}
          </div>
        </div>
        <div className="mt-md-2">
          <div className="header">Strength</div>
          <div>
            {strength.length === 0 && (
              <div className="text-muted text-center">No Data</div>
            )}
            {strength.map((s, key) => (
              <Strength key={key} strength={s} />
            ))}
          </div>
        </div>
      </div>
    );
  }
}

Workouts.propTypes = {
  wods: PropTypes.array.isRequired,
  strength: PropTypes.array.isRequired
};

Workouts.defaultProps = {};

export default Workouts;
