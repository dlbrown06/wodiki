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
import Calendar from "react-calendar";
import moment from "moment";

import FormAddMovement from "../../components/_Forms/AddMovement";
import FormAddStrength from "../../components/_Forms/AddStrength";
import FormAddWOD from "../../components/_Forms/AddWOD";

import Workouts from "../../components/Workouts";

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
      wod_types: [],
      viewWorkoutDate: moment().format("YYYY-MM-DD"),
      today: moment().format("YYYY-MM-DD"),

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
      this.setState({ loading: true });
      const rsp = await request
        .get(`/api/athletes/${auth.getId()}/dashboard`)
        .set(...auth.tokenHeader());
      const { measurements, wods, strength, movements, wod_types } = rsp.body;
      this.setState({
        loading: false,
        measurements,
        wods,
        strength,
        movements,
        wod_types
      });
      return true;
    } catch (err) {
      console.error(err);
      this.setState({
        loading: false
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
    try {
      this.setState({ addingWODError: "", addingWOD: true });
      await request
        .post("/api/wods")
        .set(...auth.tokenHeader())
        .send(wod);
      this.setState(
        { addingWOD: false, addWODModal: false },
        this.onFetchDashboard
      );
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
      this.setState(
        { addingStrength: false, addStrengthModal: false },
        this.onFetchDashboard
      );
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
      wod_types,
      viewWorkoutDate,
      today,

      addingMovement,
      addingMovementError,
      addingWOD,
      addingWODError,
      addingStrength,
      addingStrengthError
    } = this.state;
    return (
      <Container className="Athletes">
        <div className={`loading-overlay ${loading ? "show" : "hide"}`}>
          Loading
        </div>
        <div>
          <Row>
            <Col xs={12}>
              <div className="text-center">
                You are a member... you are awesome...
              </div>
              <div className="text-center">
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
                disabled={loading}
              >
                Add New Movement
              </Button>
            </Col>
          </Row>

          <Row className="m-t-md">
            <Col xs={6}>
              <Button
                color="info"
                block
                onClick={() => this.setState({ addStrengthModal: true })}
                disabled={loading}
              >
                Add Strength
              </Button>
            </Col>
            <Col xs={6}>
              <Button
                color="info"
                block
                onClick={() => this.setState({ addWODModal: true })}
                disabled={loading}
              >
                Add WOD
              </Button>
            </Col>
          </Row>

          <Row className="mt-4">
            <Col>
              <h4>Workout Calendar</h4>
              <Calendar
                onChange={e =>
                  this.setState({
                    viewWorkoutDate: moment(e).format("YYYY-MM-DD")
                  })
                }
                value={new Date()}
                tileClassName={({ date, view }) => {
                  if (view === "month") {
                    const day = moment(date).format("YYYY-MM-DD");
                    const foundWOD = wods.find(w => w.wod_date === day);
                    const foundStrength = strength.find(
                      s => s.strength_date === day
                    );

                    return foundWOD || foundStrength ? "worked" : null;
                  }

                  return null;
                }}
              />
            </Col>
          </Row>

          <Row className="mt-4">
            <Col>
              <h4>
                Viewing{" "}
                {today === viewWorkoutDate
                  ? " Today"
                  : moment(viewWorkoutDate).format("MMM Do")}
              </h4>
              <Workouts
                wods={wods.filter(w => w.wod_date === viewWorkoutDate)}
                strength={strength.filter(
                  s => s.strength_date === viewWorkoutDate
                )}
              />
            </Col>
          </Row>
        </div>

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
                wodTypes={wod_types}
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
