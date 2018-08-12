import React, { Component } from "react";
import PropTypes from "prop-types";
import { Col, Form, FormGroup, Label, Input, Button, Alert } from "reactstrap";

import "./style.css";

class FormAddMovement extends Component {
  constructor() {
    super();

    this.state = {
      name: "",
      type: ""
    };
  }

  onInputChange = (name, value) => {
    const state = this.state;
    state[name] = value;
    this.setState(state);
  };

  onSubmit = async () => {
    const { onSubmit } = this.props;
    const { name, type } = this.state;

    const result = await onSubmit(name, type);
    if (result) {
      this.setState({ name: "", type: "" });
    }
  };

  render() {
    const { error, disable } = this.props;
    const { name, type } = this.state;

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
          <Label for="movementType" hidden>
            Movement Type
          </Label>
          <Input
            type="select"
            name="select"
            id="movementType"
            onChange={e => this.onInputChange("type", e.target.value)}
            disabled={disable}
            value={type}
            onKeyPress={e => e.key === "Enter" && this.onSubmit(name, type)}
          >
            <option disabled value={""}>
              Movement Type
            </option>
            <option>WEIGHT</option>
            <option>REPETITIONS</option>
            <option>DISTANCE</option>
            <option>HEIGHT</option>
          </Input>
        </FormGroup>
        {error && <Alert color="danger">{error}</Alert>}
        <Button
          block
          color="primary"
          disabled={disable || name.length < 3 || type.length === 0}
          onClick={() => this.onSubmit(name, type)}
        >
          Add Movement
        </Button>
      </Form>
    );
  }
}

FormAddMovement.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  error: PropTypes.string,
  disable: PropTypes.bool
};

FormAddMovement.defaultProps = {
  error: undefined,
  disable: false
};

export default FormAddMovement;
