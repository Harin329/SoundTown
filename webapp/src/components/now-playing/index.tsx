import { Row, Col, Image, Typography, message } from "antd";
import { useDispatch, useSelector } from "react-redux";
import SpotifyWebApi from "spotify-web-api-js";
import play from "../../images/play.png";
import pause from "../../images/pause.png";
import skip from "../../images/skip.png";
import {
  isRoomPaused,
  selectNowPlaying,
  selectNowRequest,
  selectRoomID,
  selectRoomListeners,
  setNowPlaying,
  setNowRequest,
  setPaused,
} from "../../reducer/roomReducer";
import "./index.css";
import { useQuery } from "@apollo/client";
import { GET_USER } from "../../query/user";
import { selectUID } from "../../reducer/authReducer";
import { GET_REQUEST_BY_ID } from "../../query/request";
import { playNextFunc, soloUserFunc } from "../../types";
import { timeouts } from "../../pages/room";
import { getAuthorizeHref } from "../../oauthConfig";

export default function NowPlaying(
  spotifyClient: SpotifyWebApi.SpotifyWebApiJs,
  playNext: playNextFunc,
  soloUser: soloUserFunc,
) {
  const { Title, Text } = Typography;
  const dispatch = useDispatch();

  const paused = useSelector(isRoomPaused);
  const nowPlaying = useSelector(selectNowPlaying);
  const nowRequest = useSelector(selectNowRequest);
  const listeners = useSelector(selectRoomListeners);
  const userID = useSelector(selectUID);
  const roomID = useSelector(selectRoomID);

  const { data: currentUser } = useQuery(GET_USER, {
    variables: {
      id: userID,
    },
  });
  const { refetch: refetchRequest } = useQuery(GET_REQUEST_BY_ID);

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
                const refetchNext = refetchRequest({ id: currentUserRequest });
                if (refetchNext) {
                  refetchNext
                    .then((reqRes) => {
                      const song = reqRes.data.request.song.split(":")[2];
                      if (song === currentSong) {
                        spotifyClient.getTrack(song).then((songObj) => {
                          dispatch(setPaused(false));
                          dispatch(setNowPlaying(songObj));
                          dispatch(setNowRequest(reqRes.data.request));
                          const time = setTimeout(() => {
                            playNext(false, 500);
                          }, songObj?.duration_ms! - res.progress_ms! - 2000);
                          timeouts.push(time);
                        }).catch((err: SpotifyWebApi.ErrorObject) => {
                          console.log(err.response);
                          if (err.status === 401) {
                            window.open(getAuthorizeHref(), "_self");
                          }
                        });
                      } else {
                        console.log("not current song");
                        soloUser();
                      }
                    })
                    .catch((err) => {
                      console.log(err);
                    });
                }
              } else {
                console.log("current room null");
              }
            })
            .catch((err: SpotifyWebApi.ErrorObject) => {
              console.log(err.response);
              if (err.status === 401) {
                window.open(getAuthorizeHref(), "_self");
              }
            });
        })
        .catch((err: SpotifyWebApi.ErrorObject) => {
          console.log(err.response);
          if (err.status === 401) {
            window.open(getAuthorizeHref(), "_self");
          } else {
            message.info("Please start playing music on a spotify connected device first!");
          }
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
        .catch((err: SpotifyWebApi.ErrorObject) => {
          console.log(err.response);
          if (err.status === 401) {
            window.open(getAuthorizeHref(), "_self");
          } else {
            message.info("Please start playing music on a spotify connected device first!");
          }
        });
    }
  };

  const skipSong = () => {
    console.log("skipping");
    timeouts.forEach((time) => {
      clearTimeout(time);
    });
    // Need to do something so everyone skips
  }

  return (
    <Col span={10}>
      {nowPlaying !== undefined && nowRequest !== undefined && nowRequest.room_id?._id === roomID && (
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
                className="resultName"
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
              <Row justify="space-between">
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
                hidden={true}
              />
              <Image
                src={skip}
                style={{
                  width: 40,
                  height: 40,
                }}
                className="image-button"
                alt={"skip"}
                preview={false}
                onClick={skipSong}
                hidden={true}
              />
              </Row>
            </Col>
          </Row>
        </Col>
      )}
      {(nowPlaying === undefined || nowRequest === undefined || nowRequest.room_id?._id !== roomID) && (
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
  );
}
