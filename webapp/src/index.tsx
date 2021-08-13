import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { BrowserView, MobileView } from "react-device-detect";
import "dotenv/config";
import { ApolloProvider } from "@apollo/client";
import { store } from "./store/index";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { client } from "./apollo/apollo";
import "./fonts/Gotham-Book.otf";

ReactDOM.render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      <Provider store={store}>
        <BrowserView>
          <App />
        </BrowserView>
        <MobileView>
          <h3 style={{ color: "white", margin: 20, textAlign: "center" }}>
            This app does not support mobile view yet, please visit on a
            desktop!
          </h3>
        </MobileView>
      </Provider>
    </ApolloProvider>
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
