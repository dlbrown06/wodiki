import React, { Component } from "react";
import PropTypes from "prop-types";
import { Col, Form, FormGroup, Label, Input, Button, Alert } from "reactstrap";
import _ from "lodash";

import "./style.css";

class FormAddMovement extends Component {
  constructor() {
    super();

    this.state = {
      name: "",
      types: []
    };
  }

  onInputChange = (name, value) => {
    const state = this.state;
    state[name] = value;
    this.setState(state);
  };

  onMeasurementMethodClick = selected => {
    let { types } = this.state;
    let found = types.find(type => type.name === selected.name);
    if (!found) {
      types.push(selected);
    } else {
      types = types.filter(type => type.name !== selected.name);
    }
    this.setState({ types });
  };

  onSubmit = async e => {
    e.preventDefault();
    const { onSubmit } = this.props;
    const { name, types } = this.state;

    const result = await onSubmit(name, types);
    if (result) {
      this.setState({ name: "", types: [] });
    }
  };

  render() {
    const { error, disable, movements, measurements } = this.props;
    const { name, types } = this.state;

    return (
      <Form className="FormAddMovement">
        <FormGroup row>
          <Label for="movementName" hidden>
            Movement Name
          </Label>
          <Col>
            <Input
              type="text"
              name="name"
              id="name"
              placeholder="Movement Name"
              value={name}
              onChange={e => this.onInputChange("name", e.target.value)}
              disabled={disable}
            />
          </Col>
        </FormGroup>

        <FormGroup>
          <legend>Measurement Methods</legend>
          {measurements.map((type, key) => (
            <FormGroup check key={key}>
              <Label check>
                <Input
                  type="checkbox"
                  disabled={name === ""}
                  onChange={() => this.onMeasurementMethodClick(type)}
                />{" "}
                {_.capitalize(type.name)}
              </Label>
            </FormGroup>
          ))}
        </FormGroup>

        {error && (
          <FormGroup>
            <Alert color="danger">{error}</Alert>
          </FormGroup>
        )}

        <Button
          block
          color="primary"
          disabled={
            disable ||
            name.length < 3 ||
            types.length === 0 ||
            movements.find(item => item.name === name) !== undefined
          }
          onClick={this.onSubmit}
        >
          Add Movement
        </Button>
      </Form>
    );
  }
}

FormAddMovement.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  movements: PropTypes.array.isRequired,
  measurements: PropTypes.array.isRequired,
  error: PropTypes.string,
  disable: PropTypes.bool
};

FormAddMovement.defaultProps = {
  error: undefined,
  disable: false
};

export default FormAddMovement;
