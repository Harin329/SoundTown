import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Typography, Row, Col, Space, Image, message } from "antd";
import "./index.css";
import { useHistory } from "react-router-dom";
import back from "../../images/back.png";
import setting from "../../images/setting.png";
import share from "../../images/share.png";
import logo from "../../images/logo.png";
import play from "../../images/play.png";
import pause from "../../images/pause.png";
import { useMutation, useQuery } from "@apollo/client";
import SpotifyWebApi from "spotify-web-api-js";
import {
  selectAccessToken,
  selectDisplayName,
  selectImageURI,
  selectUID,
} from "../../reducer/authReducer";
import { GET_ROOM, NONE_PLAYING, NOW_PLAYING } from "../../query/room";
import {
  isRoomPaused,
  selectNowPlaying,
  selectNowRequest,
  selectRoomID,
  selectRoomListeners,
  selectRoomObj,
  setListeners,
  setNowPlaying,
  setNowRequest,
  setPaused,
  setRoomObj,
} from "../../reducer/roomReducer";
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
import Search from "../../components/search";

export const timeouts: NodeJS.Timeout[] = [];

export default function Room() {
  const { Title, Text } = Typography;
  const history = useHistory();
  const dispatch = useDispatch();
  const [queueEntry, setQueueEntry] = useState("");
  const [firstLoad, setFirstLoad] = useState(true);
  const [initialLoad, setInitialLoad] = useState(false);

  const token = useSelector(selectAccessToken);
  const displayName = useSelector(selectDisplayName);
  const userID = useSelector(selectUID);
  const user_image = useSelector(selectImageURI);
  const paused = useSelector(isRoomPaused);
  const roomObj = useSelector(selectRoomObj);
  const nowPlaying = useSelector(selectNowPlaying);
  const nowRequest = useSelector(selectNowRequest);
  const listeners = useSelector(selectRoomListeners);

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
  } = useQuery(GET_QUEUE, {
    variables: {
      id: {
        _id: roomID,
      },
    },
    pollInterval: 5000,
  });
  const [createRequest] = useMutation(CREATE_REQUEST);
  const [playRequest] = useMutation(PLAY_REQUEST);
  const [createUser] = useMutation(CREATE_USER);
  const [keepUser] = useMutation(USER_STAY);
  const [mutateNowPlaying] = useMutation(NOW_PLAYING);
  const [mutateNonePlaying] = useMutation(NONE_PLAYING);

  // Setup Room
  useEffect(() => {
    if (!loading) {
      if (!token || data === undefined) {
        localStorage.setItem("roomID", getHashID());
        window.open(getAuthorizeHref(), "_self");
      } else {
        dispatch(setRoomObj(data.room));
      }
    }
    if (error) {
      console.log(error);
    }
  }, [data, dispatch, error, loading, token]);

  const soloUser = (d: any) => {
    console.log(d);
    if (d.room.now_playing !== null) {
      refetchListeners({
        current_room: roomID + "_" + d.room.now_playing._id,
      })
        .then((res) => {
          console.log(res.data);
          dispatch(setListeners(res.data.users));
          if (res.data.users.length === 0 || res.data.users[0].id === userID) {
            createUser({
              variables: {
                id: userID,
                user_image: user_image,
                user_name: displayName,
              },
            }).then(() => {
              playNext(true, 5000);
              console.log("playing next!");
              setInitialLoad(true);
            });
          } else {
            setFirstLoad(true);
          }
        })
        .catch((err) => {
          console.log(err);
        });
    } else {
      createUser({
        variables: {
          id: userID,
          user_image: user_image,
          user_name: displayName,
        },
      }).then(() => {
        playNext(true, 5000);
        console.log("playing next!");
        setInitialLoad(true);
      });
    }
  };

  // Poll Until Ready to Play New Song
  useEffect(() => {
    if (!queueLoading && !loading && !initialLoad && !currentUserLoading) {
      if (queueEntry === "") {
        spotifyClient
          .getMyCurrentPlayingTrack()
          .then((res) => {
            const currentSong = res.item?.id;
            if (
              currentUser.user.current_room !== undefined &&
              currentUser.user.current_room !== null &&
              currentUser.user.current_room.split("_").length >= 1
            ) {
              const currentUserRequest =
                currentUser.user.current_room.split("_")[1];
              refetchRequest({ id: currentUserRequest })
                .then((reqRes) => {
                  const song = reqRes.data.request.song.split(":")[2];
                  console.log(data);
                  if (
                    song === currentSong &&
                    data.room.now_playing !== undefined &&
                    data.room.now_playing !== null
                  ) {
                    spotifyClient.getTrack(song).then((songObj) => {
                      dispatch(setPaused(false));
                      dispatch(setNowPlaying(songObj));
                      dispatch(setNowRequest(reqRes.data.request));
                      setFirstLoad(false);
                      refetchListeners({
                        current_room: roomID + "_" + data.room.now_playing._id,
                      }).then((res) => {
                        console.log(res.data);
                        dispatch(setListeners(res.data.users));
                      });
                      const time = setTimeout(() => {
                        playNext(false, 500);
                        console.log("playing next!");
                      }, songObj?.duration_ms! - res.progress_ms! - 2000);
                      timeouts.push(time);
                    });
                  } else {
                    console.log("not current song");
                    soloUser(data);
                  }
                })
                .catch((err) => {
                  console.log(err);
                  soloUser(data);
                });
            } else {
              console.log("current room null");
              soloUser(data);
            }
          })
          .catch((err) => {
            console.log(err);
            soloUser(data);
          });
        if (queue.requests.length > 0) {
          setQueueEntry(queue.requests[0]._id);
        }
      } else if (
        queue.requests.length > 0 &&
        queueEntry !== queue.requests[0]._id &&
        firstLoad
      ) {
        setFirstLoad(false);
        createUser({
          variables: {
            id: userID,
            user_image: user_image,
            user_name: displayName,
          },
        }).then(() => {
          playNext(true, 5000);
          console.log("playing next!");
          setInitialLoad(true);
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue, queueLoading, loading, initialLoad, currentUserLoading]);

  const followAdmin = () => {
    if (roomObj?._id !== undefined && refetchListeners !== undefined) {
      spotifyClient.getMyCurrentPlayingTrack().then((res) => {
        const currentSong = res.item;
        createRequest({
          variables: {
            song: currentSong?.uri,
            song_name: currentSong?.name,
            creator: userID,
            creator_name: displayName,
            creator_uri: user_image,
            image_uri: currentSong?.album.images[0].url,
            message: "",
            room_id: {
              link: roomObj._id,
            },
          },
        })
          .then((res) => {
            const next = res.data.insertOneRequest;
            dispatch(setPaused(false));
            dispatch(setNowPlaying(currentSong!));
            dispatch(setNowRequest(next));
            keepUser({
              variables: {
                id: userID,
                current_room: roomID + "_" + next._id,
              },
            }).then(() => {
              setTimeout(() => {
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
                  refetchListeners({
                    current_room: roomID + "_" + next._id,
                  })
                    .then((res) => {
                      console.log(res.data.users);
                      dispatch(setListeners(res.data.users));
                      const time = setTimeout(() => {
                        playNext(false, 500);
                        console.log("playing next!");
                      }, currentSong?.duration_ms!);
                      timeouts.push(time);
                    })
                    .catch((err) => {
                      console.log(err);
                    });
                });
              }, 10000);
            });
          })
          .catch((err) => {
            message.error(err);
          });
      });
    }
  };

  const playNext = (skip: boolean, timeout: number) => {
    refetch({
      id: {
        _id: roomID,
      },
    })
      .then((res) => {
        console.log(res);
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
                  dispatch(setPaused(false));
                  dispatch(setNowPlaying(songObj));
                  dispatch(setNowRequest(next));
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
                        current_room: roomID + "_" + next._id,
                      }).then((res) => {
                        console.log(res.data.users);
                        dispatch(setListeners(res.data.users));
                        const time = setTimeout(() => {
                          playNext(false, 500);
                          console.log("playing next!");
                        }, songObj?.duration_ms! - timeout);
                        timeouts.push(time);
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
        } else {
          if (currentUser.user.id === data.room.creator) {
            followAdmin();
          } else {
            console.log("nothing else to play");
            dispatch(setPaused(true));
            dispatch(setNowPlaying(undefined));
            dispatch(setNowRequest(undefined));
            mutateNonePlaying({
              variables: {
                id: roomID,
              },
            }).then(() => {
              dispatch(setListeners([]));
            });
          }
        }
      })
      .catch((err) => {
        console.log(err);
        dispatch(setPaused(true));
        dispatch(setNowPlaying(undefined));
        dispatch(setNowRequest(undefined));
      });
  };

  const togglePause = () => {
    if (paused) {
      spotifyClient
        .play()
        .then(() => {
          dispatch(setPaused(false));
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
                refetchRequest({ id: currentUserRequest })
                  .then((reqRes) => {
                    const song = reqRes.data.request.song.split(":")[2];
                    if (song === currentSong) {
                      spotifyClient.getTrack(song).then((songObj) => {
                        dispatch(setPaused(false));
                        dispatch(setNowPlaying(songObj));
                        dispatch(setNowRequest(reqRes.data.request));
                        const time = setTimeout(() => {
                          playNext(false, 500);
                          console.log("playing next!");
                        }, songObj?.duration_ms! - res.progress_ms! - 2000);
                        timeouts.push(time);
                      });
                    } else {
                      console.log("not current song");
                      soloUser(data);
                    }
                  })
                  .catch((err) => {
                    console.log(err);
                  });
              } else {
                console.log("current room null");
              }
            })
            .catch((err) => {
              console.log(err);
            });
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
          dispatch(setPaused(true));
          timeouts.forEach((time) => {
            clearTimeout(time);
          });
        })
        .catch(() => {
          message.info(
            "Please start playing music on a spotify connected device first!"
          );
        });
    }
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
            src={roomObj?.image_uri !== "" ? roomObj?.image_uri : logo}
            className="room-image"
            alt={roomObj?.name}
            preview={false}
          />
          <Text
            style={{
              color: "white",
              fontSize: 30,
              fontFamily: "Gotham-Medium",
            }}
          >
            {roomObj?.name}
          </Text>
        </Col>
        <Col className="App-header-right">
          <Image
            className="image-button icon-button"
            src={setting}
            alt="setting"
            preview={false}
            hidden={true}
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
              navigator.clipboard
                .writeText(window.location.toString())
                .then(() => {
                  message.info("Sharable Link Copied!");
                });
            }}
          />
        </Col>
      </Row>
      <Row className="App-content">
        <Col span={10}>
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
                    {nowRequest.message}
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
            {listeners.length === 1 && (
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
              </Row>
            )}
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
        {Search(spotifyClient, playNext)}
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
