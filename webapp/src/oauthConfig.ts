const endpoint = "https://accounts.spotify.com/authorize";

const scope = [
  "user-read-private",
  "user-read-email",
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-currently-playing",
  "ugc-image-upload",
  "user-read-recently-played",
  "user-top-read",
  "user-read-playback-position",
  "playlist-modify-public",
  "playlist-modify-private",
  "playlist-read-private",
  "playlist-read-collaborative",
];

export const getAuthorizeHref = (): string => {
  const clientID = process.env.REACT_APP_CLIENT_ID;
  const redirectURI = process.env.REACT_APP_REDIRECT_URI;
  return `${endpoint}?client_id=${clientID}&redirect_uri=${redirectURI}&scope=${scope.join(
    "%20"
  )}&response_type=token`;
};
