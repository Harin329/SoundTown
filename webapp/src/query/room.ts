import gql from "graphql-tag";

export const CREATE_ROOM = gql`
  mutation CreateRoom(
    $name: String!
    $creator: String!
    $admin: String
    $image_uri: String
    $listeners: [String]
  ) {
    insertOneRoom(
      data: {
        name: $name
        creator: $creator
        admin: $admin
        image_uri: $image_uri
        listeners: $listeners
      }
    ) {
      _id
      name
      creator
      admin
      image_uri
      listeners
    }
  }
`;

export const NOW_PLAYING = gql`
  mutation NowPlaying($id: ObjectId!, $now_playing: RoomNow_playingRelationInput!) {
    updateOneRoom(query: { _id: $id }, set: { now_playing: $now_playing }) {
      _id
      admin
      creator
      image_uri
      listeners
      name
      now_playing {
        _id
        creator
        message
        song
      }
    }
  }
`;

export const GET_ROOM = gql`
  query GetRoom($id: ObjectId!) {
    room(query: { _id: $id }) {
      _id
      admin
      creator
      image_uri
      listeners
      name
      now_playing {
        _id
        creator
        message
        song
      }
    }
  }
`;

export const GET_ANY_ROOM = gql`
  query {
    rooms(sortBy: NAME_DESC, limit: 1) {
      _id
    }
  }
`;
