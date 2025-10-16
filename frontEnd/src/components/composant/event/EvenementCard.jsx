// src/components/event/EvenementCard.jsx
import { useState } from "react";
import { fileService } from "../../../service/fileService";

export const EvenementCard = ({ evenement, onDelete, currentUser, dataServer = [] }) => {
  const [deleting, setDeleting] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const priorityBadge = {
    Critique: { bg: "bg-red-600", text: "text-white" },
    Haute: { bg: "bg-orange-500", text: "text-white" },
    Moyen: { bg: "bg-yellow-400", text: "text-black" },
    Basse: { bg: "bg-green-500", text: "text-white" },
  };

  const p = evenement.priority ? (evenement.priority.charAt(0).toUpperCase() + evenement.priority.slice(1)) : "Moyen";
  const badge = priorityBadge[p] || priorityBadge.Moyen;

  const authorName = evenement.createdBy?.name || evenement.createdBy?.email || (typeof evenement.createdBy === "string" ? evenement.createdBy : "Anonyme");
  const dateStr = new Date(evenement.publishedAt || evenement.createdAt || evenement.publishedAt || Date.now()).toLocaleString();

  const resolvedAttachments = (evenement.attachments || []).map(att => {
    if (!att) return null;
    if (typeof att === "object" && att.storedName) return att;
    if (typeof att === "string") {
      const found = dataServer?.find(f => f._id === att || f.storedName === att);
      if (found) return found;
      return { _id: att, name: `Fichier (${att})`, storedName: null };
    }
    return null;
  }).filter(Boolean);

  const canDelete = currentUser.email === evenement.createdBy.email;

  const handleDelete = async () => {
    if (!onDelete) return;
    if (!window.confirm("Confirmer la suppression de cet événement ?")) return;
    try {
      setDeleting(true);
      await onDelete(evenement._id);
    } finally {
      setDeleting(false);
    }
  };

  const handleDownload = async (file) => {
    setDownloading(true);
    try {
      // Utiliser une méthode de téléchargement programmatique
      const response = await fetch(fileService.downloadFile(file.storedName), {
        credentials: 'include' // Inclure les cookies d'authentification
      });
      
      if (!response.ok) {
        throw new Error('Échec du téléchargement');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = file.name || file.originalName || "download";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erreur de téléchargement:', error);
      alert('Erreur lors du téléchargement');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="p-4 rounded-lg border shadow-sm bg-white">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-1 rounded text-xs font-semibold ${badge.bg} ${badge.text}`}>
              {p}
            </span>
            <h3 className="text-lg font-semibold">{evenement.title}</h3>
          </div>
          <p className="text-gray-700 mb-2">{evenement.description}</p>
          <p className="text-sm text-gray-500">Par: <span className="font-medium text-gray-700">{authorName}</span></p>
          <p className="text-sm text-gray-400">{dateStr}</p>

          {resolvedAttachments.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {resolvedAttachments.map(file => (
                file.storedName ? (
                  <button
                    key={file._id}
                    onClick={() => handleDownload(file)}
                    disabled={downloading}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors disabled:bg-blue-300"
                  >
                    {downloading ? "Téléchargement..." : (file.name || file.originalName || "Télécharger")}
                  </button>
                ) : (
                  <span key={file._id} className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                    {file.name}
                  </span>
                )
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className={`text-sm rounded px-3 py-1 ${deleting ? "bg-gray-300 text-gray-600" : "bg-red-100 text-red-700 hover:bg-red-200"}`}
            >
              {deleting ? "Suppression..." : "Supprimer"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};