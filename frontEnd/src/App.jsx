// App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import PageAccueil from "./views/initiale/page_acceuille";
import Login from "./views/initiale/login";
import SignUp from "./views/initiale/signUp";
import DashboardLayout from "./views/DashBoardLayout";
import Profil from "./components/composant/profil";
import DiscussionList from "./components/composant/Message/discussion_list";
import Discussion_page from "./components/composant/Message/discussion_page";
import Discussion from "./components/composant/navigation/layoutDiscussion";
import { AppContext } from "./views/AppContext";
import { useState, useEffect } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { api, API_BASE, setAccessToken } from "./service/axios.service";
import { fileService } from "./service/fileService";
import MonFichier from "./components/composant/navigation/monFichier";
import { QuizSection } from "./components/composant/navigation/QuizSection";
import { EvenementList } from "./components/composant/navigation/EvenementList";
import PublicationFile from "./components/composant/navigation/publicationFIle";
import AdminUsersDashboard from "./components/composant/navigation/admin";

const STORAGE_USER = "user";
const API = API_BASE; // adapte si besoin

const DEFAULT_PROFILE = {
  avatarUrl: "/profil.png",
  nom: "",
  email: "____",
  statut: "____",
  description: "____",
};

function App() {
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [state, setState] = useState(true);
  const [dataServer, setDataServer] = useState([]);

  const [tokenState, setTokenState] = useState(
    localStorage.getItem("accessToken")
  );

  // récupérer les fichiers à chaque changement de token
  useEffect(() => {
    if (!tokenState) return;

    (async () => {
      try {
        const res = await fileService.getFiles(); // Utiliser le service
        setDataServer(res.data.files || []);
      } catch (err) {
        console.warn("Erreur fetch fichiers:", err);
        setDataServer([]);
      }
    })();
  }, [tokenState]);

  // après login ou signup
  const handleLogin = (newToken) => {
    localStorage.setItem("accessToken", newToken);
    setTokenState(newToken); // déclenche useEffect
    setAccessToken(newToken);
  };

  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    if (!token) return;

    (async () => {
      try {
        const res = await api.get(`${API}/user/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = res.data;
        if (!data) return;

        const mapped = {
          avatarUrl: data.avatar
            ? `${API}/${data.avatar.replace(/\\/g, "/")}`
            : DEFAULT_PROFILE.avatarUrl,
          nom: data.nom ?? DEFAULT_PROFILE.nom,
          email: data.email ?? DEFAULT_PROFILE.email,
          statut: data.status ?? DEFAULT_PROFILE.statut,
          description: data.description ?? DEFAULT_PROFILE.description,
        };

        setProfile(mapped);
      } catch (err) {
        console.warn(err);
      }
    })();
  }, [state]); // run once au montage

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      console.log("No token available for SSE connection");
      return;
    }

    const es = new EventSource(`/events?token=${token}`);

    es.onopen = () => {
      console.log("SSE connection successfully established");
    };

    // Écouter le bon événement
    es.addEventListener("files-changed", async (event) => {
      try {
        console.log("Files changed event received:", event.data);
        const res = await fileService.getFiles();
        setDataServer(res.data.files || []);
      } catch (err) {
        console.error("Error refreshing files:", err);
      }
    });

    es.addEventListener("anonces-changed", async (event) => {
      try{
        const data = JSON.parse(event.data);
        console.log("Changement d'annonce detecer: ", data);
        
        // Déclencher un événement personnalisé pour que EvenementList puisse réagir
        window.dispatchEvent(
          new CustomEvent("anonces-changed", { detail: data })
        );
      } catch(err){
        console.log("erreur du changement d'annonce: ", err )
      }
    })

    es.addEventListener("rooms-changed", async (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Rooms changed event received:", data);

        // Déclencher un événement personnalisé pour que DiscussionLayout puisse réagir
        window.dispatchEvent(
          new CustomEvent("rooms-changed", { detail: data })
        );
      } catch (err) {
        console.error("Error processing rooms-changed event:", err);
      }
    });

    es.onerror = () => {
      console.error("SSE connection error");
    };

    return () => {
      es.close();
    };
  }, [tokenState]);

  return (
    <BrowserRouter>
      <ToastContainer
        position="top-right" // coin haut droit
        autoClose={3000} // 3s
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        pauseOnHover
        draggable
      />
      <AppContext.Provider
        value={{
          profile,
          dataServer,
          setDataServer,
          STORAGE_USER,
          state,
          setState,
          handleLogin,
        }}
      >
        <Routes>
          <Route path="/" element={<PageAccueil />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signUp" element={<SignUp />} />

          {/* Dashboard avec menu fixe */}
          <Route path="/dashboardGenerale/*" element={<DashboardLayout />}>
            <Route index element={<EvenementList />} />

            <Route path="publicationFile" element={<PublicationFile />} />

            <Route path="discussions" element={<Discussion />}>
              <Route index element={<DiscussionList />} />
              <Route path=":roomId" element={<Discussion_page />} />
            </Route>

            <Route path="depot" element={<MonFichier />} />
            <Route path="autre" element={<QuizSection/>} />
            <Route path="profil" element={<Profil />} />
            <Route
              path="*"
              element={
                <div className="flex flex-1 justify-center items-center">
                  404 Not found
                </div>
              }
            />

            {
              profile.statut === "Admin" && <Route path="admin" element={<AdminUsersDashboard/>} />
            }
            
          </Route>


          <Route
            path="*"
            element={
              <div className="flex flex-1 justify-center items-center">
                404 Not found
              </div>
            }
          />
        </Routes>
      </AppContext.Provider>
    </BrowserRouter>
  );
}

export default App;
