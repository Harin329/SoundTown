import React, { useState } from "react";
import { Button, Input, message, Space } from "antd";
import "./index.css";
import { useHistory } from "react-router-dom";
import { useMutation } from "@apollo/client";
import { CREATE_ROOM } from "../../query/room";
import { setRoomID } from "../../reducer/roomReducer";
import { useDispatch, useSelector } from "react-redux";
import { selectImageURI, selectUID } from "../../reducer/authReducer";

export default function CreateRoom() {
  const history = useHistory();
  const dispatch = useDispatch();
  const [roomName, setRoomName] = useState("");
  const userID = useSelector(selectUID);
  const userImg = useSelector(selectImageURI);

  const editName = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRoomName(e.target.value);
  };

  const [createRoom] = useMutation(CREATE_ROOM);

  function startRoom() {
    // Create Room in Mongo
    createRoom({
      variables: {
        name: roomName,
        creator: userID,
        admin: [userID],
        image_uri: userImg,
      },
    }).then((res) => {
      // Get Created Room ID
      const roomID = res.data.insertOneRoom._id
      dispatch(setRoomID(roomID));
      history.push("/room/" + roomID);
    }).catch((err) => {
      message.error(err);
    });
  }

  return (
    <Space className="App" size={"large"}>
      <Input
        className="input"
        placeholder="Enter Party Name"
        onChange={editName}
        style={{border: 0}}
      />
      <Button
        className="button create-button"
        type="primary"
        shape="round"
        onClick={startRoom}
      >
        Get The Party Started!
      </Button>
    </Space>
  );
}
