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
import moment from "moment/moment";

class FormAddWOD extends Component {
  constructor() {
    super();

    this.state = {
      wod_date: moment().format("YYYY-MM-DD"),
      name: "",
      wod_type: {},
      as_prescribed: false,
      is_record: false,
      movements: [],
      results: []
    };
  }

  onInputChange = (name, value) => {
    const state = this.state;
    state[name] = value;
    this.setState(state);
  };

  onWODTypeChange = wodTypeId => {
    const { wodTypes } = this.props;
    const wod_type = wodTypes.find(wt => wt.id === wodTypeId);
    this.setState(
      {
        movements: [],
        results: wod_type
          ? wod_type.measurements.map(m => ({
              measurement_id: m.wod_type_measurement_id,
              result: "",
              unit_id: m.units.length === 1 ? m.units[0].id : ""
            }))
          : []
      },
      () => this.setState({ wod_type }, () => this.addMovement())
    );
  };

  onResultChange = (key, measurement_id, result, unit_id) => {
    const { results } = this.state;

    const existingResult = results[key];
    if (existingResult) {
      if (result !== null) {
        existingResult.result = result;
      }
      if (unit_id !== null) {
        existingResult.unit_id = unit_id;
      }
    } else {
      results[key] = { measurement_id, result, unit_id };
    }

    this.setState({ results });
  };

  onMovementChange = (key, value) => {
    const { movements } = this.state;
    const { availableMovements } = this.props;

    const foundMovement = availableMovements.find(item => item.id === value);
    movements[key] = _.cloneDeep(foundMovement);

    // set the unit id of measurements if it is the only one
    movements[key].measurements.forEach(mm => {
      mm.result = "";
      mm.unit_id = mm.units.length === 1 ? mm.units[0].id : "";
    });

    this.setState({ movements });
  };

  addMovement = () => {
    const { movements } = this.state;
    movements.push({});
    this.setState({ movements });
  };

  removeMovement = () => {
    const { movements } = this.state;
    if (movements.length > 1) {
      movements.pop();
      this.setState({ movements });
    }
  };

  onSubmit = async () => {
    const { onSubmit } = this.props;
    const { state } = this;

    const result = await onSubmit(state);
    if (result) {
      this.setState({
        wod_date: moment().format("YYYY-MM-DD"),
        name: "",
        wod_type: {},
        as_prescribed: false,
        is_record: false,
        movements: [],
        results: []
      });
    }
  };

  disableSubmit = () => {
    const { disable, wod_type, movements, results } = this.state;

    if (disable) return true;

    if (!wod_type.id) return true;

    if (wod_type.measurements.length !== results.length) return true;

    // check incomplete wod results
    const incompleteResults = results.find(
      r => !r.measurement_id || !r.result || !r.unit_id
    );
    if (incompleteResults !== undefined) return true;

    // check incomplete movements
    const incompleteMovement = movements.find(m => {
      if (_.isEmpty(m)) return true;
      const incompleteMeasurement = m.measurements.find(mm => {
        return !mm.unit_id || !mm.result;
      });
    });
    if (incompleteMovement) return true;

    return false;
  };

  render() {
    const { error, disable, availableMovements, wodTypes } = this.props;
    const {
      wod_date,
      name,
      wod_type,
      movements,
      results,
      is_record,
      as_prescribed
    } = this.state;

    return (
      <Form className="FormAddWOD">
        <FormGroup>
          <Label>Date</Label>
          <Input
            type="date"
            value={wod_date}
            onChange={e => this.onInputChange("wod_date", e.target.value)}
            disabled={disable}
          />
        </FormGroup>
        <FormGroup>
          <Label for="wodName">WOD Name</Label>
          <Input
            type="text"
            name="wodName"
            placeholder="Enter WOD Name"
            value={name}
            onChange={e => this.onInputChange("name", e.target.value)}
            disabled={disable}
          />
        </FormGroup>
        <FormGroup>
          <Row>
            <Col xs={6}>
              <Button
                block
                onClick={() => this.setState({ is_record: !is_record })}
                color={is_record ? "info" : "default"}
              >
                PR
              </Button>
            </Col>
            <Col xs={6}>
              <Button
                block
                onClick={() => this.setState({ as_prescribed: !as_prescribed })}
                color={as_prescribed ? "info" : "default"}
              >
                RX
              </Button>
            </Col>
          </Row>
        </FormGroup>
        <FormGroup>
          <Label for="scoreType">
            WOD Type <span className="text-danger">*</span>
          </Label>
          <Input
            type="select"
            onChange={e => this.onWODTypeChange(e.target.value)}
            disabled={disable}
          >
            <option value={""}>Select WOD Type</option>
            {wodTypes.map((wt, key) => (
              <option key={key} value={wt.id}>
                {wt.abbr}
              </option>
            ))}
          </Input>
        </FormGroup>

        {/*WOD Results*/}
        {wod_type.id && (
          <div>
            {wod_type.measurements.map((wtm, wtKey) => (
              <Row key={wtKey}>
                <Col xs={8}>
                  <FormGroup>
                    <Label hidden>{_.startCase(wtm.name.toLowerCase())}</Label>
                    <Input
                      type="number"
                      placeholder={`${_.startCase(wtm.name.toLowerCase())}`}
                      bsSize="sm"
                      value={results[wtKey] ? results[wtKey].result : ""}
                      onChange={e => {
                        this.onResultChange(
                          wtKey,
                          wtm.id,
                          e.target.value,
                          wtm.units.length === 1 ? _.first(wtm.units).id : null
                        );
                      }}
                      disabled={disable}
                    />
                  </FormGroup>
                </Col>
                <Col xs={4}>
                  <FormGroup>
                    <Label hidden>Units</Label>
                    <Input
                      type="select"
                      name="units"
                      value={results[wtKey] ? results[wtKey].unit_id : ""}
                      onChange={e => {
                        this.onResultChange(
                          wtKey,
                          wtm.id,
                          null,
                          e.target.value
                        );
                      }}
                      disabled={disable || wtm.units.length === 1}
                      bsSize="sm"
                    >
                      {wtm.units.length > 1 && <option value={""}>Unit</option>}
                      {wtm.units.map((option, optKey) => (
                        <option value={option.id} key={optKey}>
                          {option.abbr}
                        </option>
                      ))}
                    </Input>
                  </FormGroup>
                </Col>
              </Row>
            ))}
          </div>
        )}

        {/*Movement Count Changer*/}
        {wod_type.id && (
          <div>
            <hr />
            <Row>
              <Col xs={4}>
                <Button
                  block
                  disabled={disable}
                  onClick={() => this.addMovement()}
                >
                  +
                </Button>
              </Col>
              <Col xs={4} className="text-center">
                <strong>
                  {movements.length} Movement
                  {movements.length > 1 ? "s" : ""}
                </strong>
              </Col>
              <Col xs={4}>
                <Button
                  block
                  disabled={disable}
                  onClick={() => this.removeMovement()}
                >
                  -
                </Button>
              </Col>
            </Row>
          </div>
        )}

        {/*Movement Selections*/}
        {movements.length > 0 && (
          <div>
            <hr />
            {movements.map((m, mKey) => (
              <Row key={mKey}>
                <Col xs={1}>{mKey + 1}.</Col>
                <Col xs={10}>
                  <FormGroup>
                    <Input
                      type="select"
                      name="movement"
                      onChange={e =>
                        this.onMovementChange(mKey, e.target.value)
                      }
                      disabled={disable}
                      bsSize="sm"
                    >
                      <option value={""}>Select Movement</option>
                      {availableMovements.map((option, optKey) => (
                        <option value={option.id} key={optKey}>
                          {option.name}
                        </option>
                      ))}
                    </Input>
                  </FormGroup>

                  {m.measurements &&
                    m.measurements.map((mm, mmKey) => (
                      <Row key={mmKey}>
                        <Col xs={8}>
                          <FormGroup>
                            <Label hidden>
                              {_.startCase(mm.name.toLowerCase())}
                            </Label>
                            <Input
                              type="number"
                              placeholder={`Enter ${_.startCase(
                                mm.name.toLowerCase()
                              )}`}
                              bsSize="sm"
                              value={mm.result ? mm.result : ""}
                              onChange={e => {
                                mm.result = e.target.value;
                                this.setState({ movements });
                              }}
                              disabled={disable}
                            />
                          </FormGroup>
                        </Col>
                        <Col xs={4}>
                          <FormGroup>
                            <Input
                              type="select"
                              onChange={e => {
                                mm.unit_id = e.target.value;
                                this.setState({ movements });
                              }}
                              disabled={disable || mm.units.length === 1}
                              bsSize="sm"
                            >
                              {mm.units.length > 1 && (
                                <option value={""}>Unit</option>
                              )}
                              {mm.units.map((option, optKey) => (
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
                Save WOD
              </Button>
            </Col>
          </Row>
        </Col>
      </Form>
    );
  }
}

FormAddWOD.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  availableMovements: PropTypes.array.isRequired,
  wodTypes: PropTypes.array.isRequired,
  error: PropTypes.string,
  disable: PropTypes.bool
};

FormAddWOD.defaultProps = {
  error: undefined,
  disable: false
};

export default FormAddWOD;
