import gql from "graphql-tag";

export const CREATE_ROOM = gql`
  mutation CreateRoom(
    $name: String!
    $creator: String!
    $admin: [String]
    $image_uri: String
  ) {
    insertOneRoom(
      data: {
        name: $name
        creator: $creator
        admin: $admin
        image_uri: $image_uri
      }
    ) {
      _id
      name
      creator
      admin
      image_uri
    }
  }
`;

export const UPDATE_ROOM = gql`
  mutation UpdateRoom(
    $id: ObjectId!
    $image_uri: String
  ) {
    updateOneRoom(
      query: { _id: $id }
      set: {
        image_uri: $image_uri
      }
    ) {
      _id
      name
      creator
      admin
      image_uri
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

export const NONE_PLAYING = gql`
  mutation NonePlaying($id: ObjectId!) {
    updateOneRoom(query: { _id: $id }, set: { now_playing_unset: true }) {
      _id
      admin
      creator
      image_uri
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
    rooms(sortBy: NAME_DESC, limit: 5) {
      _id
      admin
      creator
      image_uri
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
