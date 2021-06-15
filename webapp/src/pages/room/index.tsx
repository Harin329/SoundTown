import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Typography, Row, Col, PageHeader, Button } from "antd";
import "./index.css";
import { useHistory } from "react-router-dom";
import back from "../../images/back.png";
import { gql, useQuery } from "@apollo/client";

export default function Room() {
  const { Title } = Typography;
  const history = useHistory();
  const [roomName, setRoomName] = useState("");
  const [roomImage, setRoomImage] = useState("");
  const [nowPlaying, setNowPlaying] = useState("");
  const [message, setMessage] = useState("");
  const [listeners, setListeners] = useState([]);
  const [queue, setQueue] = useState([]);

  document.body.style.overflow = "hidden";

  const { loading, error, data } = useQuery(gql`
    query {
      room {
        _id
        admin
        creator
        image_uri
        listeners
        name
        now_playing {
          _id
          creator
          message
          song
          timestamp
        }
      }
    }
  `);

  useEffect(() => {
    if (!loading) {
      console.log(error);
      console.log(data);
      setRoomName(data.room.name);
      setRoomImage(data.room.image_uri)
    }
  }, [data, error, loading]);

  return (
    <Col className="App">
      <Row className="App-header">
        <img
          className="image-button"
          src={back}
          alt="back"
          onClick={() => {
            history.push("/");
          }}
        />
        <img src={roomImage} className="room-image" alt={roomName} />
        <div style={{ color: "white", fontSize: 30 }}>
          {roomName}
        </div>
      </Row>
      <Row className="App-content" style={{padding: '1%'}}>
        <Col span={12}>
          <Row className="App-now-playing" style={{borderRadius: 20}}>
            <Title level={3} style={{ color: "white" }}>Now Playing</Title>
          </Row>
          <Row>
            <Title level={3} style={{ color: "white" }}>Tuned In</Title>
          </Row>
        </Col>
        <Col span={12}>
          <Title level={3} style={{ color: "white" }}>Request a Song</Title>
        </Col>
      </Row>
      <Row className="App-footer">
        <Title level={3} style={{ color: "white" }}>Next Up</Title>
      </Row>
    </Col>
  );
}
