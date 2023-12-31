import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import React, { useContext } from "react";
import { AuthProvider, AuthContext } from "./contexts/auth";

import Sidebar from "./components/Sidebar/Sidebar";

// Imports das Paginas
import Home from "./pages/Home/Home";
import Login from "./pages/Login/Login";
import EditUser from "./pages/EditUser/[id]";
import Records from "./pages/Records/Records";
import UsersList from "./pages/UsersList/UsersList";
import VisualizarDoc from "./pages/VisualizarDocs/VisualizarDoc";
import Process from "./pages/Process/Process";
import Perfil from "./pages/Perfil/Perfil";
import Navbar from "./components/Navbar/Navbar";
const AppRoutes = () => {
  // Private pages
  const Private = ({ children }) => {
    const { authenticated, loading } = useContext(AuthContext);
    // Se estiver no login, mostra carregando
    if (loading) {
      return <div className="loading">Carregando...</div>;
    }
    // Se não tiver authenticado não sai da dela de login
    if (!authenticated) {
      return <Navigate to="/login" />;
    }
    return children;
  };

  return (
    // React router dom
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            exact
            path="/"
            element={
              <Private>
                <Navbar />
                <Sidebar />
                <Home />
              </Private>
            }
          />

          <Route
            exact
            path="/editar-usuario/:id"
            element={
              <Private>
                <Navbar />
                <Sidebar />
                <EditUser />
              </Private>
            }
          />
          <Route
            exact
            path="/users-list-system"
            element={
              <Private>
                <Navbar />
                <Sidebar />
                <UsersList />
              </Private>
            }
          />
          <Route
            exact
            path="/list-prontuarios-pdf"
            element={
              <Private>
                <Navbar />
                <Sidebar />
                <Records />
              </Private>
            }
          />
          <Route
            exact
            path="/docs-process-pdf"
            element={
              <Private>
                <Navbar />
                <Sidebar />
                <Process />
              </Private>
            }
          />
          <Route
            exact
            path="/visualizar-documento/:id"
            element={
              <Private>
                <Navbar />
                <Sidebar />
                <VisualizarDoc />
              </Private>
            }
          />
          <Route
            exact
            path="/perfil/:id"
            element={
              <Private>
                <Navbar />
                <Sidebar />
                <Perfil />
              </Private>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default AppRoutes;
