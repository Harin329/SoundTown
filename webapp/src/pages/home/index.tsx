import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Typography, Row, Button, Image, Space } from "antd";
import { useHistory } from "react-router-dom";
import "./index.css";
import { getHashParams, removeHashParams } from "../../utils/hashUtils";
import {
  selectIsLoggedIn,
  setAccessToken,
  setLoggedIn,
  setTokenExpiryDate,
} from "../../reducer/authReducer";
import { getAuthorizeHref } from "../../oauthConfig";
import logo from "../../images/logo.png";
import create from "../../images/create.png";
import join from "../../images/join.png";

const hashParams = getHashParams();
const access_token = hashParams.access_token;
const expires_in = hashParams.expires_in;
removeHashParams();

export default function Home() {
  const { Title, Text } = Typography;
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const dispatch = useDispatch();
  const history = useHistory();

  useEffect(() => {
    if (access_token) {
      dispatch(setLoggedIn(true));
      dispatch(setAccessToken(access_token));
      dispatch(setTokenExpiryDate(Number(expires_in)));
    }
  });

  const authorizeSpotify = () => {
    window.open(getAuthorizeHref(), "_self");
  };

  const createRoom = () => {
    history.push("/createRoom");
  };

  const joinRoom = () => {
    history.push("/room/harin");
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
              icon={<Image src={create} width={40} preview={false}/>}
              onClick={createRoom}
            >
              Create a Room
            </Button>
            <Button
              className="button action-button"
              type="primary"
              shape="round"
              icon={<Image src={join} width={50} preview={false}/>}
              onClick={joinRoom}
            >
              Join a Room
            </Button>
          </Space>
        )}
      </Row>
    </Space>
  );
}
