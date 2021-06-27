import gql from "graphql-tag";

export const CREATE_USER = gql`
  mutation CreateUser(
    $id: String!
    $current_room: String!
    $user_image: String
    $user_name: String
  ) {
    upsertOneUser(
      query: { id: $id }
      data: {
        id: $id
        current_room: $current_room
        user_image: $user_image
        user_name: $user_name
      }
    ) {
      _id
      id
      current_room
      user_image
      user_name
    }
  }
`;

export const USER_STAY = gql`
  mutation UserStay($id: String!, $current_room: String!) {
    updateOneUser(query: { id: $id }, set: { current_room: $current_room }) {
      _id
      id
      current_room
      user_image
      user_name
    }
  }
`;

export const GET_USER = gql`
  query GetUser($id: String!) {
    user(query: { id: $id }) {
      _id
      id
      current_room
      user_image
      user_name
    }
  }
`;

export const GET_USER_IN_ROOM = gql`
  query GetUserInRoom($current_room: String!) {
    users(query: { current_room: $current_room }, limit: 1000000) {
      _id
      id
      current_room
      user_image
      user_name
    }
  }
`;
