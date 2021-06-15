import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Typography, Row, Col, Input, Card, Avatar } from "antd";
import "./index.css";
import { useHistory } from "react-router-dom";
import back from "../../images/back.png";
import setting from "../../images/setting.png";
import share from "../../images/share.png";
import { gql, useQuery } from "@apollo/client";

export default function Room() {
  const { Title, Text } = Typography;
  const { Meta } = Card;
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
      setRoomImage(data.room.image_uri);
    }
  }, [data, error, loading]);

  const searchSong = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log(e.target.value);
  };

  return (
    <Col className="App">
      <Row className="App-header">
        <Col className="App-header-left">
          <img
            className="image-button"
            src={back}
            alt="back"
            onClick={() => {
              history.push("/");
            }}
          />
          <img src={roomImage} className="room-image" alt={roomName} />
          <span
            style={{
              color: "white",
              fontSize: 30,
              fontFamily: "Gotham-Medium",
              marginTop: 5,
            }}
          >
            {roomName}
          </span>
        </Col>
        <Col className="App-header-right">
          <img
            className="image-button icon-button"
            src={setting}
            alt="setting"
            onClick={() => {
              history.push("/");
            }}
          />
          <img
            className="image-button icon-button"
            src={share}
            alt="share"
            onClick={() => {
              history.push("/");
            }}
          />
        </Col>
      </Row>
      <Row className="App-content" style={{ padding: "1%" }}>
        <Col span={12}>
          <Col className="App-now-playing">
            <Row style={{ flex: 1, paddingBottom: 10 }}>
              <Title level={5} style={{ color: "white" }}>
                Now Playing
              </Title>
            </Row>
            <Row style={{ flex: 4 }}>
              <img
                src={roomImage}
                className="now-playing-image"
                alt={roomName}
              />
              <Col style={{ flex: 1.5, paddingLeft: 50 }}>
                <Row style={{ alignItems: "center" }}>
                  <img
                    src={roomImage}
                    className="profile-image"
                    alt={roomName}
                  />
                  <Title
                    level={5}
                    style={{
                      color: "white",
                      marginTop: 10,
                    }}
                  >
                    Harin Wu
                  </Title>
                </Row>
                <Text
                  className="song-message"
                  style={{ color: "white", fontSize: 20 }}
                >
                  Harin Wu chose this song because it's cool.
                </Text>
              </Col>
            </Row>
            <Row style={{ flex: 1 }}>
              <Col
                style={{
                  alignItems: "start",
                  justifyContent: "start",
                }}
              >
                <Title
                  level={3}
                  style={{ color: "white", textAlign: "start", marginTop: 20 }}
                >
                  Deja Vu
                </Title>
                <Title
                  level={5}
                  style={{ color: "white", textAlign: "start", marginTop: -10 }}
                >
                  Olivia Rodrigo
                </Title>
              </Col>
              <Col
                style={{ flex: 1.5, paddingLeft: 50, alignItems: "start" }}
              ></Col>
            </Row>
          </Col>
          <Row>
            <Title level={3} style={{ color: "white" }}>
              Tuned In
            </Title>
          </Row>
        </Col>
        <Col className="App-request" span={12}>
          <Row style={{ flex: 1, paddingBottom: 10 }}>
            <Title level={5} style={{ color: "white" }}>
              Request a Song
            </Title>
            <Input placeholder="Search" onChange={searchSong} />
            <Card style={{ width: 100, marginTop: 16 }} loading={loading}>
              <Meta
                avatar={
                  <Avatar src="https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png" />
                }
                title="Card title"
                description="This is the description"
              />
            </Card>
          </Row>
        </Col>
      </Row>
      <Row className="App-footer">
        <Title level={3} style={{ color: "white" }}>
          Next Up
        </Title>
      </Row>
    </Col>
  );
}
