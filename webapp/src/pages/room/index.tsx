import { useEffect, useState, useMemo } from "react";
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
import { GET_ROOM, NOW_PLAYING } from "../../query/room";
import { selectRoomID } from "../../reducer/roomReducer";
import {
  CREATE_REQUEST,
  GET_QUEUE,
  GET_REQUEST,
  GET_REQUEST_BY_ID,
  PLAY_REQUEST,
} from "../../query/request";
import {
  CREATE_USER,
  GET_USER,
  GET_USER_IN_ROOM,
  USER_STAY,
} from "../../query/user";
import { getHashID } from "../../utils/hashUtils";
import { getAuthorizeHref } from "../../oauthConfig";

interface Request {
  _id: string;
  song: string;
  song_name: string;
  creator: string;
  creator_name: string;
  creator_uri: string;
  image_uri: string;
  message: string;
  room_id?: any;
}

interface User {
  _id: string;
  id: string;
  current_room: string;
  user_image: string;
  user_name: string;
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
  const [listeners, setListener] = useState<User[]>([]);
  const [searchResult, setSearchResult] = useState<
    SpotifyApi.TrackObjectFull[] | undefined
  >([]);
  const [queuedSong, setQueuedSong] = useState<SpotifyApi.TrackObjectFull>();
  const [query, setQuery] = useState("");
  const [queueMessage, setQueueMessage] = useState("");
  const [queueEntry, setQueueEntry] = useState("");
  const [initialLoad, setInitialLoad] = useState(false);
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

  const { loading, error, data } = useQuery(GET_ROOM, {
    variables: { id: roomID },
  });
  const { refetch: refetchListeners } = useQuery(GET_USER_IN_ROOM);
  const { refetch: refetchRequest } = useQuery(GET_REQUEST_BY_ID);
  const { loading: currentUserLoading, data: currentUser } = useQuery(
    GET_USER,
    {
      variables: {
        id: userID,
      },
    }
  );
  const { refetch } = useQuery(GET_REQUEST, {
    variables: {
      id: {
        _id: roomID,
      },
    },
  });
  const {
    loading: queueLoading,
    data: queue,
    refetch: refetchQueue,
    stopPolling: stopQueueRefetch,
  } = useQuery(GET_QUEUE, {
    variables: {
      id: {
        _id: roomID,
      },
    },
    pollInterval: 10000,
  });
  const [createRequest] = useMutation(CREATE_REQUEST);
  const [playRequest] = useMutation(PLAY_REQUEST);
  const [createUser] = useMutation(CREATE_USER);
  const [keepUser] = useMutation(USER_STAY);
  const [mutateNowPlaying] = useMutation(NOW_PLAYING);

  useEffect(() => {
    if (!loading) {
      if (!token) {
        localStorage.setItem("roomID", getHashID());
        window.open(getAuthorizeHref(), "_self");
      } else {
        setRoomObj(data.room._id);
        setRoomName(data.room.name);
        setRoomImage(data.room.image_uri);
      }
    }
    if (error) {
      console.log(error);
    }
  }, [data, error, loading, token]);

  useEffect(() => {
    if (
      !queueLoading &&
      !loading &&
      !initialLoad &&
      queue.requests.length > 0
    ) {
      if (queueEntry === "") {
        refetchListeners({ current_room: roomID + "_" + data.room._id }).then(
          (res) => {
            if (res.data.users.length === 0) {
              stopQueueRefetch();
              createUser({
                variables: {
                  id: userID,
                  user_image: user_image,
                  user_name: displayName,
                },
              }).then(() => {
                playNext(true, 5000);
                setInitialLoad(true);
              });
            }
          }
        );
        setQueueEntry(queue.requests[0]._id);
      } else if (queueEntry !== queue.requests[0]._id) {
        stopQueueRefetch();
        createUser({
          variables: {
            id: userID,
            user_image: user_image,
            user_name: displayName,
          },
        }).then(() => {
          playNext(true, 5000);
          setInitialLoad(true);
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue]);

  // Used to lazy search songs
  useEffect(() => {
    const searchSong = (e: string) => {
      if (e !== "") {
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
      }
    };

    const timeout_id = setTimeout(() => {
      searchSong(query);
    }, 1000);

    return () => clearTimeout(timeout_id);
  }, [query, spotifyClient]);

  // Used to see if music is to be resumed
  useEffect(() => {
    if (!currentUserLoading) {
      spotifyClient
        .getMyCurrentPlayingTrack()
        .then((res) => {
          const currentSong = res.item?.id;
          if (
            currentUser.user.current_room !== undefined &&
            currentUser.user.current_room.split("_").length >= 1
          ) {
            const currentUserRequest =
              currentUser.user.current_room.split("_")[1];
            refetchRequest({ id: currentUserRequest }).then((reqRes) => {
              const song = reqRes.data.request.split(":")[2];
              if (song === currentSong) {
                spotifyClient.getTrack(song).then((songObj) => {
                  setTimeout(() => {
                    playNext(false, 500);
                  }, songObj?.duration_ms! - res.progress_ms! - 2000);
                })
              }
            });
          }
        })
        .catch((err) => {
          console.log(err);
        });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, currentUserLoading, refetchRequest, spotifyClient]);

  const playNext = (skip: boolean, timeout: number) => {
    refetch({
      id: {
        _id: roomID,
      },
    })
      .then((res) => {
        const next = res.data.request;
        if (next) {
          spotifyClient
            .queue(next.song)
            .then(() => {
              spotifyClient
                .getTrack(next.song.split(":")[2])
                .then((songObj) => {
                  if (skip) {
                    spotifyClient.skipToNext();
                  }
                  setPaused(false);
                  setNowPlaying(songObj);
                  setMessage(next.message);
                  setNowRequest(next);
                  keepUser({
                    variables: {
                      id: userID,
                      current_room: roomID + "_" + next._id,
                    },
                  }).then(() => {
                    playRequest({
                      variables: {
                        id: next._id,
                      },
                    }).then(() => {
                      if (true) {
                        mutateNowPlaying({
                          variables: {
                            id: roomID,
                            now_playing: {
                              link: next._id,
                            },
                          },
                        });
                      }
                      refetchQueue();
                      refetchListeners({
                        current_room: roomID + next._id,
                      }).then((res) => {
                        console.log(res.data.users);
                        setListener(res.data.users);

                        setTimeout(() => {
                          playNext(false, 500);
                        }, songObj?.duration_ms! - timeout);
                      });
                    });
                  });
                });
            })
            .catch((err) => {
              console.log(err);
              message.info(
                "Please start playing music on a spotify connected device first!"
              );
            });
        }
      })
      .catch((err) => {
        console.log(err);
        setNowPlaying(undefined);
        setNowRequest(undefined);
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
            keepUser({
              variables: {
                id: userID,
                current_room: roomID + "_" + requestObj._id,
              },
            }).then((res) => {
              console.log(res);
              playRequest({
                variables: {
                  id: requestObj._id,
                },
              }).then(() => {
                if (true) {
                  mutateNowPlaying({
                    variables: {
                      id: roomID,
                      now_playing: {
                        link: requestObj._id,
                      },
                    },
                  });
                }
                refetchQueue();
              });

              setTimeout(() => {
                playNext(false, 500);
              }, songObj?.duration_ms! - 5000);
            });
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
        song_name: queuedSong?.name,
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
        } else {
          refetchQueue();
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
              localStorage.clear();
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
            {listeners.length > 1 && (
              <Row
                style={{
                  justifyContent: "space-evenly",
                }}
              >
                <Row style={{ alignItems: "center" }}>
                  <Image
                    src={listeners[0].user_image}
                    className="tunedin-image"
                    alt={listeners[0].user_name}
                    preview={false}
                  />
                  <Title
                    level={5}
                    style={{
                      color: "white",
                      marginTop: 10,
                    }}
                  >
                    {listeners[0].user_name}
                  </Title>
                </Row>
                <Row style={{ alignItems: "center" }}>
                  <Image
                    src={listeners[1].user_image}
                    className="tunedin-image"
                    alt={listeners[1].user_name}
                    preview={false}
                  />
                  <Title
                    level={5}
                    style={{
                      color: "white",
                      marginTop: 10,
                    }}
                  >
                    {listeners.length - 1} Other Listeners
                  </Title>
                </Row>
              </Row>
            )}
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
                    key={res.id}
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
                        borderRadius: 10,
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
              {searchResult !== undefined && searchResult.length >= 8 && (
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
                      borderRadius: 10,
                      justifyContent: "center",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: "white",
                        fontSize: 18,
                        textAlign: "start",
                      }}
                    >
                      See More
                    </Text>
                  </Col>
                </Col>
              )}
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
          {queue !== undefined &&
            queue.requests.map((res: any) => {
              return (
                <Row align="middle" key={res._id}>
                  <Image
                    src={res.image_uri}
                    className="nextsong-image"
                    alt={res.song}
                    preview={false}
                  />
                  <Title
                    level={5}
                    style={{
                      color: "white",
                      marginTop: 10,
                    }}
                  >
                    {res.song_name}
                  </Title>
                </Row>
              );
            })}
        </Col>
      </Row>
    </Space>
  );
}
