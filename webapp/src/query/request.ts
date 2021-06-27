import gql from "graphql-tag";

export const CREATE_REQUEST = gql`
  mutation CreateRequest(
    $song: String!
    $song_name: String!
    $creator: String
    $creator_name: String
    $creator_uri: String
    $image_uri: String
    $message: String
    $room_id: RequestRoom_idRelationInput!
  ) {
    insertOneRequest(
      data: {
        song: $song
        song_name: $song_name
        creator: $creator
        creator_name: $creator_name
        creator_uri: $creator_uri
        image_uri: $image_uri
        message: $message
        room_id: $room_id
        played: false
      }
    ) {
      _id
      song
      song_name
      creator
      creator_name
      creator_uri
      image_uri
      message
      played
      room_id {
        _id
      }
    }
  }
`;

export const PLAY_REQUEST = gql`
  mutation PlayRequest(
    $id: ObjectId!
  ) {
    updateOneRequest(
      query: {
        _id: $id
      },
      set: {
        played: true
      }
    ) {
      _id
      song
      song_name
      creator
      creator_name
      creator_uri
      image_uri
      message
      played
      room_id {
        _id
      }
    }
  }
`;

export const GET_REQUEST = gql`
  query GetNextRequest($id: RoomQueryInput!) {
    request(query: { played: false, room_id: $id }) {
      _id
      song
      song_name
      creator
      creator_name
      creator_uri
      image_uri
      message
      played
      room_id {
        _id
      }
    }
  }
`;

export const GET_QUEUE = gql`
  query GetQueue($id: RoomQueryInput!) {
    requests(query: { played: false, room_id: $id }, limit: 6) {
      _id
      song
      song_name
      creator
      creator_name
      creator_uri
      image_uri
      message
      played
      room_id {
        _id
      }
    }
  }
`;
