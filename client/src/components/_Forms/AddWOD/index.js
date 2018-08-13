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

import "./style.css";

class FormAddWOD extends Component {
  constructor() {
    super();

    this.defaultMovement = {
      id: "",
      name: "",
      types: [],
      reps: "",
      weight: "",
      distance: "",
      height: ""
    };

    this.defaultState = {
      name: "",
      type: "",
      timeCap: "",
      forRounds: "",
      movements: [_.cloneDeep(this.defaultMovement)],
      score: {
        time: "",
        rounds: "",
        reps: ""
      }
    };

    this.state = _.cloneDeep(this.defaultState);
  }

  onInputChange = (name, value) => {
    const state = this.state;
    state[name] = value;
    this.setState(state);
  };

  onMovementChange = (key, value) => {
    const { movements } = this.state;
    const { availableMovements } = this.props;

    movements[key] = availableMovements.find(item => item.id === value);
    this.setState({ movements });
  };

  onScoreChange = (name, value) => {
    const { score } = this.state;
    score[name] = value;
    this.setState({ score });
  };

  addMovement = () => {
    const { movements } = this.state;
    movements.push(this.defaultMovement);
    this.setState({ movements });
  };

  removeMovement = () => {
    const { movements } = this.state;
    movements.pop();
    this.setState({ movements });
  };

  onSubmit = async () => {
    const { onSubmit } = this.props;
    const { state } = this;

    const result = await onSubmit(state);
    if (result) {
      const state = _.cloneDeep(this.defaultState);
      this.setState(state);
    }
  };

  render() {
    const { error, disable, availableMovements } = this.props;
    const { name, type, forRounds, movements, score, timeCap } = this.state;

    return (
      <Form className="FormAddWOD">
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
          <Label for="scoreType">
            Score Type <span className="text-danger">*</span>
          </Label>
          <Input
            type="select"
            name="select"
            onChange={e => this.onInputChange("type", e.target.value)}
            disabled={disable}
            value={type}
            onKeyPress={e => e.key === "Enter" && this.onSubmit(name, type)}
          >
            <option disabled value={""}>
              Select Score Type
            </option>
            <option value="TIME">For Time</option>
            <option value="AMRAP">AMRAP</option>
          </Input>
        </FormGroup>

        {type === "TIME" && (
          <div>
            <FormGroup>
              <Label for="forRounds">
                Number of Rounds <span className="text-danger">*</span>
              </Label>
              <Input
                type="number"
                name="forRounds"
                placeholder="Number of Rounds"
                value={forRounds}
                onChange={e => this.onInputChange("forRounds", e.target.value)}
                disabled={disable}
              />
            </FormGroup>
            <FormGroup>
              <Label for="timeCap">Time Cap</Label>
              <Input
                type="numeric"
                name="timeCap"
                placeholder="Time Cap (min)"
                value={timeCap}
                onChange={e => this.onInputChange("timeCap", e.target.value)}
                disabled={disable}
              />
            </FormGroup>
          </div>
        )}

        {type === "AMRAP" && (
          <FormGroup>
            <Label for="timeCap">
              Time Limit (min) <span className="text-danger">*</span>
            </Label>
            <Input
              type="number"
              name="timeCap"
              placeholder="AMRAP Time (min)"
              value={timeCap}
              onChange={e => this.onInputChange("timeCap", e.target.value)}
              disabled={disable}
            />
          </FormGroup>
        )}

        {movements.length > 0 && (
          <div>
            <hr />
            {movements.map((movement, key) => (
              <div key={key}>
                <FormGroup>
                  <Label for="movement">Movement {key + 1}</Label>
                  <Input
                    type="select"
                    name="movement"
                    onChange={e => this.onMovementChange(key, e.target.value)}
                    disabled={disable}
                    value={movement.id}
                    bsSize="sm"
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

                <Row>
                  {movement.types.map((type, typeKey) => (
                    <Col xs={6}>
                      <FormGroup key={typeKey}>
                        <Label>{_.startCase(type.toLowerCase())}</Label>
                        <Input
                          type="number"
                          placeholder={`Enter ${_.startCase(
                            type.toLowerCase()
                          )}`}
                          value={movement[type.toLowerCase()]}
                          bsSize="sm"
                          onChange={e => {
                            movement[type.toLowerCase()] = e.target.value;
                            this.setState({ movements });
                          }}
                          disabled={disable || movement.id.length === 0}
                        />
                      </FormGroup>
                    </Col>
                  ))}
                </Row>
              </div>
            ))}
          </div>
        )}

        {type.length > 0 && <hr />}

        {type === "TIME" && (
          <FormGroup>
            <Label for="text">WOD Score - Total Time</Label>
            <Input
              type="text"
              name="time"
              placeholder="Total Time (mm:ss)"
              value={score.time}
              onChange={e => this.onScoreChange("time", e.target.value)}
              disabled={disable}
            />
          </FormGroup>
        )}

        {type === "AMRAP" && (
          <div>
            <FormGroup>
              <Label for="text">WOD Score - Total Rounds</Label>
              <Input
                type="text"
                name="rounds"
                placeholder="Total Rounds"
                value={score.rounds}
                onChange={e => this.onScoreChange("rounds", e.target.value)}
                disabled={disable}
              />
            </FormGroup>
            <FormGroup>
              <Label for="text">WOD Score - Additional Reps</Label>
              <Input
                type="text"
                name="reps"
                placeholder="Additional Reps"
                value={score.reps}
                onChange={e => this.onScoreChange("reps", e.target.value)}
                disabled={disable}
              />
            </FormGroup>
          </div>
        )}

        <Col xs={12}>
          <hr />
          {error && <Alert color="danger">{error}</Alert>}
          <Row>
            <Col xs={6}>
              <Row>
                <Col xs={6}>
                  <Button
                    block
                    disabled={disable}
                    onClick={() => this.addMovement()}
                  >
                    +
                  </Button>
                </Col>
                <Col xs={6}>
                  <Button
                    block
                    disabled={disable}
                    onClick={() => this.removeMovement()}
                  >
                    -
                  </Button>
                </Col>
              </Row>
            </Col>
            <Col xs={6}>
              <Button
                block
                color="primary"
                disabled={
                  disable || type.length === 0 || movements.length === 0
                }
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
  error: PropTypes.string,
  disable: PropTypes.bool
};

FormAddWOD.defaultProps = {
  error: undefined,
  disable: false
};

export default FormAddWOD;
