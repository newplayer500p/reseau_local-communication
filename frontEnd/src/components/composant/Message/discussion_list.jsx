import { FaPlus } from "react-icons/fa";
import { useOutletContext } from "react-router-dom";

export default function DiscussionList() {
  const {
    profile,
    showCreate,
    setShowCreate,
    orderedRooms,
    formatDateFR,
    handleJoinRoom,
    handleCreateRoom,
    newTitle,
    newDesc,
    newPassword,
    setNewTitle,
    setNewDesc,
    setNewPassword,
    handleDeleteRoom, // Utilisez la fonction du contexte au lieu de l'API directe
  } = useOutletContext();

  // Ajoutez cette fonction pour afficher le statut de la salle
  const roomStatus = (room) => {
    return room.isPrivate ? "🔒" : "🔓";
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <header className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold dark:text-gray-100">
          Salons de discussion
        </h1>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2">{profile.statut}</label>
          {(profile.statut === "Responsable" || profile.statut === "Admin") && (
            <button
              onClick={() => setShowCreate(true)}
              className="fixed bottom-6 right-6 bg-green-600 text-white p-4 rounded-full shadow-xl flex items-center justify-center hover:from-blue-700 hover:to-teal-700 hover:shadow-2xl transform hover:scale-105 transition-all duration-200 z-10"
              aria-label="Ajouter une publication"
            >
              <FaPlus className="w-6 h-6 mr-4" /> Créer un groupe de discussion
            </button>
          )}
        </div>
      </header>

      {/* create modal (simple) */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div
            className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-2xl transform transition-all duration-300 animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                Créer un groupe de discussion
              </h3>
              <button
                onClick={() => setShowCreate(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="flex flex-col gap-4">
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Titre du salon
                </label>
                <input
                  id="title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Nommez votre salon"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Décrivez le sujet de ce salon"
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all resize-none"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Mot de passe (optionnel)
                </label>
                <input
                  id="password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mot de passe pour accéder au salon"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                />
              </div>

              <div className="flex gap-3 justify-end mt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 transition-all shadow-md"
                >
                  Créer le salon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-1 gap-10">
        {[...orderedRooms].map((r) => (
          <div
            key={r.id}
            className="border border-gray-300 dark:border-gray-700 rounded p-4 shadow-sm bg-white dark:bg-gray-800"
          >
            <div className="flex justify-between items-start">
              <div>
                <h2 className="font-semibold text-lg dark:text-gray-50">
                  {r.title} {roomStatus(r)}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {r.description}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Créé par: {r.createdBy} · {formatDateFR(r.createdAt)}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleJoinRoom(r.id)}
                  className="px-3 py-1 bg-blue-600 text-white rounded shadow-sm"
                >
                  Rejoindre
                </button>
                {/* si Responsable/admin donner edit or delete */}
                {profile.statut === "Responsable" &&
                  profile.email === r.createdBy && (
                    <button
                      onClick={() => {
                        if (confirm("Supprimer ce salon ?")) {
                          handleDeleteRoom(r.id);
                        }
                      }}
                      className="px-3 py-1 bg-red-200 text-red-800 rounded"
                    >
                      Supprimer
                    </button>
                  )}
              </div>
            </div>
          </div>
        ))}

        {[...orderedRooms].length === 0 && (
          <div className="m-auto">Aucun salon disponnible pour le moment</div>
        )}
      </div>
    </div>
  );
}
