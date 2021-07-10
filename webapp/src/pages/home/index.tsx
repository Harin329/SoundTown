import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Typography, Row, Button, Image, Space, message } from "antd";
import { useHistory } from "react-router-dom";
import "./index.css";
import { getHashParams, removeHashParams } from "../../utils/hashUtils";
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
import { useQuery } from "@apollo/client";
import { setRoomID } from "../../reducer/roomReducer";
import { GET_ANY_ROOM } from "../../query/room";
import SpotifyWebApi from "spotify-web-api-js";

const hashParams = getHashParams();
const access_token = hashParams.access_token;
const expires_in = hashParams.expires_in;
removeHashParams();

export default function Home() {
  const { Title, Text } = Typography;
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const dispatch = useDispatch();
  const history = useHistory();
  const client = new SpotifyWebApi();
  client.setAccessToken(access_token);

  const { loading, data } = useQuery(GET_ANY_ROOM);

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
          message.info("User is not authorized to use SoundTown!");
          dispatch(setLoggedIn(false));
        });
    }
  });

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
    if (!loading) {
      dispatch(setRoomID(roomID));
      history.push("/room/" + roomID);
    }
  };

  return (
    <Space className="App" size={"large"}>
      <Image src={logo} width={200} preview={false} />
      <Title style={{ color: "white" }}>Welcome to SoundTown!</Title>
      <Text style={{ color: "white", fontSize: 18 }}>
        Create and join music party rooms to listen to music with friends and
        discover new songs!
      </Text>
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
              className="button action-button"
              type="primary"
              shape="round"
              icon={<Image src={create} width={40} preview={false} />}
              onClick={createRoom}
            >
              Create a Room
            </Button>
            <Button
              className="button action-button"
              type="primary"
              shape="round"
              icon={<Image src={join} width={50} preview={false} />}
              onClick={() => joinRoom(data.rooms[0]._id)}
            >
              Join a Room
            </Button>
          </Space>
        )}
      </Row>
    </Space>
  );
}
