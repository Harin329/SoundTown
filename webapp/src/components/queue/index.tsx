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

  const {
    loading: queueLoading,
    data: queue,
    refetch: refetchQueue,
  } = useQuery(GET_QUEUE, {
    variables: {
      id: {
        _id: roomObj?._id,
      },
    },
    pollInterval: 5000,
  });
  const [playRequest] = useMutation(PLAY_REQUEST);

  // Poll to keep up, may be required for group skipping
  // const [currentReq, setCurrentReq] = useState<Request | undefined>(undefined);
  // const { loading, data } = useQuery(GET_ROOM, {
  //   variables: { id: roomObj?._id },
  //   pollInterval: 10000,
  // });
  // const playSong = (next: Request) => {
  //   console.log("PLAYING SPECIFIC NEXT");
  //   spotifyClient
  //     .queue(next.song)
  //     .then(() => {
  //       spotifyClient.getTrack(next.song.split(":")[2]).then((songObj) => {
  //         spotifyClient.skipToNext();
  //         dispatch(setPaused(false));
  //         dispatch(setNowPlaying(songObj));
  //         dispatch(setNowRequest(next));
  //         keepUser({
  //           variables: {
  //             id: userID,
  //             current_room: roomID + "_" + next._id,
  //           },
  //         }).then(() => {
  //           if (
  //             currentUser.user !== undefined &&
  //             currentUser.user.id === data.room.creator
  //           ) {
  //             const grandTime = setTimeout(() => {
  //               const date = new Date();
  //               playRequest({
  //                 variables: {
  //                   id: next._id,
  //                   playedTime: date.toISOString(),
  //                 },
  //               }).then(() => {
  //                 mutateNowPlaying({
  //                   variables: {
  //                     id: roomID,
  //                     now_playing: {
  //                       link: next._id,
  //                     },
  //                   },
  //                 });
  //                 refetchQueue();
  //                 refetchListeners({
  //                   current_room: roomID + "_" + next._id,
  //                 }).then((res) => {
  //                   console.log(res.data.users);
  //                   dispatch(setListeners(res.data.users));
  //                   const time = setTimeout(() => {
  //                     playNext(false, 500);
  //                   }, songObj?.duration_ms! - 10000 - adminDelay.current);
  //                   timeouts.push(time);
  //                 });
  //               });
  //             }, 10000);
  //             timeouts.push(grandTime);
  //           } else {
  //             refetchQueue();
  //             refetchListeners({
  //               current_room: roomID + "_" + next._id,
  //             }).then((res) => {
  //               console.log(res.data.users);
  //               dispatch(setListeners(res.data.users));
  //               const time = setTimeout(() => {
  //                 playNext(false, 500);
  //               }, songObj?.duration_ms! - 2000 - adminDelay.current);
  //               timeouts.push(time);
  //             });
  //           }
  //         });
  //       });
  //     })
  //     .catch((err) => {
  //       console.log(err);
  //       message.info(
  //         "Please start playing music on a spotify connected device first!"
  //       );
  //     });
  // };
  // useEffect(() => {
  //   console.log(currentReq)
  //   console.log(data);
  //   if (!loading && data !== undefined && data.room.now_playing !== null) {
  //     if (currentReq !== undefined) {
  //       if (currentReq._id !== data.room.now_playing._id) {
  //         timeouts.forEach((time) => {
  //           clearTimeout(time);
  //         });
  //         playSong(data.room.now_playing)
  //         setCurrentReq(data.room.now_playing);
  //       }
  //     } else {
  //       setCurrentReq(data.room.now_playing);
  //     }
  //   }
  // // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [data]);

  const removeFromQueue = (requestObj: Request) => {
    console.log("Removing song: " + requestObj.song_name);
    const date = new Date();
    playRequest({
      variables: {
        id: requestObj._id,
        playedTime: date.toISOString(),
      },
    }).then(() => {
      refetchQueue();
    });
  };

  return (
    <Row className="App-footer">
      <Title level={5} style={{ color: "white" }}>
        {(queue === undefined || queue.requests.length === 0) ? "No songs queued, following room creator's now playing" : "Next Up"}
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
                      fontSize: 12,
                    }}
                  >
                    {res.creator_name}'s Request
                  </Text>
                </Col>
                <Image
                  className="image-button"
                  src={close}
                  hidden={(userID !== roomObj?.creator && userID !== res.creator)}
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
