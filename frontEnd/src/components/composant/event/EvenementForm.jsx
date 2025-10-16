// src/components/event/EvenementForm.jsx
import { useState } from "react";
import { useAppContext } from "../../../views/AppContext";
import { evenementService } from "../../../service/Evenement.service";
import { FaMinus, FaPlus, FaPaperclip, FaTimes } from "react-icons/fa";

export const EvenementForm = ({ onCreated }) => {
  const { profile: user, dataServer = [] } = useAppContext();
  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Moyen");
  const [selectedAttachments, setSelectedAttachments] = useState([]);
  const [loading, setLoading] = useState(false);

  const canCreateEvent = user && ["Responsable", "Admin"].includes(user.statut);
  if (!canCreateEvent) {
    return (
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-center">
        Seuls les Responsable / administrateurs peuvent créer des événements.
      </div>
    );
  }

  // Fonction pour tronquer les noms de fichiers longs
  const truncateFileName = (fileName, maxLength = 20) => {
    if (fileName.length <= maxLength) return fileName;
    
    const extensionIndex = fileName.lastIndexOf('.');
    if (extensionIndex === -1) {
      return fileName.substring(0, maxLength - 3) + '...';
    }
    
    const name = fileName.substring(0, extensionIndex);
    const extension = fileName.substring(extensionIndex);
    
    if (name.length <= 10) return fileName;
    
    return name.substring(0, 10) + '...' + extension;
  };

  const toggleAttachment = (fileId) => {
    setSelectedAttachments((prev) =>
      prev.includes(fileId)
        ? prev.filter((i) => i !== fileId)
        : [...prev, fileId]
    );
  };

  const removeAttachment = (fileId) =>
    setSelectedAttachments((prev) => prev.filter((i) => i !== fileId));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim())
      return alert("Remplir titre et description.");
    setLoading(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        priority,
        attachments: selectedAttachments,
      };
      await evenementService.createAnnonce(payload);
      // reset
      setTitle("");
      setDescription("");
      setPriority("Moyen");
      setSelectedAttachments([]);
      setIsExpanded(false);
      onCreated && onCreated();
    } catch (err) {
      console.error("create annonce error", err);
      alert("Erreur lors de la création de l'événement.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 mb-6 overflow-hidden">

      <button
        onClick={() => setIsExpanded((v) => !v)}
        className="fixed bottom-6 right-6 bg-green-600 text-white p-4 rounded-full shadow-xl flex items-center justify-center hover:from-blue-700 hover:to-teal-700 hover:shadow-2xl transform hover:scale-105 transition-all duration-200 z-10"
        aria-label="Ajouter une publication"
      >
        { isExpanded ? <FaMinus className="w-6 h-6 mr-4" /> : <FaPlus className="w-6 h-6 mr-4" />}
          Créer un événement
      </button>

      {isExpanded && (
        <div className="p-5 border-t border-gray-100">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Nouvel événement</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Titre *
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 p-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="Titre de l'événement"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="mt-1 p-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="Décrivez votre événement..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priorité
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="mt-1 p-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              >
                <option value="Critique">Critique</option>
                <option value="Haute">Haute</option>
                <option value="Moyen">Moyen</option>
                <option value="Basse">Basse</option>
              </select>
            </div>

            {dataServer?.length > 0 && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <FaPaperclip className="mr-2 text-gray-500" />
                  Fichiers disponibles
                </label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {dataServer.map((f) => (
                    <button
                      key={f._id}
                      type="button"
                      onClick={() => toggleAttachment(f._id)}
                      className={`px-3 py-2 rounded-lg border transition-all flex items-center ${
                        selectedAttachments.includes(f._id)
                          ? "bg-blue-100 border-blue-500 text-blue-700"
                          : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                      title={f.name} // Tooltip avec le nom complet
                    >
                      <span className="truncate max-w-xs">
                        {truncateFileName(f.name)}
                      </span>
                    </button>
                  ))}
                </div>

                {selectedAttachments.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Fichiers sélectionnés :
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedAttachments.map((id) => {
                        const f = dataServer.find((x) => x._id === id);
                        return (
                          <div
                            key={id}
                            className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2 group"
                          >
                            <span className="text-sm text-blue-700 truncate max-w-xs" title={f?.name}>
                              {f ? truncateFileName(f.name) : id}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeAttachment(id)}
                              className="text-red-500 hover:text-red-700 transition"
                              title="Retirer ce fichier"
                            >
                              <FaTimes className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`px-5 py-2.5 rounded-lg text-white transition ${
                  loading 
                    ? "bg-gray-400 cursor-not-allowed" 
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {loading ? "Création en cours..." : "Créer l'événement"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};