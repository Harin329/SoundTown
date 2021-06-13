import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Typography, Row, Button, Input } from "antd";
import "./index.css";
import { endpoint } from "../../constants";
import { useHistory } from "react-router-dom";

export default function CreateRoom() {
  const { Title } = Typography;
  const history = useHistory();
  const [roomID, setRoomID] = useState("");
  const [adminURL, setAdminURL] = useState("");
  const [shareURL, setShareURL] = useState("");

  const editName = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRoomID(e.target.value);
    setAdminURL(endpoint + e.target.value + "-admin");
    setShareURL(endpoint + e.target.value);
  }

  function startRoom() {
    history.push('/room/' + roomID);
  }

  return (
    <Row className="App">
      <div style={{ flexDirection: "row" }}>
        <Input
          placeholder="Enter Party Name"
          onChange={editName}
        />
        <Title style={{ color: "white" }}>Admin URL: {adminURL}</Title>
        <Title style={{ color: "white" }}>Normal Share URL: {shareURL}</Title>
        <Button type="primary" shape="round" size="large" onClick={startRoom}>
          Get The Party Started!
        </Button>
      </div>
    </Row>
  );
}
