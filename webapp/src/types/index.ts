export interface Request {
  _id: string;
  song: string;
  song_name: string;
  creator: string;
  creator_name: string;
  creator_uri: string;
  image_uri: string;
  message: string;
  room_id?: any;
  played: boolean;
  playedTime: Date;
}

export interface Room {
  _id: string;
  admin: string[];
  creator: string;
  image_uri: string;
  name: string;
  now_playing: Request;
}

export interface User {
  _id: string;
  id: string;
  current_room?: string;
  user_image: string;
  user_name: string;
}

export interface playNextFunc {
  (skip: boolean, timeout: number): void;
}

export interface soloUserFunc {
  (): void;
}