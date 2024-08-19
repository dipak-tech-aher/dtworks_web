import React, { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AppContext } from "../AppContext";
import AppLayout from "./Layout/AppLayout";

const PrivateRoute = ({ component: Component, layout: Layout, base, ...rest }) => {
  const { auth } = useContext(AppContext);
  const isAuthenticated = !!auth?.accessToken;
  const location = useLocation()
  rest = {
    ...rest,
    location
  }
  return (
    isAuthenticated ?
      <AppLayout isAuthenticated={isAuthenticated}>
        {Layout ?
          <Layout>
            <Component key={new Date().getTime()} {...rest} />
          </Layout> :
          <Component key={new Date().getTime()} {...rest} />
        }
      </AppLayout> : <Navigate to='/user/login' />
  )
}

const PublicRoute = ({ component: Component, ...rest }) => {
  return (
    <Component key={new Date().getTime()} {...rest} />
  )
}

export { PrivateRoute, PublicRoute };
