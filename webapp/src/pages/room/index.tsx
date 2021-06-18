import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Typography, Row, Col, Input, Card, Button } from "antd";
import "./index.css";
import { useHistory } from "react-router-dom";
import back from "../../images/back.png";
import setting from "../../images/setting.png";
import share from "../../images/share.png";
import { gql, useQuery } from "@apollo/client";
import SpotifyWebApi from "spotify-web-api-js";
import { selectAccessToken } from "../../reducer/authReducer";

export default function Room() {
  const { Title, Text } = Typography;
  const { Meta } = Card;
  const { TextArea } = Input;
  const history = useHistory();
  const [roomName, setRoomName] = useState("");
  const [roomImage, setRoomImage] = useState("");
  const [nowPlaying, setNowPlaying] = useState("");
  const [message, setMessage] = useState("");
  const [listeners, setListeners] = useState([]);
  const [queue, setQueue] = useState([1, 2, 3]);
  const [searchResult, setSearchResult] = useState<
    SpotifyApi.TrackObjectFull[] | undefined
  >([]);
  const [queuedSong, setQueuedSong] = useState<SpotifyApi.TrackObjectFull>();
  const [query, setQuery] = useState("");
  const [queueMessage, setQueueMessage] = useState("");
  const spotifyClient = new SpotifyWebApi();
  const token = useSelector(selectAccessToken);
  spotifyClient.setAccessToken(token);

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

  useEffect(() => {
    const searchSong = (e: string) => {
      spotifyClient
        .search(e, ["track"])
        .then((res) => {
          const results = res.tracks?.items.sort(
            (a, b) => b.popularity - a.popularity
          );
          console.log(results);
          setSearchResult(results);
        })
        .catch((err) => {
          console.log(err);
        });
    };

    const timeout_id = setTimeout(() => {
      searchSong(query);
    }, 1000);

    return () => clearTimeout(timeout_id);
  }, [query, spotifyClient]);

  const queueSong = () => {
    console.log('queue song');
  }

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
          <Row
            style={{
              flex: 1,
              paddingBottom: 10,
              padding: 20,
              flexDirection: "column",
            }}
          >
            <Row>
              <Title level={5} style={{ color: "white" }}>
                Tuned In
              </Title>
            </Row>
            <div
              style={{
                flexDirection: "row",
                flex: 1,
                display: "flex",
                justifyContent: "space-evenly",
              }}
            >
              <Row style={{ alignItems: "center" }}>
                <img src={roomImage} className="profile-image" alt={roomName} />
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
              <Row style={{ alignItems: "center" }}>
                <img src={roomImage} className="profile-image" alt={roomName} />
                <Title
                  level={5}
                  style={{
                    color: "white",
                    marginTop: 10,
                  }}
                >
                  23 Other Listeners
                </Title>
              </Row>
            </div>
          </Row>
        </Col>
        <Col className="App-request" span={12}>
          {!queuedSong && (
            <Row style={{ flex: 1, paddingBottom: 10, marginLeft: 30 }}>
              <Title level={5} style={{ color: "white" }}>
                Request a Song
              </Title>
              <Input
                placeholder="Search"
                onChange={(text) => {
                  setQuery(text.target.value);
                }}
                style={{ marginBottom: 20, width: "95%" }}
              />
              {searchResult?.slice(0, 7).map((res) => {
                return (
                  <div
                    className="resultBlock"
                    style={{
                      width: "25%",
                      height: 250,
                      alignItems: "start",
                      display: "flex",
                      flexDirection: "column",
                    }}
                    onClick={() => {
                      setQueuedSong(res);
                    }}
                  >
                    <img
                      style={{
                        width: 150,
                        height: 150,
                        objectFit: "cover",
                        borderRadius: 20,
                      }}
                      alt="example"
                      src={res.album.images[0].url}
                    />
                    <span
                      className="resultName"
                      style={{ fontSize: 18, textAlign: "start", width: 150 }}
                    >
                      {res.name}
                    </span>
                    <span
                      style={{ fontSize: 14, textAlign: "start", width: 150 }}
                    >
                      {res.artists[0].name}
                    </span>
                  </div>
                );
              })}
              <div
                style={{
                  width: "25%",
                  height: 250,
                  alignItems: "start",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    fontSize: 18,
                    textAlign: "start",
                    width: 150,
                    height: 150,
                    backgroundColor: "black",
                    borderRadius: 20,
                    justifyContent: "center",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontSize: 18, textAlign: "start" }}>
                    See More
                  </span>
                </div>
              </div>
            </Row>
          )}
          {queuedSong && (
            <div style={{ flex: 1, paddingBottom: 10, marginLeft: 30 }}>
              <Row>
                <Title level={5} style={{ color: "white" }}>
                  Include a Message
                </Title>
              </Row>
              <Row align="middle">
              <Col span={3}>
                <img
                  src={queuedSong.album.images[0].url}
                  className="selected-image"
                  alt={roomName}
                />
                </Col>
                <Col span={19}>
                  <Row>
                    <Title
                      level={5}
                      style={{
                        color: "white",
                        marginTop: 10,
                      }}
                    >
                      {queuedSong.name}
                    </Title>
                  </Row>
                  <Row>
                    <Text
                      style={{
                        color: "white",
                        fontSize: 14,
                      }}
                    >
                      {queuedSong.artists[0].name}
                    </Text>
                  </Row>
                </Col>
                <Col span={2}>
                <img
                  src={roomImage}
                  style={{width: 30, height: 30}}
                  alt={roomName}
                  onClick={() => {setQueuedSong(undefined)}}
                />
                </Col>
              </Row>
              <TextArea
                placeholder="Write a message..."
                rows={8}
                value={queueMessage}
                onChange={(text) => {
                  setQueueMessage(text.target.value);
                }}
                style={{ marginTop: 20, width: "100%" }}
              />
              <Button type="primary" shape="round" size="large" onClick={queueSong}>
          Queue Song
        </Button>
            </div>
          )}
        </Col>
      </Row>
      <Row className="App-footer">
        <Title level={5} style={{ color: "white" }}>
          Next Up
        </Title>
        <div
          style={{
            flexDirection: "row",
            flex: 1,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          {queue.map((res) => {
            return (
              <Row style={{ alignItems: "center" }}>
                <img src={roomImage} className="profile-image" alt={roomName} />
                <Title
                  level={5}
                  style={{
                    color: "white",
                    marginTop: 10,
                  }}
                >
                  Deja Vu
                </Title>
              </Row>
            );
          })}
        </div>
      </Row>
    </Col>
  );
}
