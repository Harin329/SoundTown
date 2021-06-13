import React, { useEffect } from "react";
import { useSelector, useDispatch } from 'react-redux';
import { Typography, Row, Button } from "antd";
import { useHistory } from "react-router-dom";
import "./index.css";
import { getHashParams, removeHashParams } from "../../utils/hashUtils";
import { selectIsLoggedIn, selectTokenExpiryDate, setAccessToken, setLoggedIn, setTokenExpiryDate } from "../../reducer/authReducer";
import { getAuthorizeHref } from "../../oauthConfig";

const hashParams = getHashParams();
const access_token = hashParams.access_token;
const expires_in = hashParams.expires_in;
removeHashParams();

export default function Home() {
  const { Title } = Typography;
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const tokenExpiryDate = useSelector(selectTokenExpiryDate);
  const dispatch = useDispatch();
  const history = useHistory();

  useEffect(() => {
    if (access_token) {
      dispatch(setLoggedIn(true));
      dispatch(setAccessToken(access_token));
      dispatch(setTokenExpiryDate(Number(expires_in)));
      // dispatch(setUserProfileAsync(access_token));
    }
  })

  const authorizeSpotify = () => {
    window.open(getAuthorizeHref(), '_self')
  };

  const createRoom = () => {
    history.push('/createRoom');
  };

  return (
    <Row className="App">
      <div style={{ flexDirection: "row" }}>
        <Title style={{ color: "white" }}>Welcome to SoundTown!</Title>
        {!isLoggedIn &&
        <Button
          type="primary"
          shape="round"
          size="large"
          onClick={authorizeSpotify}
        >
          Authorize with Spotify
        </Button>}
        {isLoggedIn && <Button type="primary" shape="round" size="large" onClick={createRoom}>
          Create a Room
        </Button>}
      </div>
    </Row>
  );
}
