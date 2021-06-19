import React, { useState } from "react";
import { Button, Input, Space } from "antd";
import "./index.css";
import { useHistory } from "react-router-dom";
import { useMutation } from "@apollo/client";
import gql from "graphql-tag";

export default function CreateRoom() {
  const history = useHistory();
  const [roomName, setRoomName] = useState("");

  const editName = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRoomName(e.target.value);
  };

  const [createRoom] = useMutation(gql`
    mutation CreateRoom($name: String!, $creator: String!, $admin: String, $image_uri: String, $listeners: [String]) {
      insertOneRoom(data: { name: $name, creator: $creator, admin: $admin, image_uri: $image_uri, listeners: $listeners }) {
        name
        creator
        admin
        image_uri
        listeners
      }
    }
  `);

  function startRoom() {
    // Create Room in Mongo
    createRoom({
      variables: {
        name: "test",
        creator: "Some New Title",
        admin: "harin",
        image_uri: "",
        listeners: [],
      },
    })
    // Get Created Room ID
    // history.push("/room/" + roomName);
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
