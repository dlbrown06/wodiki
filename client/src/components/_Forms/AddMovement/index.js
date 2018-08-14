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
  Alert,
  ButtonGroup
} from "reactstrap";

import "./style.css";

class FormAddMovement extends Component {
  constructor() {
    super();

    this.state = {
      name: "",
      types: [],
      movementTypes: ["REPS", "WEIGHT", "HEIGHT", "DISTANCE", "CALORIES"]
    };
  }

  onInputChange = (name, value) => {
    const state = this.state;
    state[name] = value;
    this.setState(state);
  };

  onMovementTypeClick = selected => {
    const { types } = this.state;
    const index = types.indexOf(selected);
    if (index < 0) {
      types.push(selected);
    } else {
      types.splice(index, 1);
    }
    this.setState({ types: [...types] });
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
    const { error, disable } = this.props;
    const { name, types, movementTypes } = this.state;

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
          <Label>Movement Types</Label>
          <div className="text-center">
            <ButtonGroup vertical>
              {movementTypes.map((type, key) => (
                <Button
                  key={key}
                  color={types.includes(type) ? "info" : "default"}
                  onClick={() => this.onMovementTypeClick(type)}
                  active={types.includes(type)}
                >
                  {type}
                </Button>
              ))}
            </ButtonGroup>
          </div>
        </FormGroup>

        {error && (
          <FormGroup>
            <Alert color="danger">{error}</Alert>
          </FormGroup>
        )}

        <Button
          block
          color="primary"
          disabled={disable || name.length < 3 || types.length === 0}
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
  error: PropTypes.string,
  disable: PropTypes.bool
};

FormAddMovement.defaultProps = {
  error: undefined,
  disable: false
};

export default FormAddMovement;
