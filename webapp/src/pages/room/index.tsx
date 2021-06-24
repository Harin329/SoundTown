import React, { useEffect, useState, useMemo } from "react";
import { useSelector } from "react-redux";
import {
  Typography,
  Row,
  Col,
  Input,
  Button,
  Space,
  Image,
  message,
} from "antd";
import "./index.css";
import { useHistory } from "react-router-dom";
import back from "../../images/back.png";
import setting from "../../images/setting.png";
import share from "../../images/share.png";
import logo from "../../images/logo.png";
import play from "../../images/play.png";
import pause from "../../images/pause.png";
import close from "../../images/close.png";
import { useMutation, useQuery } from "@apollo/client";
import SpotifyWebApi from "spotify-web-api-js";
import {
  selectAccessToken,
  selectDisplayName,
  selectImageURI,
  selectUID,
} from "../../reducer/authReducer";
import { GET_ROOM } from "../../query/room";
import { selectRoomID } from "../../reducer/roomReducer";
import { CREATE_REQUEST, GET_REQUEST, PLAY_REQUEST } from "../../query/request";

interface Request {
  _id: string;
  song: string;
  creator: string;
  creator_name: string;
  creator_uri: string;
  image_uri: string;
  message: string;
  room_id?: any;
}

export default function Room() {
  const { Title, Text } = Typography;
  const { TextArea } = Input;
  const history = useHistory();
  const [roomObj, setRoomObj] = useState();
  const [roomName, setRoomName] = useState("");
  const [roomImage, setRoomImage] = useState("");
  const [nowPlaying, setNowPlaying] = useState<SpotifyApi.TrackObjectFull>();
  const [nowRequest, setNowRequest] = useState<Request>();
  const [songMessage, setMessage] = useState("");
  const [paused, setPaused] = useState(true);
  const [listeners, setListeners] = useState([]);
  const [queue, setQueue] = useState([1, 2, 3, 4, 5]);
  const [searchResult, setSearchResult] = useState<
    SpotifyApi.TrackObjectFull[] | undefined
  >([]);
  const [queuedSong, setQueuedSong] = useState<SpotifyApi.TrackObjectFull>();
  const [query, setQuery] = useState("");
  const [queueMessage, setQueueMessage] = useState("");
  const token = useSelector(selectAccessToken);
  const displayName = useSelector(selectDisplayName);
  const userID = useSelector(selectUID);
  const user_image = useSelector(selectImageURI);
  const spotifyClient = useMemo(() => {
    const client = new SpotifyWebApi();
    client.setAccessToken(token);
    return client;
  }, [token]);

  document.body.style.overflow = "hidden";

  const roomID = useSelector(selectRoomID);

  console.log(roomID);

  const { loading, error, data } = useQuery(GET_ROOM, {
    variables: { id: roomID },
  });

  useEffect(() => {
    if (!loading) {
      console.log(data);
      setRoomObj(data.room._id);
      setRoomName(data.room.name);
      setRoomImage(data.room.image_uri);
    }
    if (error) {
      console.log(error);
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

  const [createRequest] = useMutation(CREATE_REQUEST);
  const [playRequest] = useMutation(PLAY_REQUEST);
  const { data: nextRequest, refetch } = useQuery(GET_REQUEST, {
    variables: {
      id: {
        _id: roomID,
      },
    },
  });

  const playNext = () => {
    refetch({
      id: {
        _id: roomID,
      },
    }).then((res) => {
      const next = res.data.request;
      spotifyClient
        .queue(next.song)
        .then(() => {
          spotifyClient.getTrack(next.song.split(":")[2]).then((songObj) => {
            setPaused(false);
            setNowPlaying(songObj);
            setMessage(next.message);
            setNowRequest(next);
            playRequest({
              variables: {
                id: next._id,
              },
            });

            setTimeout(() => {
              playNext();
            }, songObj?.duration_ms! - 5000);
          });
        })
        .catch((err) => {
          console.log(err);
          message.info(
            "Please start playing music on a spotify connected device first!"
          );
        });
    }).catch((err) => {
      console.log(err);
      console.log("no more songs");
    });
  };

  const playNow = (
    songObj: SpotifyApi.TrackObjectFull | undefined,
    requestObj: any
  ) => {
    spotifyClient
      .queue(songObj!.uri)
      .then(() => {
        spotifyClient
          .play()
          .then(() => {
            spotifyClient.skipToNext();
            setPaused(false);
            setNowPlaying(songObj);
            setMessage(requestObj.message);
            setNowRequest(requestObj);
            playRequest({
              variables: {
                id: requestObj._id,
              },
            });

            setTimeout(() => {
              playNext();
            }, songObj?.duration_ms! - 5000);
          })
          .catch(() => {
            message.info(
              "Please start playing music on a spotify connected device first!"
            );
          });
      })
      .catch(() => {
        message.info(
          "Please start playing music on a spotify connected device first!"
        );
      });
  };

  const togglePause = () => {
    if (paused) {
      spotifyClient
        .play()
        .then(() => {
          setPaused(false);
        })
        .catch(() => {
          message.info(
            "Please start playing music on a spotify connected device first!"
          );
        });
    } else {
      spotifyClient
        .pause()
        .then(() => {
          setPaused(true);
        })
        .catch(() => {
          message.info(
            "Please start playing music on a spotify connected device first!"
          );
        });
    }
  };

  const queueSong = () => {
    // Create Request in Mongo
    createRequest({
      variables: {
        song: queuedSong?.uri,
        creator: userID,
        creator_name: displayName,
        creator_uri: user_image,
        image_uri: queuedSong?.album.images[0].url,
        message: queueMessage,
        room_id: {
          link: roomObj,
        },
      },
    })
      .then((res) => {
        // Get Created Request ID
        // const requestID = res.data.insertOneRequest._id;
        // console.log(requestID);

        if (!nowPlaying) {
          playNow(queuedSong, res.data.insertOneRequest);
        }

        setQueuedSong(undefined);
        setQueueMessage("");
      })
      .catch((err) => {
        message.error(err);
      });
  };

  return (
    <Space className="App-room" size={"small"}>
      <Row className="App-header">
        <Col className="App-header-left">
          <Image
            className="image-button"
            src={back}
            alt="back"
            preview={false}
            onClick={() => {
              history.push("/");
            }}
          />
          <Image
            src={roomImage !== "" ? roomImage : logo}
            className="room-image"
            alt={roomName}
            preview={false}
          />
          <Text
            style={{
              color: "white",
              fontSize: 30,
              fontFamily: "Gotham-Medium",
            }}
          >
            {roomName}
          </Text>
        </Col>
        <Col className="App-header-right">
          <Image
            className="image-button icon-button"
            src={setting}
            alt="setting"
            preview={false}
            onClick={() => {
              history.push("/");
            }}
          />
          <Image
            className="image-button icon-button"
            src={share}
            alt="share"
            preview={false}
            onClick={() => {
              history.push("/");
            }}
          />
        </Col>
      </Row>
      <Row className="App-content">
        <Col span={12}>
          {nowPlaying !== undefined && nowRequest !== undefined && (
            <Col className="App-now-playing">
              <Row style={{ flex: 1, paddingBottom: 10 }}>
                <Title level={5} style={{ color: "white" }}>
                  Now Playing
                </Title>
              </Row>
              <Row style={{ flex: 4 }}>
                <Image
                  src={nowPlaying.album.images[0].url}
                  className="now-playing-image"
                  alt={nowPlaying.name}
                  preview={false}
                />
                <Col style={{ flex: 1.5, paddingLeft: 50 }}>
                  <Row style={{ alignItems: "center" }}>
                    <Image
                      src={nowRequest.creator_uri}
                      className="profile-image"
                      alt={nowRequest.creator_name}
                      preview={false}
                    />
                    <Title
                      level={5}
                      style={{
                        color: "white",
                        marginTop: 10,
                      }}
                    >
                      {nowRequest.creator_name}
                    </Title>
                  </Row>
                  <Text
                    className="song-message"
                    style={{ color: "white", fontSize: 20 }}
                  >
                    {songMessage}
                  </Text>
                </Col>
              </Row>
              <Row style={{ flex: 1 }}>
                <Col
                  style={{
                    flex: 1,
                    alignItems: "start",
                    justifyContent: "start",
                  }}
                >
                  <Title
                    level={3}
                    style={{
                      color: "white",
                      textAlign: "start",
                      marginTop: 20,
                    }}
                  >
                    {nowPlaying.name}
                  </Title>
                  <Title
                    level={5}
                    style={{
                      color: "white",
                      textAlign: "start",
                      marginTop: -10,
                    }}
                  >
                    {nowPlaying.artists[0].name}
                  </Title>
                </Col>
                <Col
                  style={{
                    flex: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Image
                    src={paused ? play : pause}
                    style={{
                      width: paused ? 30 : 40,
                      height: paused ? 30 : 40,
                    }}
                    className="image-button"
                    alt={paused ? "play" : "pause"}
                    preview={false}
                    onClick={togglePause}
                  />
                </Col>
              </Row>
            </Col>
          )}
          {(nowPlaying === undefined || nowRequest === undefined) && (
            <Col className="App-now-playing">
              <Row style={{ flex: 1, paddingBottom: 10 }}>
                <Title level={5} style={{ color: "white" }}>
                  No Songs Currently Playing
                </Title>
              </Row>
            </Col>
          )}
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
            <Row
              style={{
                justifyContent: "space-evenly",
              }}
            >
              <Row style={{ alignItems: "center" }}>
                <Image
                  src={roomImage}
                  className="tunedin-image"
                  alt={roomName}
                  preview={false}
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
              <Row style={{ alignItems: "center" }}>
                <Image
                  src={roomImage}
                  className="tunedin-image"
                  alt={roomName}
                  preview={false}
                />
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
            </Row>
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
                  <Col
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
                    <Image
                      style={{
                        width: 150,
                        height: 150,
                        objectFit: "cover",
                        borderRadius: 20,
                      }}
                      alt="example"
                      src={res.album.images[0].url}
                      preview={false}
                    />
                    <Text
                      className="resultName"
                      style={{
                        color: "white",
                        fontSize: 18,
                        textAlign: "start",
                        width: 150,
                      }}
                    >
                      {res.name}
                    </Text>
                    <Text
                      style={{
                        color: "white",
                        fontSize: 14,
                        textAlign: "start",
                        width: 150,
                      }}
                    >
                      {res.artists[0].name}
                    </Text>
                  </Col>
                );
              })}
              <Col
                style={{
                  width: "25%",
                  height: 250,
                  alignItems: "start",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Col
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
                  <Text
                    style={{ color: "white", fontSize: 18, textAlign: "start" }}
                  >
                    See More
                  </Text>
                </Col>
              </Col>
            </Row>
          )}
          {queuedSong && (
            <Col
              style={{
                flex: 1,
                paddingBottom: 10,
                marginLeft: 30,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Row>
                <Title level={5} style={{ color: "white" }}>
                  Include a Message
                </Title>
              </Row>
              <Row
                align="middle"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Row>
                  <Image
                    src={queuedSong.album.images[0].url}
                    className="selected-image"
                    alt={roomName}
                    preview={false}
                  />
                  <Col>
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
                </Row>
                <Image
                  className="image-button"
                  src={close}
                  style={{ width: 30, height: 30 }}
                  alt={"Close"}
                  preview={false}
                  onClick={() => {
                    setQueuedSong(undefined);
                  }}
                />
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
              <Button
                className="button"
                type="primary"
                shape="round"
                size="large"
                style={{
                  marginTop: 20,
                  alignSelf: "flex-end",
                  justifySelf: "flex-end",
                }}
                onClick={queueSong}
              >
                Queue Song
              </Button>
            </Col>
          )}
        </Col>
      </Row>
      <Row className="App-footer">
        <Title level={5} style={{ color: "white" }}>
          Next Up
        </Title>
        <Col
          style={{
            flexDirection: "row",
            flex: 1,
            display: "flex",
            justifyContent: "space-evenly",
          }}
        >
          {queue.map((res) => {
            return (
              <Row align="middle">
                <Image
                  src={roomImage}
                  className="nextsong-image"
                  alt={roomName}
                  preview={false}
                />
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
        </Col>
      </Row>
    </Space>
  );
}
