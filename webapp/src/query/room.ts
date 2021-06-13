import gql from "graphql-tag";

export const FIND_ROOM = gql`
  query FindRoom($query: RoomQueryInput!) {
    room(query: $query) {
      _id
      creator
    }
  }
`;

export const CREATE_ROOM = gql`
  mutation CreateRoom() {
    insert_room(input: {
      _id: "party",
      creator: "harin",
    }) {
      returning {
        id
      }
    }
  }
`;
