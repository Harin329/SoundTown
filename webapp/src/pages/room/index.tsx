import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Typography, Row, Col, Space, Image, message } from "antd";
import "./index.css";
import { useHistory } from "react-router-dom";
import back from "../../images/back.png";
import setting from "../../images/setting.png";
import share from "../../images/share.png";
import logo from "../../images/logo.png";

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
  selectRoomID,
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
import Queue from "../../components/queue";
import { Request } from "../../types";
import NowPlaying from "../../components/now-playing";

export const timeouts: NodeJS.Timeout[] = [];

export default function Room() {
  const { Text } = Typography;
  const history = useHistory();
  const dispatch = useDispatch();
  const [firstLoad, setFirstLoad] = useState(false);
  let adminDelay = useRef(2000);

  const token = useSelector(selectAccessToken);
  const displayName = useSelector(selectDisplayName);
  const userID = useSelector(selectUID);
  const user_image = useSelector(selectImageURI);
  const roomObj = useSelector(selectRoomObj);

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
  const {
    data: currentUser,
    refetch: refetchUser,
    loading: userLoading,
  } = useQuery(GET_USER, {
    variables: {
      id: userID,
    },
  });
  const { refetch } = useQuery(GET_REQUEST);
  const { refetch: refetchQueue } = useQuery(GET_QUEUE, {
    variables: {
      id: {
        _id: roomID,
      },
    },
  });
  const [createRequest] = useMutation(CREATE_REQUEST);
  const [playRequest] = useMutation(PLAY_REQUEST);
  const [createUser] = useMutation(CREATE_USER);
  const [keepUser] = useMutation(USER_STAY);
  const [mutateNowPlaying] = useMutation(NOW_PLAYING);
  const [mutateNonePlaying] = useMutation(NONE_PLAYING);

  // Setup Room
  useEffect(() => {
    console.log("RUNNING 107 INITIAL LOAD");
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

  const soloUser = () => {
    console.log("RUNNING SOLOUSER");
    if (data.room.now_playing !== null) {
      const refetchNext = refetchListeners({
        current_room: roomID + "_" + data.room.now_playing._id,
      });
      if (refetchNext) {
        refetchNext
          .then((res) => {
            console.log(res.data);
            dispatch(setListeners(res.data.users));
            if (
              res.data.users.length === 0 ||
              res.data.users[0].id === userID
            ) {
              createUser({
                variables: {
                  id: userID,
                  user_image: user_image,
                  user_name: displayName,
                },
              }).then(() => {
                playNext(false, 5000);
              });
            } else {
              // Join in on current song
              refetchRequest({ id: data.room.now_playing._id }).then((res) => {
                const next = res.data.request as Request;
                const startTime = new Date(next.playedTime);
                const now = new Date();
                const timePlayed = now.getTime() - startTime.getTime();

                spotifyClient
                  .queue(next.song)
                  .then(() => {
                    spotifyClient
                      .getTrack(next.song.split(":")[2])
                      .then((songObj) => {
                        spotifyClient.skipToNext().then(() => {
                          spotifyClient.seek(timePlayed);
                        });
                        dispatch(setPaused(false));
                        dispatch(setNowPlaying(songObj));
                        dispatch(setNowRequest(next));
                        keepUser({
                          variables: {
                            id: userID,
                            current_room: roomID + "_" + next._id,
                          },
                        }).then(() => {
                          refetchQueue();
                          refetchListeners({
                            current_room: roomID + "_" + next._id,
                          }).then((res) => {
                            console.log(res.data.users);
                            dispatch(setListeners(res.data.users));
                            const time = setTimeout(() => {
                              playNext(false, 500);
                            }, songObj.duration_ms - timePlayed - 2000 + adminDelay.current);
                            timeouts.push(time);
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
              });
            }
          })
          .catch((err) => {
            console.log(err);
          });
      }
    } else {
      createUser({
        variables: {
          id: userID,
          user_image: user_image,
          user_name: displayName,
        },
      }).then(() => {
        playNext(true, 5000);
      });
    }
  };

  // Play Music on Entry
  useEffect(() => {
    if (roomObj !== undefined && !userLoading && !firstLoad) {
      console.log("RUNNING 207 EFFECT");
      console.log(roomObj);
      setFirstLoad(true);
      spotifyClient
        .getMyCurrentPlayingTrack()
        .then((res) => {
          const currentSong = res.item?.id;
          refetchUser().then((cUser) => {
            console.log(cUser.data);
            adminDelay.current = cUser.data.user.id === data.room.creator ? 0 : 2000
            if (
              cUser.data.user.current_room !== undefined &&
              cUser.data.user.current_room !== null &&
              cUser.data.user.current_room.split("_").length >= 1
            ) {
              const currentUserRequest =
                cUser.data.user.current_room.split("_")[1];
              refetchRequest({ id: currentUserRequest })
                .then((reqRes) => {
                  const song = reqRes.data.request.song.split(":")[2];
                  console.log(data);
                  // Continue Playing Song
                  if (
                    song === currentSong &&
                    data.room.now_playing !== undefined &&
                    data.room.now_playing !== null
                  ) {
                    spotifyClient.getTrack(song).then((songObj) => {
                      dispatch(setPaused(false));
                      dispatch(setNowPlaying(songObj));
                      dispatch(setNowRequest(reqRes.data.request));
                      console.log(roomID + "_" + data.room.now_playing._id);
                      refetchListeners({
                        current_room: roomID + "_" + data.room.now_playing._id,
                      }).then((res) => {
                        console.log(res.data);
                        dispatch(setListeners(res.data.users));
                      });
                      const time = setTimeout(() => {
                        playNext(false, 500);
                      }, songObj?.duration_ms! - res.progress_ms! - 2000 + adminDelay.current);
                      timeouts.push(time);
                    });
                  } else {
                    console.log("not current song");
                    soloUser();
                  }
                })
                .catch((err) => {
                  console.log(err);
                  soloUser();
                });
            } else {
              console.log("Nothing Playing In Current Room.");
              soloUser();
            }
          });
        })
        .catch((err) => {
          console.log(err);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomObj, userLoading]);

  const followAdmin = () => {
    console.log("RUNNING FOLLOW ADMIN");
    console.log(roomObj);
    if (roomObj?._id !== undefined && refetchListeners !== undefined) {
      spotifyClient.getMyCurrentPlayingTrack().then((res) => {
        const currentSong = res.item;
        const progress = res.progress_ms;
        if (currentSong) {
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
                mutateNowPlaying({
                  variables: {
                    id: roomID,
                    now_playing: {
                      link: next._id,
                    },
                  },
                });
                refetchListeners({
                  current_room: roomID + "_" + next._id,
                })
                  .then((res) => {
                    dispatch(setListeners(res.data.users));
                    console.log(currentSong);

                    const date = new Date();
                    playRequest({
                      variables: {
                        id: next._id,
                        playedTime: date.toISOString(),
                      },
                    });

                    const time = setTimeout(() => {
                      playNext(false, 500);
                    }, currentSong?.duration_ms! - progress! - 2000 + adminDelay.current);
                    timeouts.push(time);
                  })
                  .catch((err) => {
                    console.log(err);
                  });
              });
            })
            .catch((err) => {
              message.error(err);
            });
        } else {
          message.info("No Song Playing!");
        }
      });
    }
  };

  const playNext = (skip: boolean, timeout: number) => {
    console.log("PLAYING NEXT");
    const refetchNext = refetch({
      id: {
        _id: roomID,
      },
    });
    if (refetchNext) {
      refetchNext
        .then((res) => {
          const next = res.data.request;
          console.log(res);
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
                      if (
                        currentUser.user !== undefined &&
                        currentUser.user.id === data.room.creator
                      ) {
                        const date = new Date();
                        playRequest({
                          variables: {
                            id: next._id,
                            playedTime: date.toISOString(),
                          },
                        }).then(() => {
                          mutateNowPlaying({
                            variables: {
                              id: roomID,
                              now_playing: {
                                link: next._id,
                              },
                            },
                          });
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
                        }, songObj?.duration_ms! - timeout - 2000 + adminDelay.current);
                        timeouts.push(time);
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
            if (
              currentUser.user !== undefined &&
              currentUser.user.id === data.room.creator
            ) {
              setTimeout(() => {
                followAdmin();
              }, 5000);
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
        {NowPlaying(spotifyClient, playNext, soloUser)}
        {Search(spotifyClient, playNext)}
      </Row>
      {Queue()}
    </Space>
  );
}
