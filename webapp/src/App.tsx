import { FC } from "react";
import { BrowserRouter as Router, Route } from "react-router-dom";
import CreateRoom from "./pages/createRoom";
import Home from "./pages/home";
import JoinRoom from "./pages/joinRoom";
import Room from "./pages/room";

const App: FC = () => (
  <Router>
    <Route exact path="/" component={Home} />
    <Route exact path="/createRoom" component={CreateRoom} />
    <Route exact path="/room" component={JoinRoom} />
    <Route exact path="/room/:id" component={Room} />
  </Router>
);

export default App;
