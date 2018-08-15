import React, { Component } from "react";
import {
  Container,
  Row,
  Col,
  Modal,
  ModalHeader,
  ModalBody,
  Button
} from "reactstrap";
import request from "superagent";

import FormAddMovement from "../../components/_Forms/AddMovement";
import FormAddStrength from "../../components/_Forms/AddStrength";
import FormAddWOD from "../../components/_Forms/AddWOD";
import WODLogs from "../../components/WODLogs";
import auth from "../../auth";
import history from "../../history";

import "./style.css";

class Athletes extends Component {
  constructor() {
    super();

    this.state = {
      wods: [],
      fetchingWODs: false,

      movements: [],
      fetchingMovements: false,

      addingWOD: false,
      addingWODError: "",

      addingMovement: false,
      addingMovementError: "",

      addingStrength: false,
      addingStrengthError: ""
    };
  }

  componentWillMount() {
    return Promise.all[(this.onFetchMovements(), this.onFetchWODs())];
  }

  onAddMovement = async (name, types) => {
    try {
      this.setState({ addingMovementError: "", addingMovement: true });
      await request
        .post("/api/movements")
        .set(...auth.tokenHeader())
        .send({
          name,
          types
        });
      this.setState({ addingMovement: false, addMovementModal: false });
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

  onAddStrength = async strength => {
    try {
      this.setState({ addingStrengthError: "", addingStrength: true });
      await request
        .post("/api/strength")
        .set(...auth.tokenHeader())
        .send(strength);
      this.setState({ addingStrength: false });
      return true;
    } catch (err) {
      console.error(err);
      this.setState({
        addingStrengthError: `Failed to include new Strength Workout`,
        addingStrength: false
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

  onFetchWODs = async () => {
    try {
      this.setState({ fetchingWODs: true });
      const rsp = await request
        .get(`/api/wods/${auth.getId()}`)
        .set(...auth.tokenHeader());
      this.setState({ fetchingWODs: false, wods: rsp.body.results });
      return true;
    } catch (err) {
      console.error(err);
      this.setState({
        fetchingWODs: false
      });
      return false;
    }
  };

  render() {
    const {
      addingMovement,
      addingMovementError,
      movements,
      wods,
      addingWOD,
      addingWODError,
      addingStrength,
      addingStrengthError
    } = this.state;
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
            <Button
              color="info"
              block
              onClick={() => this.setState({ addMovementModal: true })}
            >
              Add New Movement
            </Button>
          </Col>
        </Row>

        <Row className="m-t-md">
          <Col xs={12}>
            <Button
              color="info"
              block
              onClick={() => this.setState({ addStrengthModal: true })}
            >
              Add Strength
            </Button>
          </Col>
        </Row>

        <Row className="m-t-md">
          <Col xs={12}>
            <Button
              color="info"
              block
              onClick={() => this.setState({ addWODModal: true })}
            >
              Add WOD
            </Button>
          </Col>
        </Row>

        <Row>
          <Col xs={12}>
            <WODLogs wods={wods} />
          </Col>
        </Row>

        {/*Modals*/}
        <section>
          <Modal
            isOpen={this.state.addMovementModal}
            toggle={() =>
              this.setState({ addMovementModal: !this.state.addMovementModal })
            }
          >
            <ModalHeader
              toggle={() =>
                this.setState({
                  addMovementModal: !this.state.addMovementModal
                })
              }
            >
              Add Movement
            </ModalHeader>
            <ModalBody>
              <FormAddMovement
                onSubmit={this.onAddMovement}
                error={addingMovementError}
                disable={addingMovement}
              />
            </ModalBody>
          </Modal>

          <Modal
            isOpen={this.state.addWODModal}
            toggle={() =>
              this.setState({ addWODModal: !this.state.addWODModal })
            }
          >
            <ModalHeader
              toggle={() =>
                this.setState({
                  addWODModal: !this.state.addWODModal
                })
              }
            >
              Add WOD
            </ModalHeader>
            <ModalBody>
              <FormAddWOD
                availableMovements={movements}
                onSubmit={this.onAddWOD}
                error={addingWODError}
                disable={addingWOD}
              />
            </ModalBody>
          </Modal>

          <Modal
            isOpen={this.state.addStrengthModal}
            toggle={() =>
              this.setState({ addStrengthModal: !this.state.addStrengthModal })
            }
          >
            <ModalHeader
              toggle={() =>
                this.setState({
                  addStrengthModal: !this.state.addStrengthModal
                })
              }
            >
              Add Strength
            </ModalHeader>
            <ModalBody>
              <FormAddStrength
                availableMovements={movements}
                onSubmit={this.onAddStrength}
                error={addingStrengthError}
                disable={addingStrength}
              />
            </ModalBody>
          </Modal>
        </section>
      </Container>
    );
  }
}

export default Athletes;
