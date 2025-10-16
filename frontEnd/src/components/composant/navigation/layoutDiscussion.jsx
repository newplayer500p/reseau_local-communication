import { useState, useCallback, useEffect, useMemo } from "react";
import { Outlet, useNavigate, useOutletContext } from "react-router-dom";
import { socketService } from "../../../service/socketService";
import { api, ws_token } from "../../../service/axios.service";
import { useDiscussions } from "../../../controller/useDiscussion";
import { uid } from "uid";

function DiscussionLayout() {
  const { profile } = useOutletContext();
  const navigate = useNavigate();

  const {
    rooms,
    setRooms,
    messages,
    setMessages,
    activeRoomId,
    setActiveRoomId,
    fetchRooms,
    handleNewMessage,
  } = useDiscussions(profile);

  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [text, setText] = useState("");
  const [fileInputKey, setFileInputKey] = useState(Date.now());
  const [joining, setJoining] = useState(false);

  // Fonction pour formater les dates
  const formatDateFR = useCallback((dateString) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  useEffect(() => {
    const handleRoomsChanged = (event) => {
      console.log("Rooms changed event received in layout:", event.detail);
      fetchRooms(); // Recharger la liste des salons
    };

    window.addEventListener("rooms-changed", handleRoomsChanged);

    return () => {
      window.removeEventListener("rooms-changed", handleRoomsChanged);
    };
  }, [fetchRooms]);

  // Initialiser la connexion socket
  useEffect(() => {
    let isMounted = true;
    let socketCleanup = null;

    const initializeSocket = async () => {
      const dataWs = await ws_token();
      if (!dataWs) {
        console.log("Token Obligatoir!!!");
        console.log(dataWs);
        return;
      }

      try {
        console.log("Initialisation socket...");

        await socketService.connect({
          accessToken: dataWs,
          url: "http://localhost:8507",
        });

        if (isMounted) {
          console.log("Socket initialisé avec succès");

          // Écouter les événements
          socketService.on("room_history", (history) => {
            if (!history || history.length === 0) return;
            const roomId = history[0].room;
            setMessages((prev) => ({ ...prev, [roomId]: history }));
          });

          socketService.on("room_message", handleNewMessage);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Échec de l initialisation socket:", err);
          // Gestion d'erreur (retry après délai, message à l'utilisateur, etc.)
        }
      }
    };

    initializeSocket();

    return () => {
      isMounted = false;
      if (socketCleanup) {
        socketService.cleanup();
      }
      socketService.disconnect();
    };
  }, [handleNewMessage, setMessages]);

  // Fetch rooms on mount
  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // Rooms triés par date de création
  const orderedRooms = useMemo(() => {
    return [...rooms].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  }, [rooms]);

  /** CREATE ROOM **/
  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return alert("Titre requis");

    const id =
      newTitle.toLowerCase().replace(/[^a-z0-9-]/g, "-") + "-" + uid(4);
    const payload = {
      id,
      title: newTitle.trim(),
      description: newDesc || "",
      password: newPassword || "",
      createdBy: profile?.email,
    };

    try {
      const res = await api.post("/room/create", payload);
      if (res.data?.ok) {
        const cleanRoom = { ...res.data.room };
        if (cleanRoom.password) delete cleanRoom.password;
        cleanRoom.isPrivate = !!cleanRoom.isPrivate;
        setRooms((prev) => [cleanRoom, ...prev]);
        setShowCreate(false);
        setNewTitle("");
        setNewDesc("");
        setNewPassword("");
      } else {
        alert("Erreur création salon");
      }
    } catch (err) {
      console.error("createRoom error", err);
      alert(
        "Erreur création salon: " + (err.response?.data?.error || err.message)
      );
    }
  };

  /** JOIN ROOM **/
  const handleJoinRoom = async (roomId) => {
    if (joining) return;
    setJoining(true);

    try {
      const roomLocal = rooms.find((r) => r.id === roomId);
      let password = "";
      if (roomLocal?.isPrivate) {
        password =
          prompt(`Mot de passe requis pour "${roomLocal.title}" :`) || "";
        if (!password) {
          setJoining(false);
          return;
        }
      }

      // Appel API pour valider le join côté backend
      const res = await api.post(`/room/join/${roomId}`, { password });
      if (!res.data?.ok) {
        alert("Impossible de rejoindre la salle");
        setJoining(false);
        return;
      }

      // Émettre l'événement join_room via socket
      socketService.joinRoom(roomId, password, (ack) => {
        console.log("joinRoom ack", ack);
        if (!ack?.ok) {
          alert("Impossible de rejoindre: " + (ack?.error || "unknown"));
          setJoining(false);
          return;
        }

        // succès socket-side : on peut setter activeRoom et naviguer
        setActiveRoomId(roomId);
        navigate(roomId, {
          state: { fromJoin: true, passwordUsed: !!password },
        });
        setRooms((prev) =>
          prev.map((r) => (r.id === roomId ? { ...r, isPrivate: true } : r))
        );
        setJoining(false);
      });

      socketService.emit("join_room", { roomId, password }, (ack) => {
        if (!ack?.ok) {
          alert("Join socket failed: " + (ack?.error || "unknown"));
          setJoining(false);
          return;
        }

        setActiveRoomId(roomId);
        navigate(roomId, {
          state: { fromJoin: true, passwordUsed: !!password },
        });
        setRooms((prev) =>
          prev.map((r) => (r.id === roomId ? { ...r, isPrivate: true } : r))
        );
        setJoining(false);
      });
    } catch (err) {
      console.error("handleJoinRoom error", err);
      alert("Erreur join: " + (err.response?.data?.error || err.message));
      setJoining(false);
    }
  };

  /** LEAVE ROOM **/
  const leaveRoom = useCallback(() => {
    if (activeRoomId) {
      socketService.emit("leave_room", { roomId: activeRoomId });
    }
    setActiveRoomId(null);
    navigate("/dashboardGenerale/discussions");
  }, [activeRoomId, navigate, setActiveRoomId]);

  /** DELETE ROOM **/
  const handleDeleteRoom = async (roomId) => {
    try {
      const room = rooms.find((r) => r.id === roomId);
      let password = "";
      if (room?.isPrivate) {
        password = prompt("Mot de passe requis pour supprimer ce salon:") || "";
        if (!password) return;
      }

      const res = await api.post(`/room/delete/${roomId}`, {
        password,
        email: profile?.email,
      });

      if (res.data?.ok) {
        setRooms((prev) => prev.filter((r) => r.id !== roomId));
        setMessages((prev) => {
          const copy = { ...prev };
          delete copy[roomId];
          return copy;
        });
        if (activeRoomId === roomId) {
          leaveRoom();
        }
      } else {
        alert("Suppression échouée");
      }
    } catch (err) {
      console.error("deleteRoom error", err);
      alert(
        "Erreur suppression: " + (err.response?.data?.error || err.message)
      );
    }
  };

  /** SEND MESSAGE via socket **/
  const sendMessage = useCallback(
    (roomId, text, type = "text") => {
      const msg = {
        roomId,
        sender: profile.email,
        type,
        text,
        createdAt: new Date().toISOString(),
      };
      socketService.emit("send_message", msg);
    },
    [profile.email]
  );

  /** SEND FILE **/
  const sendFile = useCallback(
    async (file, roomId = activeRoomId) => {
      if (!roomId) {
        console.warn("sendFile: pas de roomId");
        return;
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("roomId", roomId);
      formData.append("sender", profile.email);

      try {
        const res = await api.post(`message/${roomId}/upload`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 0,
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        });

        console.log(res);
      } catch (err) {
        console.error("sendFile error", err);
      }
    },
    [activeRoomId, profile.email]
  );

  // Contexte partagé avec les composants enfants
  const outletContext = {
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
    handleDeleteRoom,
    messages,
    sendMessage,
    leaveRoom,
    text,
    setText,
    fileInputKey,
    setFileInputKey,
    sendFile,
    rooms,
    setRooms,
  };

  return (
    <div className="discussion-layout">
      <Outlet context={outletContext} />
    </div>
  );
}

export default DiscussionLayout;
