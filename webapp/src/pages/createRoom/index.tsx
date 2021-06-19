import React, { useState } from "react";
import { Typography, Button, Input, Space, Image, Upload, message } from "antd";
import "./index.css";
import { endpoint } from "../../constants";
import { useHistory } from "react-router-dom";
import { LoadingOutlined, PlusOutlined } from "@ant-design/icons";
import { RcFile, UploadChangeParam } from "antd/lib/upload";

export default function CreateRoom() {
  const { Title, Text } = Typography;
  const history = useHistory();
  const [roomID, setRoomID] = useState("");
  const [adminURL, setAdminURL] = useState("");
  const [shareURL, setShareURL] = useState("");
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageURL] = useState<string | ArrayBuffer | null>();

  const editName = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRoomID(e.target.value);
    if (e.target.value !== "") {
      setAdminURL(endpoint + e.target.value + "-admin");
      setShareURL(endpoint + e.target.value);
    } else {
      setAdminURL("");
      setShareURL("");
    }
  };

  function startRoom() {
    history.push("/room/" + roomID);
  }

  function getBase64(img: RcFile, callback: (_: string | ArrayBuffer | null) => void) {
    const reader = new FileReader();
    reader.addEventListener("load", () => callback(reader.result));
    reader.readAsDataURL(img);
  }

  function beforeUpload(file: any) {
    const isJpgOrPng = file.type === "image/jpeg" || file.type === "image/png";
    if (!isJpgOrPng) {
      message.error("You can only upload JPG/PNG file!");
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error("Image must smaller than 2MB!");
    }
    return isJpgOrPng && isLt2M;
  }

  function handleChange(info: UploadChangeParam) {
    if (info.file.status === "uploading") {
      setLoading(true);
      return;
    }
    if (info.file.status === "done") {
      // Get this url from response in real world.
      getBase64(info.file.originFileObj!, (imageUrl: string | ArrayBuffer | null) => {
        setImageURL(imageUrl);
        setLoading(false);
      });
    }
  }

  function uploadImage(file: RcFile) {
    console.log("uploaded");

    return Promise.resolve("ok");
  }

  return (
    <Space className="App" size={"large"}>
      <Upload
        name="avatar"
        listType="picture-card"
        className="avatar-uploader"
        showUploadList={false}
        action={uploadImage}
        beforeUpload={beforeUpload}
        onChange={handleChange}
      >
        {imageUrl ? (
          <Image src={imageUrl.toString()} />
        ) : (
          <div>
            {loading ? <LoadingOutlined /> : <PlusOutlined />}
            <div style={{ marginTop: 8 }}>Upload</div>
          </div>
        )}
      </Upload>
      <Input
        className="input"
        placeholder="Enter Party Name"
        onChange={editName}
      />
      <Title level={3} style={{ color: "white" }}>
        Admin URL:
        <Text
          style={{
            color: "white",
            fontSize: 18,
            fontFamily: "Gotham-Light",
            marginLeft: 10,
            verticalAlign: "middle",
          }}
        >
          {adminURL}
        </Text>
      </Title>
      <Title level={3} style={{ color: "white" }}>
        Listener URL:
        <Text
          style={{
            color: "white",
            fontSize: 18,
            fontFamily: "Gotham-Light",
            marginLeft: 10,
            verticalAlign: "middle",
          }}
        >
          {shareURL}
        </Text>
      </Title>
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
