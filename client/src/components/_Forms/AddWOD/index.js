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
      type: "",
      reps: "",
      weight: ""
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
        <FormGroup row>
          <Label for="wodName" hidden>
            WOD Name
          </Label>
          <Col>
            <Input
              type="text"
              name="name"
              id="name"
              placeholder="WOD Name"
              value={name}
              onChange={e => this.onInputChange("name", e.target.value)}
              disabled={disable}
            />
          </Col>
        </FormGroup>
        <FormGroup>
          <Label for="scoreType" hidden>
            Score Type
          </Label>
          <Input
            type="select"
            name="select"
            id="scoreType"
            onChange={e => this.onInputChange("type", e.target.value)}
            disabled={disable}
            value={type}
            onKeyPress={e => e.key === "Enter" && this.onSubmit(name, type)}
          >
            <option disabled value={""}>
              Score Type
            </option>
            <option value="TIME">For Time</option>
            <option value="AMRAP">AMRAP</option>
          </Input>
        </FormGroup>

        {type === "TIME" && (
          <div>
            <FormGroup>
              <Label for="forRounds" hidden>
                Number of Rounds
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
              <Label for="text" hidden>
                Total Time
              </Label>
              <Input
                type="text"
                name="time"
                placeholder="Total Time (mm:ss)"
                value={score.time}
                onChange={e => this.onScoreChange("time", e.target.value)}
                disabled={disable}
              />
            </FormGroup>
            <FormGroup row>
              <Label for="timeCap" hidden>
                Time Cap
              </Label>
              <Col>
                <Input
                  type="numeric"
                  name="timeCap"
                  placeholder="Time Cap (min)"
                  value={timeCap}
                  onChange={e => this.onInputChange("timeCap", e.target.value)}
                  disabled={disable}
                />
              </Col>
            </FormGroup>
          </div>
        )}

        {type === "AMRAP" && (
          <div>
            <FormGroup>
              <Label for="timeCap" hidden>
                Time Cap
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
            <FormGroup>
              <Label for="text" hidden>
                Total Rounds
              </Label>
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
              <Label for="text" hidden>
                Additional Reps
              </Label>
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

        {movements.length > 0 && (
          <div>
            <hr />
            {movements.map((movement, key) => (
              <Row key={key}>
                <Col xs={12}>
                  <FormGroup>
                    <Label for="movement" hidden>
                      Score Type
                    </Label>
                    <Input
                      type="select"
                      name="movement"
                      onChange={e => this.onMovementChange(key, e.target.value)}
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
                </Col>
                <Col xs={6}>
                  <FormGroup>
                    <Label for="reps" hidden>
                      Reps
                    </Label>
                    <Input
                      type="number"
                      name="reps"
                      placeholder="Reps"
                      value={movement.reps}
                      onChange={e => {
                        movement.reps = e.target.value;
                        this.setState({ movements });
                      }}
                      disabled={disable || movement.id.length === 0}
                    />
                  </FormGroup>
                </Col>
                <Col xs={6}>
                  <FormGroup>
                    <Label for="weight" hidden>
                      Reps
                    </Label>
                    <Input
                      type="number"
                      name="weight"
                      placeholder="Weight"
                      value={movement.weight}
                      onChange={e => {
                        movement.weight = e.target.value;
                        this.setState({ movements });
                      }}
                      disabled={disable || movement.id.length === 0}
                    />
                  </FormGroup>
                </Col>
              </Row>
            ))}
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
                    onClick={() => this.addMovement()}
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
