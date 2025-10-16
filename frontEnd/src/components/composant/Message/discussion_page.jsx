/* eslint-disable no-empty */
/* eslint-disable no-unused-vars */
import React, { useEffect, useRef, useState, useMemo } from "react";
import {
  FaLock,
  FaUnlock,
  FaDownload,
  FaPaperPlane,
  FaFileAlt,
} from "react-icons/fa";
import { FiUpload } from "react-icons/fi";
import {
  useOutletContext,
  useParams,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { api } from "../../../service/axios.service";
import { socketService } from "../../../service/socketService"; // Utiliser le nouveau service

export default function Discussion_page() {
  const room = useParams().roomId;
  const navigate = useNavigate();
  const location = useLocation();

  const {
    formatDateFR,
    setFileInputKey,
    messages,
    sendMessage,
    leaveRoom,
    text,
    fileInputKey,
    sendFile,
    setText,
    profile,
    rooms,
    setRooms,
  } = useOutletContext();

  // Memo pour éviter le warning eslint react-hooks/exhaustive-deps
  const roomMessages = useMemo(() => messages[room] || [], [messages, room]);

  const inputRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [joining, setJoining] = useState(false);
  const joinedRef = useRef(false);

  // Scroll automatique vers le bas quand messages changent
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (el) {
      setTimeout(
        () => el.scrollTo({ top: el.scrollHeight, behavior: "smooth" }),
        50
      );
    }
  }, [roomMessages, room]);

  // Rejoindre la room automatiquement après reconnexion socket
  useEffect(() => {
    const handleSocketReconnect = () => {
      if (room && joinedRef.current) {
        console.log("Reconnecting to room after socket reconnect:", room);
        socketService.emit("join_room", { roomId: room }, (ack) => {
          if (ack?.ok) {
            console.log("Rejoined room after reconnect");
          }
        });
      }
    };

    socketService.onEvent("connected", handleSocketReconnect);

    return () => {
      socketService.off("connected", handleSocketReconnect);
    };
  }, [room]);

  // useEffect : join flow si on arrive directement sur l'URL
  useEffect(() => {
    if (!room) return;

    // si on vient du layout via navigate(..., { state: { fromJoin: true } }), skip
    if (location?.state?.fromJoin) {
      joinedRef.current = true;
      try {
        navigate(location.pathname, { replace: true, state: {} });
      } catch (e) {}
      return;
    }

    // si on est déjà en train de tenter ou déjà joint, skip
    if (joinedRef.current) return;

    let mounted = true;
    (async () => {
      try {
        // marque qu'on est en train d'essayer (empêche réentrées/prompt multiples)
        joinedRef.current = "attempting";
        setJoining(true);

        // 1) récupérer méta (parent ou API)
        let meta;
        if (Array.isArray(rooms) && rooms.length > 0)
          meta = rooms.find((r) => r.id === room);
        if (!meta) {
          try {
            const res = await api.post("/room/listRoom");
            if (res?.data?.ok && Array.isArray(res.data.room)) {
              meta = res.data.room.find((r) => r.id === room);
            }
          } catch (err) {
            console.warn(
              "Impossible de récupérer la liste des salons : ",
              err?.message || err
            );
          }
        }

        if (!meta) {
          if (!mounted) return;
          alert("Salle introuvable.");
          joinedRef.current = false;
          navigate("/dashboardGenerale/discussions");
          return;
        }

        // 2) prompt si privée (SEULEMENT une fois grâce au flag above)
        let password = "";
        if (meta.isPrivate || meta.password) {
          const provided = prompt(
            `La salle "${
              meta.title || room
            }" est protégée. Entrez le mot de passe :`
          );
          if (provided === null) {
            // utilisateur annule : reset flag et revenir
            joinedRef.current = false;
            setJoining(false);
            navigate("/dashboardGenerale/discussions");
            return;
          }
          password = provided;
        }

        // 3) appeler l'API join pour valider côté serveur
        const joinRes = await api.post(`/room/join/${room}`, { password });
        if (!joinRes?.data?.ok) {
          alert(
            "Impossible de rejoindre la salle (vérification serveur échouée)."
          );
          joinedRef.current = false;
          navigate("/dashboardGenerale/discussions");
          return;
        }

        // 4) tenter d'émettre join_room via socket
        if (socketService.connected) {
          socketService.emit("join_room", { roomId: room, password }, (ack) => {
            if (!ack?.ok) {
              alert(
                "Échec de la connexion en temps réel : " +
                  (ack?.error || "unknown")
              );
              joinedRef.current = false;
              return;
            }
            // ack ok
            joinedRef.current = true;
          });
        } else {
          // Attendre que le socket soit connecté
          const waitForConnection = () => {
            return new Promise((resolve) => {
              if (socketService.connected) {
                resolve(true);
                return;
              }

              const onConnect = () => {
                socketService.off("connected", onConnect);
                resolve(true);
              };

              socketService.onEvent("connected", onConnect);

              // Timeout de sécurité
              setTimeout(() => {
                socketService.off("connected", onConnect);
                resolve(false);
              }, 5000);
            });
          };

          const connected = await waitForConnection();
          if (connected) {
            socketService.emit(
              "join_room",
              { roomId: room, password },
              (ack) => {
                if (!ack?.ok) {
                  alert(
                    "Échec de la connexion en temps réel : " +
                      (ack?.error || "unknown")
                  );
                  joinedRef.current = false;
                  return;
                }
                joinedRef.current = true;
              }
            );
          } else {
            // Socket non connecté dans le délai, mais on considère l'API join comme valide
            joinedRef.current = true;
          }
        }

        // Nettoyer les données sensibles
        setRooms((prev) =>
          prev.map((r) => {
            if (r.id !== room) return r;
            const copy = { ...r };
            if (copy.password) delete copy.password;
            copy.isPrivate = true;
            return copy;
          })
        );
      } catch (err) {
        console.error("join from url error:", err);
        alert(
          "Erreur pendant l'accès à la salle : " +
            (err?.response?.data?.error || err.message)
        );
        joinedRef.current = false;
        navigate("/dashboardGenerale/discussions");
      } finally {
        if (mounted) setJoining(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [room, rooms, navigate, location, setRooms]);

  // quand on choisit un fichier : on l'affiche et on appelle sendFile
  function handleFileChange(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setSelectedFile(f);
    sendFile(f, room);
    setSelectedFile(null);
  }

  // Envoi du formulaire
  function handleSubmit(e) {
    e.preventDefault();
    if (!text?.trim() && !selectedFile) return;

    if (selectedFile) {
      sendFile(selectedFile, room);
      setSelectedFile(null);
      setFileInputKey(Date.now());
    } else {
      sendMessage(room, text, "text");
      setText("");
    }
  }

  // helper pour download sans naviguer
  async function downloadFile(url, suggestedName) {
    try {
      const res = await fetch(url, {
        // si tu as besoin d'entêtes auth: ajoute ici (Authorization, etc.)
        credentials: "include", // si tu utilises cookies
      });
      if (!res.ok) throw new Error("Download failed: " + res.status);
      const blob = await res.blob();
      const a = document.createElement("a");
      const objectUrl = URL.createObjectURL(blob);
      a.href = objectUrl;
      a.download = suggestedName || "file";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      console.error("Download error", err);
      alert("Erreur téléchargement: " + err.message);
    }
  }

  // Entrée clavier : Enter = envoi, Shift+Enter = newline
  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(new Event("submit", { bubbles: true, cancelable: true }));
    }
  }

  // utilitaire pour afficher les détails de la room
  const roomMeta = useMemo(() => {
    if (!rooms || !Array.isArray(rooms)) return null;
    return rooms.find((r) => r.id === room) || null;
  }, [rooms, room]);

  const formatSize = (bytes = 0) => {
    const mb = bytes / Math.pow(2, 20);
    return `${mb.toFixed(2)} MB`;
  };

  const safeFileName = (m) => {
    // essaie d'extraire un nom lisible
    const url = m?.file?.url || m?.fileUrl || "";
    const fallback = m?.file?.name || m?.fileName || "file";
    if (!url) return fallback;
    try {
      const parts = url.split("/").filter(Boolean);
      return parts[parts.length - 1] || fallback;
    } catch (e) {
      return fallback;
    }
  };

  // garde l'extension à la fin et tronque le reste au besoin
  function shortenFileName(rawName, maxChars = 40) {
    if (!rawName) return "";

    // si tu utilises le marqueur (!-!) pour séparer, garder la partie lisible après
    const name = rawName.includes("(!-!)")
      ? rawName.split("(!-!)").pop()
      : rawName;

    const dot = name.lastIndexOf(".");
    if (dot === -1) {
      // pas d'extension détectée -> simple tronquage
      return name.length > maxChars
        ? name.slice(0, maxChars - 3) + "..."
        : name;
    }

    const base = name.slice(0, dot);
    const ext = name.slice(dot); // inclut le point, ex ".jpg"

    // réserver la place pour l'extension + les points de suspension
    const maxBase = Math.max(6, maxChars - ext.length - 3); // au moins 6 chars visibles
    if (base.length <= maxBase) return base + ext;

    return base.slice(0, maxBase) + "..." + ext;
  }

  function getMessageKey(m) {
    const id = m._id || m.id || (m.file && m.file.name) || null;
    if (id) return `${String(id)}-${String(m.createdAt || "")}`;
    // fallback unique but stable as much as possible
    return `${m.room || "room"}-${String(m.sender || "")}-${String(
      m.createdAt || Date.now()
    )}`;
  }

  function useResponsiveFileNameLimit() {
    const [limit, setLimit] = useState(40);

    useEffect(() => {
      function handleResize() {
        const width = window.innerWidth;
        if (width < 1024) {
          // mobile
          setLimit(14);
        } else if (width < 1400) {
          // tablette
          setLimit(25);
        } else {
          // écran large
          setLimit(45);
        }
      }

      handleResize(); // pour initialiser au chargement
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, []);

    return limit;
  }

  const limit = useResponsiveFileNameLimit();

  return (
    <div className="p-4 mx-auto w-full max-w-screen-lg">
      {/* header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={leaveRoom}
            className="px-3 py-1 border rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition focus:outline-none focus:ring-2 focus:ring-blue-400"
            aria-label="Retour"
          >
            ← Retour
          </button>

          <div className="flex items-baseline gap-3">
            <h2 className="text-xl font-semibold truncate max-w-xs">
              {roomMeta?.title || room}
            </h2>

            <span
              className="flex items-center gap-1 text-sm px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200"
              title={
                roomMeta?.isPrivate || roomMeta?.password
                  ? "Salon privé"
                  : "Salon public"
              }
            >
              {roomMeta?.isPrivate || roomMeta?.password ? (
                <FaLock />
              ) : (
                <FaUnlock className="text-green-500" />
              )}
              <span className="ml-1">
                {roomMeta?.isPrivate || roomMeta?.password ? "Privé" : "Public"}
              </span>
            </span>
          </div>
        </div>

        <div className="text-sm text-gray-500">
          Créé par{" "}
          <span className="font-medium text-gray-700 dark:text-gray-200">
            {roomMeta?.createdBy || "—"}
          </span>
        </div>
      </div>

      {/* messages zone */}
      <div
        ref={messagesContainerRef}
        className="border rounded-lg p-4 h-[65vh] overflow-auto bg-white dark:bg-gray-900 shadow-inner scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700"
        aria-live="polite"
      >
        {roomMessages.length === 0 ? (
          <div className="text-center text-gray-500 mt-20">
            Aucun message — soyez le premier !
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {roomMessages.map((m) => {
              const messageId = getMessageKey(m)
              const isMe = (m.sender || "") === (profile?.email || "");
              const fileName = safeFileName(m);
              const fileSize = m.file?.size || m.fileSize || 0;
              const fileUrl = m.file?.url || m.fileUrl || `#`;

              return (
                <div
                  key={messageId}
                  className={`w-full flex ${
                    isMe ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`flex flex-col ${
                      isMe ? "items-end" : "items-start"
                    } min-w-0`}
                    style={{ width: "100%" }}
                  >
                    <div
                      className={`text-xs text-gray-400 mb-1 ${
                        isMe ? "self-end" : "self-start"
                      }`}
                    >
                      <span className="font-medium text-gray-700 dark:text-gray-200">
                        {m.sender}
                      </span>
                      <span className="mx-2">·</span>
                      <time className="text-gray-400">
                        {formatDateFR(m.createdAt)}
                      </time>
                    </div>

                    {m.type === "text" ? (
                      <div
                        className={`p-3 rounded-2xl break-words min-w-0 max-w-[80%] md:max-w-[60%] shadow-sm transition-transform transform ${
                          isMe
                            ? "bg-blue-600 text-white self-end"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 self-start"
                        }`}
                        style={{
                          overflowWrap: "anywhere",
                          wordBreak: "break-word",
                        }}
                      >
                        {m.text}
                      </div>
                    ) : (
                      <div
                        className={`p-3 rounded-xl min-w-0 max-w-[70%] md:max-w-[50%] bg-gray-50 dark:bg-gray-800 shadow-sm`}
                      >
                        <button
                          onClick={() => downloadFile(fileUrl, fileName)}
                          className="flex items-center gap-3 w-full hover:opacity-95"
                        >
                          <div className="p-2 rounded-md bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <FaFileAlt className="text-lg" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">
                              {shortenFileName(fileName, limit)}
                            </div>

                            <div className="text-sm text-gray-500 mt-1">
                              {formatSize(fileSize)}
                            </div>
                          </div>

                          <div className="flex-shrink-0 text-gray-500">
                            <FaDownload />
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* composer */}
      <form
        onSubmit={handleSubmit}
        className="mt-4 grid grid-cols-1 md:grid-cols-[1fr,auto] gap-2 items-end"
      >
        <div className="flex gap-2 w-full">
          <div className="flex w-full items-end gap-2">
            <input
              id="file-input"
              className="hidden"
              key={fileInputKey}
              ref={inputRef}
              type="file"
              onChange={handleFileChange}
              aria-hidden="false"
            />

            <div className="flex-1 min-w-0">
              <label htmlFor="message-textarea" className="sr-only">
                Message
              </label>
              <textarea
                id="message-textarea"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Écrire un message... (Shift+Enter pour saut de ligne)"
                className="w-full h-20 border rounded-md p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300 dark:bg-gray-800 dark:border-gray-700"
                aria-label="Message"
              />

              {/* si un fichier est sélectionné, afficher un preview */}
              {selectedFile && (
                <div className="mt-2 inline-flex items-center gap-3 bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-md">
                  <div className="flex items-center gap-2">
                    <FaFileAlt />
                    <div className="text-sm truncate max-w-xs">
                      {selectedFile.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      · {formatSize(selectedFile.size)}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={setSelectedFile(null)}
                    className="ml-4 px-2 py-1 border rounded text-sm hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none"
                  >
                    Supprimer
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => inputRef?.current?.click()}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md flex items-center gap-2 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-green-300"
            aria-label="Joindre un fichier"
          >
            <FiUpload size={20} />
            Joindre
          </button>

          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center gap-2 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-300"
            disabled={!text?.trim() && !selectedFile}
          >
            <FaPaperPlane />
            Envoyer
          </button>

          <button
            type="button"
            onClick={() => setText("")}
            className="px-4 py-2 border rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none"
          >
            Effacer
          </button>
        </div>
      </form>
    </div>
  );
}
