import { useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Typography, Row, Col, Button, Image, Space, message } from "antd";
import { useHistory } from "react-router-dom";
import "./index.css";
import {
  getHashID,
  getHashParams,
  removeHashParams,
} from "../../utils/hashUtils";
import {
  selectIsLoggedIn,
  setAccessToken,
  setDisplayName,
  setImageURI,
  setLoggedIn,
  setTokenExpiryDate,
  setUID,
} from "../../reducer/authReducer";
import { getAuthorizeHref } from "../../oauthConfig";
import logo from "../../images/logo.png";
import create from "../../images/create.png";
import join from "../../images/join.png";
import { setRoomID } from "../../reducer/roomReducer";
import SpotifyWebApi from "spotify-web-api-js";
import Coffee from "../../components/coffee";

const hashParams = getHashParams();
const access_token = hashParams.access_token;
const expires_in = hashParams.expires_in;
const roomID = getHashID();
if (roomID) {
  // Go to room
  localStorage.setItem("roomID", roomID);
  window.history.pushState(
    "room/" + roomID,
    document.title,
    window.location.pathname + window.location.search
  );
} else if (window.location.hash.startsWith("#access_token=")) {
  removeHashParams();
}

export default function Home() {
  const { Title, Text } = Typography;
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const dispatch = useDispatch();
  const history = useHistory();
  const client = useMemo(() => {
    const spotifyClient = new SpotifyWebApi();
    spotifyClient.setAccessToken(access_token);
    return spotifyClient;
  }, []);

  useEffect(() => {
    if (access_token) {
      dispatch(setLoggedIn(true));
      dispatch(setAccessToken(access_token));
      dispatch(setTokenExpiryDate(Number(expires_in)));

      client
        .getMe()
        .then((res) => {
          dispatch(setDisplayName(res.display_name!));
          dispatch(setUID(res.id));

          if (res.images !== undefined && res.images.length > 0) {
            dispatch(setImageURI(res.images![0].url));
          }
        })
        .catch((err) => {
          console.log(err);
          message.config({ maxCount: 1 });
          message.info("User is not authorized to use SoundTown!");
          dispatch(setLoggedIn(false));
        });
    }
  }, [client, dispatch]);

  useEffect(() => {
    const ID = localStorage.getItem("roomID");

    if (ID) {
      joinRoom(ID);
    }
  });

  const authorizeSpotify = () => {
    window.open(getAuthorizeHref(), "_self");
  };

  const createRoom = () => {
    history.push("/createRoom");
  };

  const joinRoom = (roomID: string) => {
    dispatch(setRoomID(roomID));
    history.push("/room/" + roomID);
  };

  const browseRoom = () => {
    history.push("/joinRoom");
  };

  return (
    <Space className="App-home" size={"large"}>
      <Image src={logo} width={200} preview={false} />
      <Title style={{ color: "white" }}>Welcome to SoundTown.</Title>
      <Row justify="space-between">
        <Col span={6}>
          <Row justify="center">
            <Text style={{ color: "white", fontSize: 18, fontWeight: 'bold' }}>Spotify Rooms</Text>
            <Text style={{ color: "white", fontSize: 14 }}>
              Create and join music rooms on SoundTown to listen with anyone. All you need is a unique link to join.
            </Text>
          </Row>
        </Col>
        <Col span={6}>
          <Row justify="center">
            <Text style={{ color: "white", fontSize: 18, fontWeight: 'bold' }}>Queue Requests</Text>
            <Text style={{ color: "white", fontSize: 14 }}>
              Host your own radio station, where others can send song
              requests along with personalized messages.
            </Text>
          </Row>
        </Col>
        <Col span={6}>
          <Row justify="center">
            <Text style={{ color: "white", fontSize: 18, fontWeight: 'bold' }}>Sync Songs</Text>
            <Text style={{ color: "white", fontSize: 14 }}>
              No requests queued? Let your inner DJ shine as music syncs with the host's now playing.
            </Text>
          </Row>
        </Col>
      </Row>
      <Space size={"small"}> </Space>
      <Row>
        {!isLoggedIn && (
          <Button
            type="primary"
            shape="round"
            size="large"
            className="button"
            onClick={authorizeSpotify}
          >
            Authorize with Spotify
          </Button>
        )}
        {isLoggedIn && (
          <Space size={"middle"}>
            <Button
              className="button home-action-button"
              type="primary"
              shape="round"
              icon={<Image src={create} width={50} preview={false} />}
              onClick={createRoom}
            >
              Create
            </Button>
            <Space style={{ width: 50 }}> </Space>
            <Button
              className="button home-action-button"
              type="primary"
              shape="round"
              icon={<Image src={join} width={60} preview={false} />}
              onClick={() => browseRoom()}
            >
              Join
            </Button>
          </Space>
        )}
      </Row>
      <Space size={"middle"}> </Space>
      {Coffee()}
    </Space>
  );
}
