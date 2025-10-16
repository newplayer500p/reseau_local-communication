import React, { useMemo, useState} from "react";
import { FaTrash } from "react-icons/fa";
import { useOutletContext } from "react-router-dom";
import { fileService } from "../../../service/fileService";

export default function MonFichier() {
  const { dataServer = [], profile = {}, setDataServer } = useOutletContext();
  const [searchTerm, setSearchTerm] = useState("");

  // Fonction de formatage
  function formatBytes(bytes) {
    if (!bytes) return "0 B";
    const units = ["B", "KB", "MB", "GB", "TB"];
    let i = 0;
    let v = bytes;
    while (v >= 1024 && i < units.length - 1) {
      v /= 1024;
      i++;
    }
    return `${Math.round(v * 100) / 100} ${units[i]}`;
  }

  // Fonction pour supprimer un fichier
  async function handleDelete(fileId) {
    if (!window.confirm("Voulez-vous vraiment supprimer ce fichier ?")) return;
    try {
      const res = await fileService.deleteFile(fileId);
      if (res.status === 200) {
        const filesRes = await fileService.getFiles();
        setDataServer(filesRes.data.files || []);
      } else {
        alert("Impossible de supprimer le fichier.");
      }
    } catch (err) {
      console.error("Erreur suppression:", err);
      alert("Erreur lors de la suppression.");
    }
  }

  // Filtrer les fichiers de l'utilisateur courant + recherche
  const filteredFiles = useMemo(() => {
    if (!Array.isArray(dataServer)) return [];
    
    return dataServer
      .filter(file => file.email === profile?.email)
      .filter(file => 
        file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [dataServer, profile, searchTerm]);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 dark:text-gray-50">
      <main className="flex-1 p-2 overflow-y-auto">
        <header className="flex justify-between items-center border-b border-gray-300 dark:border-gray-800 mb-8 pb-4 py-2">
          <h1 className="text-2xl font-bold">Mes fichiers</h1>
          <input
            type="text"
            placeholder="Rechercher mes fichiers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-1 border border-gray-300 dark:border-gray-700 rounded h-12 w-1/2"
          />
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredFiles.length === 0 ? (
            <p>Aucun fichier publié.</p>
          ) : (
            filteredFiles.map((file) => (
              <div
                key={file._id}
                className="bg-white dark:bg-gray-800 p-4 rounded shadow relative"
              >
                <button
                  onClick={() => handleDelete(file._id)}
                  className="absolute top-2 right-2 p-1 text-red-500 hover:text-red-700"
                  title="Supprimer le fichier"
                >
                  <FaTrash size={16} />
                </button>

                <h3 className="font-bold text-xl font-mono">{file.name}</h3>
                <p className="text-sm text-gray-700 dark:text-gray-200">
                  {file.description}
                </p>
                <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">
                  {file.date} {file.heure}
                </p>
                <a
                  href={fileService.downloadFile(file.storedName)}
                  download
                  className="inline-block mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm"
                >
                  Télécharger ({formatBytes(file.size)})
                </a>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}