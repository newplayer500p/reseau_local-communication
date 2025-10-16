import React, { useEffect, useState } from "react";
import { FiMoon, FiSun, FiCalendar, FiMessageSquare, FiBook, FiAward } from "react-icons/fi";
import { Link } from "react-router-dom";

export default function PageAccueil() {
  const [darkMode, setDarkMode] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState(navigator.onLine);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Mise à jour de l'heure en temps réel
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Gestion des changements de connexion
  useEffect(() => {
    const handleConnectionChange = () => {
      setOnlineStatus(navigator.onLine);
    };

    window.addEventListener("online", handleConnectionChange);
    window.addEventListener("offline", handleConnectionChange);
    
    return () => {
      window.removeEventListener("online", handleConnectionChange);
      window.removeEventListener("offline", handleConnectionChange);
    };
  }, []);

  // Application du thème sombre
  useEffect(() => {
    const htmlElement = document.documentElement;
    if (darkMode) {
      htmlElement.classList.add("dark");
    } else {
      htmlElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Formatage de l'heure
  const formatTime = (date) => date.toLocaleTimeString();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 transition-colors flex flex-col justify-center">
      {/* En-tête */}
      <header className="w-full justify-between py-5 mx-auto flex items-center px-4">
        <h1 className="text-xl font-semibold text-center flex-1">Plateforme Collaborative</h1>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setDarkMode(prev => !prev)}
            aria-label="Changer le thème"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow"
          >
            {darkMode ? <FiMoon size={18} title="Mode sombre"/> : <FiSun size={18} title="Mode clair"/>}
            <span className="text-sm">Thème</span>
          </button>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="max-w-6xl mx-auto px-4 flex-1 flex flex-col gap-8 py-8">
        {/* Section d'introduction */}
        <section className="text-center py-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Votre plateforme collaborative et de communication local</h2>
          <p className="mb-8 text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Découvrez un espace unique pour annoncer vos événements, partager des publications, 
            discuter en temps réel et participer à des quiz interactifs.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/login" className="px-6 py-3 rounded-md bg-blue-600 text-white shadow hover:bg-blue-700 transition-colors">
              Se connecter
            </Link>
            <Link to="/signUp" className="px-6 py-3 rounded-md bg-green-600 text-white shadow hover:bg-green-700 transition-colors">
              Créer un compte
            </Link>
          </div>
        </section>

        {/* Section des fonctionnalités */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 py-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="text-blue-500 mb-4 flex justify-center">
              <FiCalendar size={32} />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-center">Événements</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Annoncez et participez à des événements. Ne manquez plus aucune activité importante.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="text-purple-500 mb-4 flex justify-center">
              <FiBook size={32} />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-center">Publications</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Partagez vos idées, articles et ressources avec la communauté.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="text-green-500 mb-4 flex justify-center">
              <FiMessageSquare size={32} />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-center">Discussions</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Échangez en temps réel dans des salons de discussion thématiques.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="text-yellow-500 mb-4 flex justify-center">
              <FiAward size={32} />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-center">Quiz</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Testez vos connaissances avec nos quiz interactifs et amusants.
            </p>
          </div>
        </section>
      </main>

      {/* Pied de page */}
      <footer className="w-full mx-auto px-4 py-6">
        <div className="w-full bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <h3 className="text-sm font-medium mb-2">Contact & Aide</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                email: hajamirado10@gmail.com<br/>
                tél: +261 33 78 838 25 | +261 32 77 751 74
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Statut réseau</h3>
              <p className="text-sm">
                Connecté: <span className={`font-semibold ${onlineStatus ? 'text-green-600' : 'text-red-500'}`}>
                  {onlineStatus ? 'Oui' : 'Non'}
                </span>
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Horaire du serveur</h3>
              <p className="text-sm">{formatTime(currentTime)}</p>
            </div>
          </div>

          <div className="text-center text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-100 dark:border-gray-700">
            © {new Date().getFullYear()} Plateforme Collaborative — Espace d'échange et de partage
          </div>
        </div>
      </footer>
    </div>
  );
}