import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Typography, Row, Col, PageHeader, Button } from "antd";
import "./index.css";
import { useHistory } from "react-router-dom";
import back from "../../images/back.png";

export default function Room() {
  const { Title } = Typography;
  const history = useHistory();
  const [roomName, setRoomName] = useState("Harin's Chill Room");
  const [nowPlaying, setNowPlaying] = useState("");
  const [message, setMessage] = useState("");
  const [listeners, setListeners] = useState([]);
  const [queue, setQueue] = useState([]);

  document.body.style.overflow = "hidden";

  return (
    <Col className="App">
      <Row className="App-header">
        <img
          src={back}
          style={{ width: 50, height: 50 }}
          alt="back"
          onClick={() => {
            history.push("/");
          }}
        />
        <img
          src={back}
          style={{ width: 50, height: 50 }}
          alt="back"
        />
        <Title style={{ color: "white", alignSelf: 'center' }}>{roomName}</Title>
      </Row>
      <Row className="App-content">
        <Col span={12}>
          <Row className="App-now-playing">
            <Title style={{ color: "white" }}>Now Playing</Title>
          </Row>
          <Row>
            <Title style={{ color: "white" }}>Tuned In</Title>
          </Row>
        </Col>
        <Col span={12}>
          <Title style={{ color: "white" }}>Request a Song</Title>
        </Col>
      </Row>
      <Row className="App-footer">
        <Title style={{ color: "white" }}>Next Up</Title>
      </Row>
    </Col>
  );
}
