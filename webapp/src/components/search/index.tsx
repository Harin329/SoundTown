import { useEffect, useState } from "react";
import { Button, Col, Row, Typography, Input, Image, message, List } from "antd";
import "./index.css";
import close from "../../images/close.png";
import SpotifyWebApi from "spotify-web-api-js";
import { useDispatch, useSelector } from "react-redux";
import {
  selectNowPlaying,
  selectRoomObj,
  setListeners,
  setNowPlaying,
  setNowRequest,
  setPaused,
} from "../../reducer/roomReducer";
import { useMutation, useQuery } from "@apollo/client";
import { CREATE_REQUEST, GET_QUEUE, PLAY_REQUEST } from "../../query/request";
import {
  selectDisplayName,
  selectImageURI,
  selectUID,
} from "../../reducer/authReducer";
import { GET_USER_IN_ROOM, USER_STAY } from "../../query/user";
import { NOW_PLAYING } from "../../query/room";
import { timeouts } from "../../pages/room";
import Modal from "antd/lib/modal/Modal";

interface playNextFunc {
  (skip: boolean, timeout: number): void;
}

export default function Search(spotifyClient: SpotifyWebApi.SpotifyWebApiJs, playNext: playNextFunc) {
  const { Title, Text } = Typography;
  const { TextArea } = Input;
  const dispatch = useDispatch();

  const displayName = useSelector(selectDisplayName);
  const userID = useSelector(selectUID);
  const user_image = useSelector(selectImageURI);
  const roomObj = useSelector(selectRoomObj);
  const nowPlaying = useSelector(selectNowPlaying);

  const [query, setQuery] = useState("");
  const [queueMessage, setQueueMessage] = useState("");
  const [queuedSong, setQueuedSong] = useState<SpotifyApi.TrackObjectFull>();
  const [searchResult, setSearchResult] = useState<
    SpotifyApi.TrackObjectFull[] | undefined
  >([]);
  const [more, setMore] = useState(false);

  const { refetch: refetchQueue } = useQuery(GET_QUEUE);
  const { refetch: refetchListeners } = useQuery(GET_USER_IN_ROOM);
  const [createRequest] = useMutation(CREATE_REQUEST);
  const [playRequest] = useMutation(PLAY_REQUEST);
  const [keepUser] = useMutation(USER_STAY);
  const [mutateNowPlaying] = useMutation(NOW_PLAYING);

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

  const playNow = (
    songObj: SpotifyApi.TrackObjectFull | undefined,
    requestObj: any
  ) => {
    spotifyClient.getMyCurrentPlaybackState().then((state) => {
      if (state.is_playing) {
        spotifyClient
          .queue(songObj!.uri)
          .then(() => {
            dispatch(setPaused(false));
            dispatch(setNowPlaying(songObj));
            dispatch(setNowRequest(requestObj));
            keepUser({
              variables: {
                id: userID,
                current_room: roomObj?._id + "_" + requestObj._id,
              },
            }).then(() => {
              playRequest({
                variables: {
                  id: requestObj._id,
                },
              }).then(() => {
                mutateNowPlaying({
                  variables: {
                    id: roomObj?._id,
                    now_playing: {
                      link: requestObj._id,
                    },
                  },
                }).then(() => {
                  refetchListeners({
                    current_room: roomObj?._id + "_" + requestObj._id,
                  }).then((u: any) => {
                    dispatch(setListeners(u.data.users));
                  });
                });
                refetchQueue({
                  id: {
                    _id: roomObj?._id,
                  }
                });
                spotifyClient.skipToNext();
              });

              const time = setTimeout(() => {
                playNext(false, 500);
                console.log("playing next!");
              }, songObj?.duration_ms! - 5000);
              timeouts.push(time);
            });
          })
          .catch((err) => {
            console.log(err);
            message.info(
              "Please start playing music on a spotify connected device first!"
            );
          });
      } else {
        spotifyClient
          .play()
          .then(() => {
            spotifyClient
              .queue(songObj!.uri)
              .then(() => {
                setPaused(false);
                setNowPlaying(songObj);
                setNowRequest(requestObj);
                keepUser({
                  variables: {
                    id: userID,
                    current_room: roomObj?._id + "_" + requestObj._id,
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
                          id: roomObj?._id,
                          now_playing: {
                            link: requestObj._id,
                          },
                        },
                      });
                    }
                    refetchQueue({
                      id: {
                        _id: roomObj?._id,
                      }
                    });
                  });
                  spotifyClient.skipToNext();

                  const time = setTimeout(() => {
                    playNext(false, 500);
                    console.log("playing next!");
                  }, songObj?.duration_ms! - 5000);
                  timeouts.push(time);
                });
              })
              .catch((err) => {
                console.log(err);
                message.info(
                  "Please start playing music on a spotify connected device first!"
                );
              });
          })
          .catch((err) => {
            console.log(err);
            message.info(
              "Please start playing music on a spotify connected device first!"
            );
          });
      }
    });
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
          link: roomObj?._id,
        },
      },
    })
      .then((res) => {
        // Get Created Request ID
        // const requestID = res.data.insertOneRequest._id;

        if (!nowPlaying) {
          playNow(queuedSong, res.data.insertOneRequest);
        } else {
          refetchQueue({
            id: {
              _id: roomObj?._id,
            }
          });
        }

        setQueuedSong(undefined);
        setQueueMessage("");
      })
      .catch((err) => {
        message.error(err);
      });
  };

  return (
    <Col className="App-request" span={14}>
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
              className="resultBlock"
              style={{
                width: "25%",
                height: 250,
                alignItems: "start",
                display: "flex",
                flexDirection: "column",
              }}
              onClick={() => {
                setMore(!more);
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
                alt={roomObj?.image_uri}
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
      {more && (
        <Modal
          title="Search Results"
          centered
          visible={more}
          width={"80%"}
          onCancel={() => setMore(false)}
          bodyStyle={{ backgroundColor: "#0A3E03" }}
          maskStyle={{ backgroundColor: "black", opacity: 0.8 }}
          footer={null}
        >
          <List
            grid={{
              gutter: 16,
              xs: 0,
              sm: 0,
              md: 0,
              lg: 0,
              xl: 0,
              xxl: 7,
            }}
            dataSource={searchResult}
            renderItem={(res) => (
              <List.Item>
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
                    setMore(false);
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
              </List.Item>
            )}
          />
        </Modal>
      )}
    </Col>
  );
}
