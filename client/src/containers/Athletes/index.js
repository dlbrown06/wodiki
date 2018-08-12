import React, { Component } from "react";
import { Row, Col, Card, CardBody, CardTitle } from "reactstrap";
import request from "superagent";

import FormAddMovement from "../../components/_Forms/AddMovement";
import auth from "../../auth";
import history from "../../history";

import "./style.css";

class Athletes extends Component {
  constructor() {
    super();

    this.state = {
      addingMovement: false,
      addingMovementError: ""
    };
  }

  onAddMovement = async (name, type) => {
    try {
      this.setState({ addingMovementError: "", addingMovement: true });
      const rsp = await request
        .post("/api/movements")
        .set(...auth.tokenHeader())
        .send({
          name,
          type
        });
    } catch (err) {
      console.error(err);
      this.setState({
        addingMovementError: `Failed to include new movement`,
        addingMovement: false
      });
      return false;
    }

    this.setState({ addingMovement: false });
    return true;
  };

  render() {
    const { addingMovement, addingMovementError } = this.state;
    return (
      <Row className="Athletes" noGutters>
        <Row>
          <Col>
            <div className="text-center">
              You are a member... you are awesome...
            </div>
            <div>
              <span
                className="link"
                onClick={() => {
                  auth.logout();
                  history.push("/");
                }}
              >
                now logout
              </span>
              ...
            </div>
          </Col>
        </Row>

        <Row>
          <Col>
            <Card>
              <CardTitle>Add New Movement</CardTitle>
              <CardBody>
                <FormAddMovement
                  onSubmit={this.onAddMovement}
                  error={addingMovementError}
                  disable={addingMovement}
                />
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Row>
    );
  }
}

export default Athletes;
