import { useQuery } from "@apollo/client";
import { Row, Col, Image, Typography } from "antd";
import { useSelector } from "react-redux";
import { GET_QUEUE } from "../../query/request";
import { selectRoomObj } from "../../reducer/roomReducer";
import "./index.css";

export default function Queue() {
  const { Title } = Typography;

  const roomObj = useSelector(selectRoomObj);

  const { loading: queueLoading, data: queue } = useQuery(GET_QUEUE, {
    variables: {
      id: {
        _id: roomObj?._id,
      },
    },
    pollInterval: 5000,
  });

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
          queue.requests.map((res: any) => {
            return (
              <Row align="middle" key={res._id}>
                <Image
                  src={res.image_uri}
                  className="nextsong-image"
                  alt={res.song}
                  preview={false}
                />
                <Title
                  level={5}
                  style={{
                    color: "white",
                    marginTop: 10,
                  }}
                >
                  {res.song_name}
                </Title>
              </Row>
            );
          })}
      </Col>
    </Row>
  );
}
