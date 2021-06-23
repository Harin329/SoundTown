import gql from "graphql-tag";

export const CREATE_REQUEST = gql`
  mutation CreateRequest(
    $song: String!
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
        creator: $creator
        creator_name: $creator_name
        creator_uri: $creator_uri
        image_uri: $image_uri
        message: $message
        room_id: $room_id
      }
    ) {
      _id
    }
  }
`;

export const GET_REQUEST = gql`
  query GetRequest($id: ObjectId!) {
    request(query: { _id: $id }) {
      _id
      song
      creator
      creator_name
      creator_uri
      image_uri
      message
      room_id {
        _id
      }
    }
  }
`;