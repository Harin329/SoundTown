import React, { useEffect } from "react";
import { useSelector, useDispatch } from 'react-redux';
import { Typography, Row, Button } from "antd";
import "./index.css";

export default function JoinRoom() {
  const { Title } = Typography;

  return (
    <Row className="App">
      <div style={{ flexDirection: "row" }}>
        <Title style={{ color: "white" }}>Welcome to SoundTown!</Title>
      </div>
    </Row>
  );
}