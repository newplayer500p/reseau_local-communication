import React, { useMemo, useState, useCallback } from "react";
import { FaExchangeAlt, FaTrash } from "react-icons/fa";
import { useOutletContext } from "react-router-dom";
import CreatePublication from "../publication/createPublication";
import { fileService } from "../../../service/fileService";

/**
 * Utilitaires
 */
function parseDateTime(dateStr, timeStr = "00:00") {
  return new Date(dateStr + "T" + (timeStr || "00:00"));
}
function sortByDateTime(list, recent = true) {
  return [...list].sort((a, b) => {
    const da = parseDateTime(a.date, a.heure);
    const db = parseDateTime(b.date, b.heure);
    return recent ? db - da : da - db;
  });
}

export default function PublicationFile() {
  const { dataServer = [], profile = {}} = useOutletContext();

  // états (noms préservés)
  const [filter, setFilter] = useState(() => new Set(["Aucun"])); // Set de filtres actifs
  const [rangeFrom, setRangeFrom] = useState("");
  const [rangeTo, setRangeTo] = useState("");
  const [type, setType] = useState("");
  const [ordreRecent, setOrdreRecent] = useState(true);

  // modal date
  const [showDateDialog, setShowDateDialog] = useState(false);
  const [tmpFrom, setTmpFrom] = useState("");
  const [tmpTo, setTmpTo] = useState("");
  const [tmpAllDates, setTmpAllDates] = useState(false);

  const canSendFile =
    profile?.statut === "Responsable" || profile?.statut === "Admin";

  const [searchTerm, setSearchTerm] = useState("");

  // helpers pour gérer le Set "filter"
  const hasFilter = useCallback(
    (name) => {
      return filter.has(name);
    },
    [filter]
  );
  // Ajouter cette fonction de formatage
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

  const addFilter = (name) => {
    setFilter((prev) => {
      const next = new Set(prev);
      if (next.has("Aucun")) next.delete("Aucun");
      next.add(name);
      return next;
    });
  };

  const removeFilter = (name) => {
    setFilter((prev) => {
      const next = new Set(prev);
      next.delete(name);
      if (next.size === 0) next.add("Aucun");
      return next;
    });
  };

  const clearFilters = () => {
    setRangeFrom("");
    setRangeTo("");
    setType("");
    setOrdreRecent(true);
    setFilter(new Set(["Aucun"]));
  };

  // Date dialog handlers
  const openDateDialog = () => {
    setTmpFrom(rangeFrom);
    setTmpTo(rangeTo);
    setTmpAllDates(!rangeFrom && !rangeTo);
    setShowDateDialog(true);
  };
  const applyDateDialog = () => {
    if (tmpAllDates) {
      setRangeFrom("");
      setRangeTo("");
      removeFilter("date");
    } else {
      setRangeFrom(tmpFrom);
      setRangeTo(tmpTo);
      if (tmpFrom || tmpTo) addFilter("date");
      else removeFilter("date");
    }
    setShowDateDialog(false);
  };
  const cancelDateDialog = () => {
    setShowDateDialog(false);
  };

  // Appliquer les filtres sur dataServer + recherche intégrée
  const filteredData = useMemo(() => {
    if (!Array.isArray(dataServer) || dataServer.length === 0) return [];

    let result = dataServer;

    // filter par type si actif
    if (hasFilter("type") && type) {
      result = result.filter((f) => f.type === type);
    }

    // filter par date si actif
    if (hasFilter("date") && (rangeFrom || rangeTo)) {
      result = result.filter((f) => {
        if (!f.date) return false;
        const fileDate = new Date(f.date);
        if (rangeFrom) {
          const fromDate = new Date(rangeFrom);
          fromDate.setHours(0, 0, 0, 0);
          if (fileDate < fromDate) return false;
        }
        if (rangeTo) {
          const toDate = new Date(rangeTo);
          toDate.setHours(23, 59, 59, 999);
          if (fileDate > toDate) return false;
        }
        return true;
      });
    }

    // ordre : si filtre "ordre" est actif, on tri selon ordreRecent
    if (hasFilter("ordre")) {
      result = sortByDateTime(result, ordreRecent);
    } else {
      result = sortByDateTime(result, true);
    }

    // RECHERCHE EN TEMPS RÉEL (intégrée ici)
    if (searchTerm && searchTerm.trim() !== "") {
      const q = searchTerm.toLowerCase();
      result = result.filter((f) => {
        return (
          (f.name || "").toLowerCase().includes(q) ||
          (f.description || "").toLowerCase().includes(q) ||
          (f.author || "").toLowerCase().includes(q)
        );
      });
    }

    return result;
  }, [
    dataServer,
    type,
    rangeFrom,
    rangeTo,
    ordreRecent,
    hasFilter,
    searchTerm,
  ]);

  const filteredFiles = filteredData;

  const activeBtnClass = "bg-blue-500 text-white";
  const inactiveBtnClass = "bg-gray-200 dark:bg-gray-400";

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 dark:text-gray-50">
      {/* Main Content */}
      <main className="flex-1 p-2 overflow-y-auto">
        {/* Header */}
        <div>
          <header className="flex justify-between items-center border-b border-gray-300 dark:border-gray-800 mb-8 pb-4 py-2">
            <h1 className="text-2xl font-bold mr-20 mask-b-from-80%">
              Liste des documents
            </h1>
            <div className="flex items-center space-x-4 w-1/2">
              <input
                type="text"
                placeholder="Rechercher un fichier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`px-3 py-1  ${
                  searchTerm === ""
                    ? "border border-gray-300 dark:border-gray-700"
                    : "border-2 border-blue-500 focus:outline-0"
                } rounded h-12  w-full`}
              />
            </div>
          </header>

          {/* NOTE: plus de <ul> ici — la recherche est intégrée à `filteredFiles` */}
        </div>

        {/* Filters */}
        <div className="mb-4 pb-4 flex flex-row border-b border-gray-300 dark:border-gray-700 items-start">
          <div className="mr-2 font-semibold w-30">Type de filtre :</div>
          <div className="flex flex-row flex-wrap items-center gap-2">
            <button
              onClick={() => clearFilters()}
              className={`px-3 py-1 mb-2 rounded ${
                hasFilter("Aucun") ? activeBtnClass : inactiveBtnClass
              }`}
            >
              Aucun
            </button>

            <select
              onChange={(e) => {
                const val = e.target.value;
                setType(val);
                if (val) addFilter("type");
                else removeFilter("type");
              }}
              value={type}
              className={`px-3 py-1 mb-2 rounded ${
                hasFilter("type") ? activeBtnClass : inactiveBtnClass
              }`}
            >
              <option value="">Tous</option>
              {["PDF", "DOCX", "ZIP", "TEXTE", "VIDEO", "AUDIO", "IMAGE", "AUTRE"].map(
                (t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                )
              )}
            </select>

            <select
              onChange={(e) => {
                const isRecent = e.target.value === "true";
                setOrdreRecent(isRecent);
                addFilter("ordre");
              }}
              value={String(ordreRecent)}
              className={`px-3 py-1 mb-2 rounded ${
                hasFilter("ordre") ? activeBtnClass : inactiveBtnClass
              }`}
            >
              <option value={true}>Plus recent</option>
              <option value={false}>Plus anciens</option>
            </select>

            <button
              onClick={() => openDateDialog()}
              className={`px-3 py-1 mb-2 rounded ${
                hasFilter("date") ? activeBtnClass : inactiveBtnClass
              }`}
            >
              Date
            </button>

            <div className="flex items-center gap-2 ml-2">
              {Array.from(filter)
                .filter((f) => f !== "Aucun")
                .map((f) => (
                  <button
                    key={f}
                    onClick={() => removeFilter(f)}
                    className="px-2 py-0.5 rounded border text-sm"
                  >
                    {f} ✕
                  </button>
                ))}
            </div>
          </div>
        </div>

        {/* Files List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {!filteredFiles || filteredFiles.length === 0 ? (
            <p>Aucun fichier disponible pour ce(s) filtre(s).</p>
          ) : (
            filteredFiles.map((file) => (
              <div
                key={file._id ?? file.name}
                className="bg-white dark:bg-gray-800 p-4 rounded shadow relative"
              >

                <h3 className="font-bold text-xl font-mono">{file.name}</h3>
                <p className="text-xl text-gray-700 dark:text-gray-200">
                  Description: {file.description}
                </p>
                <p className="text-sm text-gray-700 mt-1 dark:text-gray-300">
                  Envoyer par: {file.author}
                </p>
                <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">
                  Le: {file.date} {file.heure}
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

      {canSendFile ? <CreatePublication /> : null}

      {/* Modal de sélection de plage de date */}
      {showDateDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={cancelDateDialog}
          />
          <div className="bg-white dark:bg-gray-800 p-4 rounded shadow z-60 w-full max-w-md">
            <div className="flex items-center gap-2 mb-2">
              <FaExchangeAlt />
              <h3 className="font-semibold">Filtrer par intervalle de dates</h3>
            </div>

            <div className="mb-3">
              <label className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={tmpAllDates}
                  onChange={(e) => setTmpAllDates(e.target.checked)}
                />
                <span>Tous les dates (désactive le filtrage par date)</span>
              </label>

              {!tmpAllDates && (
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={tmpFrom}
                    onChange={(e) => setTmpFrom(e.target.value)}
                    className="px-3 py-2 border rounded"
                  />
                  <span className="text-sm">→</span>
                  <input
                    type="date"
                    value={tmpTo}
                    onChange={(e) => setTmpTo(e.target.value)}
                    className="px-3 py-2 border rounded"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={cancelDateDialog}
                className="px-3 py-1 rounded border"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  applyDateDialog();
                }}
                className="px-3 py-1 rounded bg-blue-500 text-white"
              >
                Appliquer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
