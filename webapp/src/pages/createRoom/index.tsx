import React, { useState } from "react";
import { Button, Input, message, Space } from "antd";
import "./index.css";
import { useHistory } from "react-router-dom";
import { useMutation } from "@apollo/client";
import { CREATE_ROOM } from "../../query/room";
import { setRoomID } from "../../reducer/roomReducer";
import { useDispatch } from "react-redux";

export default function CreateRoom() {
  const history = useHistory();
  const dispatch = useDispatch();
  const [roomName, setRoomName] = useState("");

  const editName = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRoomName(e.target.value);
  };

  const [createRoom] = useMutation(CREATE_ROOM);

  function startRoom() {
    // Create Room in Mongo
    createRoom({
      variables: {
        name: roomName,
        creator: "",
        admin: "",
        image_uri: "",
        listeners: [],
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
