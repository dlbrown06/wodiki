import React, { Component } from "react";
import PropTypes from "prop-types";
import {
  Row,
  Col,
  Form,
  FormGroup,
  Label,
  Input,
  Button,
  Alert
} from "reactstrap";
import _ from "lodash";
import moment from "moment";

class FormAddStrength extends Component {
  constructor() {
    super();

    this.defaultState = {
      strengthDate: moment().format("YYYY-MM-DD"),
      name: "",
      movement: { id: "", measurements: [] },
      sets: []
    };

    this.state = _.cloneDeep(this.defaultState);
  }

  onInputChange = (name, value) => {
    const state = this.state;
    state[name] = value;
    this.setState(state);
  };

  onMovementChange = value => {
    const { availableMovements } = this.props;
    const movement = availableMovements.find(item => item.id === value);
    this.setState({ movement }, () => this.addSet());
  };

  onMeasurementChange = (setKey, measurement_id, result, unit_id) => {
    const { sets } = this.state;

    const existingSet = sets[setKey];
    if (existingSet) {
      let found = existingSet.measurements.find(
        m => m.measurement_id === measurement_id
      );
      if (found) {
        if (result !== null) {
          found.result = result;
        }
        if (unit_id !== null) {
          found.unit_id = unit_id;
        }
      } else {
        existingSet.measurements.push({ measurement_id, result, unit_id });
      }
    } else {
      sets[setKey] = {
        set_number: setKey + 1,
        measurements: [{ measurement_id, result, unit_id }]
      };
    }

    this.setState({ sets });
  };

  addSet = () => {
    const { sets, movement } = this.state;
    sets.push({
      set_number: sets.length + 1,
      measurements: movement.measurements.map(m => ({
        measurement_id: m.id,
        result: null,
        unit_id: m.units.length === 1 ? m.units[0].id : null
      }))
    });
    this.setState({ sets });
  };

  removeSet = () => {
    const { sets } = this.state;
    if (sets.length > 1) {
      sets.pop();
      this.setState({ sets });
    }
  };

  onSubmit = async () => {
    const { onSubmit } = this.props;
    const { state } = this;

    state.movement_id = state.movement.id;
    const result = await onSubmit(state);
    if (result) {
      const state = _.cloneDeep(this.defaultState);
      this.setState(state);
    }
  };

  disableSubmit = () => {
    const { disable } = this.props;
    const { sets, movement } = this.state;

    if (disable) return true;

    if (!movement.id || movement.id === "") return true;

    // ensure all set data is completed
    const incompleteSet = sets.find(set => {
      if (!set.measurements.length) return true;

      const measurements = set.measurements.filter(
        m => !m.measurement_id || !m.result || !m.unit_id
      );
      return measurements.length > 0;
    });
    return incompleteSet !== undefined;
  };

  render() {
    const { error, disable, availableMovements } = this.props;
    const { name, sets, movement, strengthDate } = this.state;

    return (
      <Form className="FormAddStrength">
        <FormGroup>
          <Label for="strengthDate">Date</Label>
          <Input
            type="date"
            value={strengthDate}
            onChange={e => this.onInputChange("strengthDate", e.target.value)}
            disabled={disable}
          />
        </FormGroup>

        <FormGroup>
          <Label for="wodName">Strength Name</Label>
          <Input
            type="text"
            name="strengthName"
            placeholder="Enter Strength Name"
            value={name}
            onChange={e => this.onInputChange("name", e.target.value)}
            disabled={disable}
          />
        </FormGroup>

        <FormGroup>
          <Label for="movement">Strength Movement</Label>
          <Input
            type="select"
            name="movement"
            onChange={e => this.onMovementChange(e.target.value)}
            disabled={disable}
            value={movement.id}
          >
            <option disabled value={""}>
              Select Movement
            </option>
            {availableMovements.map((option, optKey) => (
              <option value={option.id} key={optKey}>
                {option.name}
              </option>
            ))}
          </Input>
        </FormGroup>

        {movement.id !== "" && (
          <Row>
            <Col xs={4}>
              <Button
                block
                disabled={disable || movement.id === ""}
                onClick={() => this.addSet()}
              >
                +
              </Button>
            </Col>
            <Col xs={4} className="text-center">
              <h3>{sets.length} Sets</h3>
            </Col>
            <Col xs={4}>
              <Button
                block
                disabled={disable || movement.id === "" || sets.length < 2}
                onClick={() => this.removeSet()}
              >
                -
              </Button>
            </Col>
          </Row>
        )}

        {movement.id !== "" &&
          sets.length > 0 && (
            <div>
              <hr />
              {sets.map((set, setKey) => (
                <div key={setKey}>
                  <Row>
                    <Col xs={1}>{setKey + 1}.</Col>
                    <Col xs={10}>
                      {movement.measurements.map((measurement, typeKey) => (
                        <Row key={typeKey}>
                          <Col xs={8}>
                            <FormGroup>
                              <Label hidden>
                                {_.startCase(measurement.name.toLowerCase())}
                              </Label>
                              <Input
                                type="number"
                                placeholder={`${_.startCase(
                                  measurement.name.toLowerCase()
                                )}`}
                                bsSize="sm"
                                onChange={e => {
                                  this.onMeasurementChange(
                                    setKey,
                                    measurement.id,
                                    e.target.value,
                                    measurement.units.length === 1
                                      ? _.first(measurement.units).id
                                      : null
                                  );
                                }}
                                disabled={disable || movement.id.length === 0}
                              />
                            </FormGroup>
                          </Col>
                          <Col xs={4}>
                            <FormGroup>
                              <Input
                                type="select"
                                name="units"
                                onChange={e => {
                                  this.onMeasurementChange(
                                    setKey,
                                    measurement.id,
                                    null,
                                    e.target.value
                                  );
                                }}
                                disabled={
                                  disable || measurement.units.length === 1
                                }
                                bsSize="sm"
                              >
                                {measurement.units.length > 1 && (
                                  <option value={""}>Unit</option>
                                )}
                                {measurement.units.map((option, optKey) => (
                                  <option value={option.id} key={optKey}>
                                    {option.abbr}
                                  </option>
                                ))}
                              </Input>
                            </FormGroup>
                          </Col>
                        </Row>
                      ))}
                    </Col>
                  </Row>
                </div>
              ))}
            </div>
          )}

        <Col xs={12}>
          <hr />
          {error && <Alert color="danger">{error}</Alert>}
          <Row>
            <Col xs={6} />
            <Col xs={6}>
              <Button
                block
                color="primary"
                disabled={this.disableSubmit()}
                onClick={() => this.onSubmit()}
              >
                Save Strength
              </Button>
            </Col>
          </Row>
        </Col>
      </Form>
    );
  }
}

FormAddStrength.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  availableMovements: PropTypes.array.isRequired,
  error: PropTypes.string,
  disable: PropTypes.bool
};

FormAddStrength.defaultProps = {
  error: undefined,
  disable: false
};

export default FormAddStrength;
