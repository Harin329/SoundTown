import { useMutation, useQuery } from "@apollo/client";
import { Row, Col, Image, Typography } from "antd";
import { useSelector } from "react-redux";
import { GET_QUEUE, PLAY_REQUEST } from "../../query/request";
import { selectRoomObj } from "../../reducer/roomReducer";
import "./index.css";
import close from "../../images/close.png";
import { Request } from "../../types";
import { selectUID } from "../../reducer/authReducer";

export default function Queue() {
  const { Title, Text } = Typography;

  const roomObj = useSelector(selectRoomObj);
  const userID = useSelector(selectUID);

  const { loading: queueLoading, data: queue, refetch: refetchQueue } = useQuery(GET_QUEUE, {
    variables: {
      id: {
        _id: roomObj?._id,
      },
    },
    pollInterval: 5000,
  });
  const [playRequest] = useMutation(PLAY_REQUEST);

  const removeFromQueue = (requestObj: Request) => {
    console.log("Removing song: " + requestObj.song_name)
    const date = new Date();
    playRequest({
      variables: {
        id: requestObj._id,
        playedTime: date.toISOString(),
      },
    }).then(() => {
      refetchQueue();
    })
  };

  return (
    <Row className="App-footer">
      <Title level={5} style={{ color: "white" }}>
        Next Up
      </Title>
      <Col
        style={{
          flexDirection: "row",
          flex: 1,
          display: "flex",
          justifyContent: "space-evenly",
        }}
      >
        {!queueLoading &&
          queue !== undefined &&
          queue.requests.map((res: Request) => {
            return (
              <Row align="middle" key={res._id}>
                <Image
                  src={res.image_uri}
                  className="nextsong-image"
                  alt={res.song}
                  preview={false}
                />
                <Col>
                  <Title
                    className="resultName"
                    level={5}
                    style={{
                      color: "white",
                      width: 100,
                    }}
                  >
                    {res.song_name}
                  </Title>
                  <Text
                    className="resultName"
                    style={{
                      color: "white",
                      width: 100,
                      fontSize: 12
                    }}
                  >
                    {res.creator_name}'s Request
                  </Text>
                </Col>
                <Image
                    className="image-button"
                    src={close}
                    hidden={userID !== roomObj?.creator}
                    style={{ width: 30, height: 30 }}
                    alt={"Close"}
                    preview={false}
                    onClick={() => {
                      removeFromQueue(res);
                    }}
                  />
              </Row>
            );
          })}
      </Col>
    </Row>
  );
}
