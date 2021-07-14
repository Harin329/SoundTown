import { useDispatch } from "react-redux";
import { Typography, Row, Button, Image, Space } from "antd";
import { useHistory } from "react-router-dom";
import "./index.css";
import { useQuery } from "@apollo/client";
import { setRoomID } from "../../reducer/roomReducer";
import { GET_ANY_ROOM } from "../../query/room";
import { Room } from "../../types";

export default function JoinRoom() {
  const { Title } = Typography;
  const dispatch = useDispatch();
  const history = useHistory();

  const { loading, data } = useQuery(GET_ANY_ROOM);

  const joinRoom = (roomID: string) => {
    if (!loading) {
      dispatch(setRoomID(roomID));
      history.push("/room/" + roomID);
    }
  };

  return (
    <Space className="App" size={"large"}>
      <Title style={{ color: "white" }}>Recent SoundTown Rooms</Title>
      <Row>
        {!loading &&
          data.rooms.map((res: Room) => (
            <Button
              key={res._id}
              className="button action-button"
              type="primary"
              shape="round"
              icon={
                <Image
                  style={{ borderRadius: 100, objectFit: "cover" }}
                  src={res.image_uri}
                  width={100}
                  height={100}
                  preview={false}
                />
              }
              onClick={() => joinRoom(res._id)}
            >
              {res.name}
            </Button>
          ))}
      </Row>
    </Space>
  );
}
