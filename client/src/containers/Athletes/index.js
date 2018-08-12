import React, { Component } from "react";
import { Container, Row, Col, Card, CardBody, CardTitle } from "reactstrap";
import request from "superagent";

import FormAddMovement from "../../components/_Forms/AddMovement";
import FormAddWOD from "../../components/_Forms/AddWOD";
import auth from "../../auth";
import history from "../../history";

import "./style.css";

class Athletes extends Component {
  constructor() {
    super();

    this.state = {
      movements: [],
      fetchingMovements: false,

      addingWOD: false,
      addingWODError: "",

      addingMovement: false,
      addingMovementError: ""
    };
  }

  componentWillMount() {
    return this.onFetchMovements();
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
      this.setState({ addingMovement: false });
      return true;
    } catch (err) {
      console.error(err);
      this.setState({
        addingMovementError: `Failed to include new movement`,
        addingMovement: false
      });
      return false;
    }
  };

  onAddWOD = async wod => {
    if (wod.score.time.length > 0) {
      const timeSepIdx = wod.score.time.indexOf(":");
      const min = parseInt(wod.score.time.substr(0, timeSepIdx), 10);
      const sec = parseInt(wod.score.time.substr(timeSepIdx + 1), 10);
      wod.score.time_sec = min * 60 + sec;
    }

    if (wod.timeCap.length > 0) {
      wod.timeCapSec = parseInt(wod.timeCap, 10) * 60;
    }

    try {
      this.setState({ addingWODError: "", addingWOD: true });
      await request
        .post("/api/wods")
        .set(...auth.tokenHeader())
        .send(wod);
      this.setState({ addingWOD: false });
      return true;
    } catch (err) {
      console.error(err);
      this.setState({
        addingWODError: `Failed to include new WOD`,
        addingWOD: false
      });
      return false;
    }
  };

  onFetchMovements = async () => {
    try {
      this.setState({ fetchingMovements: true });
      const rsp = await request
        .get("/api/movements")
        .set(...auth.tokenHeader());
      this.setState({ fetchingMovements: false, movements: rsp.body.results });
      return true;
    } catch (err) {
      console.error(err);
      this.setState({
        fetchingMovements: false
      });
      return false;
    }
  };

  render() {
    const { addingMovement, addingMovementError, movements } = this.state;
    return (
      <Container className="Athletes">
        <Row className="m-t-md">
          <Col xs={12}>
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

        <Row className="m-t-md">
          <Col xs={12}>
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

        <Row className="m-t-md">
          <Col xs={12}>
            <Card>
              <CardTitle>Add New WOD</CardTitle>
              <CardBody>
                <FormAddWOD
                  availableMovements={movements}
                  onSubmit={this.onAddWOD}
                  error={addingMovementError}
                  disable={addingMovement}
                />
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }
}

export default Athletes;
