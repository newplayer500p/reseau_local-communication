import React, { useState } from "react";
import {
  FaPlus,
  FaTimes,
  FaUpload,
  FaFile,
  FaUser,
  FaCalendarAlt,
  FaRulerVertical,
} from "react-icons/fa";
import { useAppContext } from "../../../views/AppContext";
import { fileService } from "../../../service/fileService";

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

function detectLogicalType(file) {
  if (!file) return "AUTRE";
  const mime = (file.type || "").toLowerCase();
  const name = (file.name || "").toLowerCase();

  const compressRegex =
    /\.(tar\.gz|tar\.bz2|tar\.xz|tar\.zst|tar|tgz|taz|zip|rar|7z|gz|xz|bz2|zst)$/i;
  const installerRegex = /\.(apk|exe|msi|deb|rpm|pkg|dmg|bin|sh|run)$/i;

  // CSV
  if (
    mime === "text/csv" ||
    mime === "application/csv" ||
    mime === "application/vnd.ms-excel" ||
    name.endsWith(".csv")
  ) {
    return "CSV";
  }

  // XML
  if (
    mime === "application/xml" ||
    mime === "text/xml" ||
    name.endsWith(".xml")
  ) {
    return "XML";
  }

  // Text / MD
  if (
    mime === "text/plain" ||
    mime === "text/markdown" ||
    name.endsWith(".txt") ||
    name.endsWith(".md")
  ) {
    return "TEXTE";
  }

  // Archives
  if (
    compressRegex.test(name) ||
    mime === "application/zip" ||
    mime.includes("compressed") ||
    mime.includes("x-7z") ||
    mime.includes("x-rar")
  ) {
    return "COMPRESSER";
  }

  // Installers
  if (
    installerRegex.test(name) ||
    mime === "application/vnd.android.package-archive" ||
    mime === "application/x-msdownload" ||
    mime.includes("executable") ||
    mime.includes("x-msdos-program")
  ) {
    return "INSTALLER";
  }

  // images / video / audio checks
  if (
    mime.startsWith("image/") ||
    /\.(png|jpg|jpeg|gif|webp|bmp|svg)$/i.test(name)
  )
    return "IMAGE";
  if (
    mime.startsWith("video/") ||
    /\.(mp4|mov|mkv|webm|avi|flv|wmv)$/i.test(name)
  )
    return "VIDEO";
  if (mime.startsWith("audio/") || /\.(mp3|wav|ogg|m4a|flac|aac)$/i.test(name))
    return "AUDIO";

  return "AUTRE";
}

export default function CreatePublication() {
  // profile via Outlet context (si fourni)
  const { setDataServer, profile } = useAppContext();
  const author = profile.nom;

  const [addPublication, setAddPublication] = useState(false);

  // form state
  const [file, setFile] = useState(null);
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [fileInputKey, setFileInputKey] = useState(Date.now());

  const todayDate = new Date().toISOString().split("T")[0];
  const nowTime = () =>
    new Date().toLocaleTimeString("fr-FR", { hour12: false });

  function handleOpen() {
    setAddPublication(true);
  }

  function resetForm() {
    setFile(null);
    setName("");
    setType("");
    setDescription("");
    setFileInputKey(Date.now());
  }

  function handleFileChange(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);

    // auto name if empty
    if (!name) setName(f.name);

    // detect type
    const logical = detectLogicalType(f);
    setType(logical);
  }

  function buildFormData(file, name, description) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", name);
    formData.append("type", type);
    formData.append("description", description);
    return formData;
  }

  // Modifier la fonction handleSubmit
  async function handleSubmit(e) {
    e?.preventDefault();

    if (!file || !name.trim() || !description.trim()) {
      alert("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    try {
      const formData = buildFormData(file, name, description);
      const res = await fileService.uploadFile(formData); // Utiliser le service

      if (res.status === 201) {
        // fetch à jour des fichiers depuis le serveur
        const filesRes = await fileService.getFiles();
        setDataServer(filesRes.data.files || []);

        resetForm();
        setAddPublication(false);
      } else {
        console.error("Erreur upload fichier:", res);
        alert("Erreur lors de l'upload. Veuillez réessayer.");
      }
    } catch (err) {
      console.error("Erreur upload:", err);
      alert("Erreur lors de l'upload. Vérifiez votre connexion ou le token.");
    }
  }

  // publish enabled only if file chosen and required fields provided
  const canPublish = Boolean(file && name.trim() && description.trim());

  return (
    <>
      <button
        onClick={handleOpen}
        className="fixed bottom-6 right-6 bg-green-600 text-white p-4 rounded-full shadow-xl flex items-center justify-center hover:from-blue-700 hover:to-teal-700 hover:shadow-2xl transform hover:scale-105 transition-all duration-200 z-10"
        aria-label="Ajouter une publication"
      >
        <FaPlus className="w-6 h-6 mr-4" /> Publier un Fichier
      </button>

      {addPublication && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-t-2xl">
              <div>
                <h3 className="text-xl font-bold">Nouvelle publication</h3>
                <p className="text-sm opacity-90">
                  Partagez un document avec la communauté
                </p>
              </div>
              <button
                onClick={() => {
                  resetForm();
                  setAddPublication(false);
                }}
                aria-label="Fermer"
                className="p-2 rounded-full hover:bg-white/20 transition"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* File input */}
              {file == null && (
                <div className="text-center">
                  <input
                    id="file-upload"
                    key={fileInputKey}
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    aria-label="Choisir un fichier"
                  />
                  <label
                    htmlFor="file-upload"
                    className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-blue-300 rounded-xl cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                      <FaUpload className="text-blue-600 dark:text-blue-400 w-8 h-8" />
                    </div>
                    <span className="text-lg font-medium text-gray-700 dark:text-gray-200">
                      Choisir un fichier
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Glissez-déposez ou cliquez pour sélectionner
                    </span>
                  </label>
                </div>
              )}

              {/* When file selected */}
              {file && (
                <div className="space-y-5">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                    <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                      <FaFile className="w-4 h-4" /> Fichier sélectionné
                    </h4>
                    <div className="flex justify-between items-center">
                      <div className="truncate max-w-xs">
                        <p className="font-medium truncate">{file.name}</p>
                        <p className="text-sm text-gray-500">
                          {formatBytes(file.size)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          resetForm();
                          setFile(null);
                        }}
                        className="text-red-500 hover:text-red-700 transition-colors"
                        title="Changer de fichier"
                      >
                        <FaTimes className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Nom du fichier <span className="text-red-500">*</span>
                      </label>
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition"
                        placeholder="Nommez votre fichier"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Type de fichier
                      </label>
                      <div className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <span className="font-medium">
                          {type || detectLogicalType(file)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition"
                      rows={3}
                      placeholder="Décrivez brièvement ce fichier..."
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center gap-3">
                      <div className="p-2 bg-white dark:bg-gray-600 rounded-full">
                        <FaUser className="text-gray-600 dark:text-gray-300 w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Envoyé par
                        </div>
                        <div className="font-medium">{author}</div>
                      </div>
                    </div>

                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center gap-3">
                      <div className="p-2 bg-white dark:bg-gray-600 rounded-full">
                        <FaCalendarAlt className="text-gray-600 dark:text-gray-300 w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Date / Heure
                        </div>
                        <div className="font-medium">{`${todayDate} · ${nowTime()}`}</div>
                      </div>
                    </div>

                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center gap-3">
                      <div className="p-2 bg-white dark:bg-gray-600 rounded-full">
                        <FaRulerVertical className="text-gray-600 dark:text-gray-300 w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Taille
                        </div>
                        <div className="font-medium">
                          {formatBytes(file.size)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    * Champs obligatoires
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setAddPublication(false);
                  }}
                  className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={!canPublish}
                  className={`px-5 py-2.5 rounded-lg text-white font-medium transition-all ${
                    canPublish
                      ? "bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 shadow-md hover:shadow-lg"
                      : "bg-gray-300 dark:bg-gray-600 cursor-not-allowed"
                  }`}
                >
                  Publier le document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
