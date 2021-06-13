import * as Realm from "realm-web";
import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";

const app = new Realm.App(process.env.REACT_APP_MONGO_APP_ID!);

async function getValidAccessToken() {
  if (!app.currentUser) {
    await app.logIn(Realm.Credentials.anonymous());
  } else {
    await app.currentUser.refreshCustomData();
  }
  return app.currentUser?.accessToken
}

export const client = new ApolloClient({
  link: new HttpLink({
    uri: process.env.REACT_APP_GRAPHQL_URI,
    fetch: async (uri, options) => {
      const accessToken = await getValidAccessToken();
      const headersInit: HeadersInit = {};
      options!.headers = headersInit;
      options!.headers.Authorization = `Bearer ${accessToken}`;
      return fetch(uri, options);
    },
  }),
  cache: new InMemoryCache()
});