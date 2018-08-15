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

    this.defaultSet = {
      reps: "",
      weight: "",
      distance: "",
      height: "",
      calories: ""
    };

    this.defaultState = {
      strengthDate: moment().format("YYYY-MM-DD"),
      name: "",
      movement: { id: "", types: [] },
      sets: [_.cloneDeep(this.defaultSet)]
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
    this.setState({
      movement: availableMovements.find(item => item.id === value)
    });
  };

  addSet = () => {
    const { sets } = this.state;
    sets.push(_.cloneDeep(this.defaultState));
    this.setState({ sets });
  };

  removeSet = () => {
    const { sets } = this.state;
    sets.pop();
    this.setState({ sets });
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

        {movement.id !== "" &&
          sets.length > 0 && (
            <div>
              <hr />
              <h5>{sets.length} Sets</h5>
              {sets.map((set, key) => (
                <div key={key}>
                  <Row>
                    {movement.types.map((type, typeKey) => (
                      <Col xs={6} key={typeKey}>
                        <FormGroup>
                          <Label>{_.startCase(type.toLowerCase())}</Label>
                          <Input
                            type="number"
                            placeholder={`Enter ${_.startCase(
                              type.toLowerCase()
                            )}`}
                            // value={set[type.toLowerCase()]}
                            bsSize="sm"
                            onChange={e => {
                              set[type.toLowerCase()] = e.target.value;
                              this.setState({ sets });
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

        <Col xs={12}>
          <hr />
          {error && <Alert color="danger">{error}</Alert>}
          <Row>
            <Col xs={6}>
              <Row>
                <Col xs={6}>
                  <Button
                    block
                    disabled={disable || movement.id === ""}
                    onClick={() => this.addSet()}
                  >
                    +
                  </Button>
                </Col>
                <Col xs={6}>
                  <Button
                    block
                    disabled={disable || movement.id === ""}
                    onClick={() => this.removeSet()}
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
                disabled={disable || _.isEmpty(movement) || sets.length === 0}
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
