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
import StrengthLogs from "../../components/StrengthLogs";

import auth from "../../auth";
import history from "../../history";

import "./style.css";

class Athletes extends Component {
  constructor() {
    super();

    this.state = {
      loading: true,
      measurements: [],
      wods: [],
      strength: [],
      movements: [],

      addStrengthModal: true,

      addingWOD: false,
      addingWODError: "",
      addingMovement: false,
      addingMovementError: "",
      addingStrength: false,
      addingStrengthError: ""
    };
  }

  componentWillMount() {
    return this.onFetchDashboard();
  }

  onFetchDashboard = async () => {
    try {
      this.setState({ fetchingStrength: true });
      const rsp = await request
        .get(`/api/athletes/${auth.getId()}/dashboard`)
        .set(...auth.tokenHeader());
      const { measurements, wods, strength, movements } = rsp.body;
      this.setState({
        loading: false,
        measurements,
        wods,
        strength,
        movements
      });
      return true;
    } catch (err) {
      console.error(err);
      this.setState({
        fetchingStrength: false
      });
      return false;
    }
  };

  onAddMovement = async (name, measurements) => {
    try {
      this.setState({ addingMovementError: "", addingMovement: true });
      await request
        .post("/api/movements")
        .set(...auth.tokenHeader())
        .send({
          name,
          measurements: measurements.map(item => item.name)
        });
      this.setState(
        { addingMovement: false, addMovementModal: false },
        this.onFetchDashboard
      );
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
      strength.strength_date = strength.strengthDate;
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

  render() {
    const {
      loading,
      measurements,
      movements,
      wods,
      strength,

      addingMovement,
      addingMovementError,
      addingWOD,
      addingWODError,
      addingStrength,
      addingStrengthError
    } = this.state;
    return (
      <Container className="Athletes">
        <Row>
          <Col xs={12}>
            {loading && <p>Include some update to UI when loading</p>}
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
          <Col xs={12} className="text-left m-t-md">
            <h4>WOD Log</h4>
            <WODLogs wods={wods} />
          </Col>
        </Row>

        <Row>
          <Col xs={12} className="text-left m-t-md">
            <h4>Strength Log</h4>
            <StrengthLogs strength={strength} />
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
                movements={movements}
                measurements={measurements}
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
