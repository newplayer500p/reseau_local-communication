import React, { useEffect, useRef, useState } from "react";
import { FaCamera, FaUser, FaEdit, FaSave, FaTimes, FaConnectdevelop, FaSignOutAlt, FaTrash } from "react-icons/fa";
import toast from "react-hot-toast";
import { useNavigate, useOutletContext } from "react-router-dom";
import { comparePassword, deleteAccount, logout, updateUser } from "../../controller/user.controller";



export default function Profile() {

  const {profile} = useOutletContext();

  const isAdmin = profile.statut === "Admin";
  // Mock utilisateur (données locales)
  const [user, setUser] = useState(profile);

  useEffect(() => {
    setUser(profile);
    if (profile && profile.email !== "____") {
      setLoading(false); // profil chargé
    }
  }, [profile]);

  // états d'édition / modal
  const [editing, setEditing] = useState(false);
  const [askingPwd, setAskingPwd] = useState(false);
  const [pwd, setPwd] = useState("");
  const [pwdError, setPwdError] = useState("");
  const [loading, setLoading] = useState(true);

  // Nouveaux états pour la suppression
  const [askingDeletePwd, setAskingDeletePwd] = useState(false);
  const [deletePwd, setDeletePwd] = useState("");
  const [deletePwdError, setDeletePwdError] = useState("");

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const navigate = useNavigate();

  // champs d'édition temporaires
  const [draft, setDraft] = useState({
    nom: user.nom,
    statut: user.statut,
    email: user.email,
    description: user.description,
    avatarFile: null,
    password: pwd,
    avatarPreview: user.avatarUrl,
  });

  const fileRef = useRef(null);

  // garde la preview à jour si user.avatarUrl change
  useEffect(() => {
    setDraft(d => ({
      ...d,
      avatarPreview: user.avatarUrl,
    }));
  }, [user.avatarUrl]);

  // nettoyer objectURL quand avatarFile change / composant unmount
  useEffect(() => {
    return () => {
      if (draft.avatarPreview && typeof draft.avatarPreview === "string" && draft.avatarFile) {
        URL.revokeObjectURL(draft.avatarPreview);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function verifyPassword(enteredPwd) {
    const r = await comparePassword(enteredPwd);
    if (r) return true;
    return false; // <- retourne true (autorise la modification) comme demandé
  }

  // ouverture du modal de mot de passe pour édition
  const handleClickEdit = () => {
    setPwd("");
    setPwdError("");
    setAskingPwd(true);
  };

  // confirmer mot de passe pour édition
  const handleConfirmPwd = async (e) => {
    e.preventDefault();

    if (isAdmin) return;

    if (await verifyPassword(pwd)) {
      setAskingPwd(false);
      setEditing(true);
      // initialiser draft avec valeurs actuelles
      setDraft({
        nom: user.nom,
        statut: user.statut,
        email: user.email,
        description: user.description,
        password: pwd,
        avatarFile: null,
        avatarPreview: user.avatarUrl,
      });
      toast.success("Vérification réussie — vous pouvez modifier votre profil");
    } else {
      setPwdError("Mot de passe incorrect");
      toast.error("Vérification échouée");
    }
  };

  // ouvrir modal suppression
  const handleClickDelete = () => {
    setDeletePwd("");
    setDeletePwdError("");
    setAskingDeletePwd(true);
  };

  // confirmer suppression
  const handleConfirmDelete = async (e) => {
    if (isAdmin) return;
    e.preventDefault();
    if (!await verifyPassword(deletePwd)) {
      setDeletePwdError("Mot de passe incorrect");
      toast.error("Mot de passe incorrect");
      return;
    }

    try {
      await deleteAccount(deletePwd);
      // pour l'instant on simule la suppression
      toast.success("Compte supprimé");
      setAskingDeletePwd(false);
      // nettoyer localstorage / tokens si besoin
      localStorage.removeItem("accessToken");
      navigate("/login");
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la suppression");
    }
  };

  // annuler édition
  const handleCancelEdit = () => {
    // libère preview si besoin
    if (draft.avatarPreview && draft.avatarFile) {
      URL.revokeObjectURL(draft.avatarPreview);
    }
    setDraft({
      nom: user.nom,
      email: user.email,
      description: user.description,
      avatarFile: null,
      avatarPreview: user.avatarUrl,
    });
    setEditing(false);
    toast("Modification annulée");
  };

  // sauvegarder modifications (mock)
  const handleSave = async (e) => {
    e.preventDefault();
    if (isAdmin) return;

    
    // validation minimale
    if (!draft.nom || !draft.email) {
      toast.error("Nom et email sont requis");
      return;
    }
    
    // Si avatarFile présent, créer URL pour stockage mock
    let newAvatarUrl = user.avatarUrl;
    if (draft.avatarFile) {
      // en vrai on uploaderait sur serveur -> ici on garde objectURL
      newAvatarUrl = draft.avatarPreview;
    }

    // construire l'objet "champs modifiés"
    const formData = new FormData();
    if (draft.nom !== user.nom) formData.append("nom", draft.nom);
    if (draft.email !== user.email) formData.append("email", draft.email);
    if (draft.description !== user.description) formData.append("description", draft.description);
    if (draft.avatarFile) formData.append("avatar", draft.avatarFile);
    formData.append("password", draft.password);

    const attempt = await updateUser(formData);
    if (!attempt) {
      toast.error("Une erreur c'est produit");
      setEditing(false);
      return;
    };

    console.log(attempt);

    // Mettre à jour "user" (mock)
    setUser((u) => ({
      ...u,
      nom: draft.nom,
      email: draft.email,
      description: draft.description,
      avatarUrl: newAvatarUrl,
    }));

    setEditing(false);
    toast.success("Profil mis à jour");
  };

  // gestion du changement d'avatar (fichier)
  const handleAvatarChange = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    // libérer ancienne preview si existait et venait d'un file
    if (draft.avatarPreview && draft.avatarFile) {
      URL.revokeObjectURL(draft.avatarPreview);
    }
    const url = URL.createObjectURL(f);
    setDraft(d => ({ ...d, avatarFile: f, avatarPreview: url }));
  };

  // UI
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mt-6">
        <div className="flex items-center gap-6">
          {/* avatar */}
          <div className="relative">
            <div className="w-28 h-28 rounded-full bg-gray-300 dark:bg-gray-700 overflow-hidden flex items-center justify-center">
              { (editing ? draft.avatarPreview : user.avatarUrl) ? (
                <img
                  src={editing ? draft.avatarPreview : user.avatarUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={user.avatarUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {editing ? (
              <button
                type="button"
                onClick={() => fileRef.current.click()}
                className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center text-white hover:bg-blue-700"
                aria-label="Changer l'avatar"
              >
                <FaCamera className="w-4 h-4" />
              </button>
            ) : null}
          </div>

          {/* infos */}
          <div className="flex-1">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">{user.nom === "" ? "..." : user.nom}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">Status : {user.statut}</p>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
          </div>

          {/* actions */}
          <div className="flex items-start gap-2">
            {editing && !isAdmin? (
              <>
                <button
                  onClick={handleSave}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded shadow"
                >
                  <FaSave /> Enregistrer
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded"
                >
                  <FaTimes /> Annuler
                </button>
              </>
            ) : (
              <div className="flex flex-col">
                { !isAdmin && <button
                  onClick={isAdmin ? null : handleClickEdit}
                  disabled={user.email === "____" || isAdmin ? true : false}
                  className={` ${user.email === "____" ? "bg-gray-500" : "bg-green-600 hover:bg-green-700"} inline-flex items-center gap-2 px-4 py-2 text-white rounded shadow mb-3`}
                >
                  <FaEdit /> Modifier
                </button>}

                <div className="flex flex-col xl:flex-row gap-2">
                  <button
                    onClick={() => setShowLogoutConfirm(true)}
                    disabled={user.email === "____" ? true : false}
                    className={` ${user.email === "____" ? "bg-gray-500" : "bg-blue-600 hover:bg-blue-700"} inline-flex items-center gap-2 px-4 py-2 text-white rounded shadow`}
                  >
                    <FaSignOutAlt /> Deconnecter
                  </button>

                  {!isAdmin && <button
                    onClick={isAdmin ? null : handleClickDelete}
                    disabled={user.email === "____" ? true : false}
                    className={` ${user.email === "____" ? "bg-gray-500" : "bg-amber-600 hover:bg-amber-700"} inline-flex items-center gap-2 px-4 py-2 text-white rounded shadow`}
                  >
                    <FaTrash /> Supprimer
                  </button>}
                </div>

              </div>
            )}
          </div>
        </div>

        {/* zone édition (form) quand editing true */}
        {editing && !isAdmin && (
          <form onSubmit={handleSave} className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nom</label>
              <input
                type="text"
                value={draft.nom}
                onChange={(e) => setDraft(d => ({ ...d, nom: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
              <input
                type="email"
                value={draft.email}
                onChange={(e) => setDraft(d => ({ ...d, email: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mot de passe</label>
              <input
                type="text"
                value={draft.password}
                onChange={(e) => setDraft(d => ({ ...d, password: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">description</label>
              <textarea
                value={draft.description}
                onChange={(e) => setDraft(d => ({ ...d, description: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded"
                rows={3}
              />
            </div>

            {/* input file caché */}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </form>
        )}

        {/* Activité récente */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Description</h3>
          <p className="text-sm text-gray-500">{user.description ?? " __ "}</p>
        </div>
      </div>

      {/* Modal mot de passe (demande avant édition) */}
      {askingPwd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setAskingPwd(false)}></div>

          <form
            onSubmit={handleConfirmPwd}
            className="relative bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md z-10"
            role="dialog"
            aria-modal="true"
            aria-label="Vérification du mot de passe"
          >
            <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-100">Confirmez votre mot de passe</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Entrez votre mot de passe pour autoriser la modification du profil.</p>

            <input
              type="password"
              value={pwd}
              onChange={(e) => { setPwd(e.target.value); setPwdError(""); }}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded mb-2"
              placeholder="Mot de passe"
              autoFocus
            />
            {pwdError && <p className="text-red-500 text-sm mb-2">{pwdError}</p>}

            <div className="flex justify-end gap-2 mt-3">
              <button type="button" onClick={() => setAskingPwd(false)} className="px-3 py-2 rounded bg-gray-200 dark:bg-gray-700">Annuler</button>
              <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white">Confirmer</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal suppression (demande mot de passe) */}
      {askingDeletePwd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setAskingDeletePwd(false)}></div>

          <form
            onSubmit={handleConfirmDelete}
            className="relative bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md z-10"
            role="dialog"
            aria-modal="true"
            aria-label="Confirmation suppression du compte"
          >
            <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-100">Supprimer le compte</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Cette action est irréversible. Entrez votre mot de passe pour confirmer la suppression du compte.</p>

            <input
              type="password"
              value={deletePwd}
              onChange={(e) => { setDeletePwd(e.target.value); setDeletePwdError(""); }}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded mb-2"
              placeholder="Mot de passe"
              autoFocus
            />
            {deletePwdError && <p className="text-red-500 text-sm mb-2">{deletePwdError}</p>}

            <div className="flex justify-end gap-2 mt-3">
              <button type="button" onClick={() => setAskingDeletePwd(false)} className="px-3 py-2 rounded bg-gray-200 dark:bg-gray-700">Annuler</button>
              <button type="submit" className="px-4 py-2 rounded bg-red-600 text-white">Supprimer</button>
            </div>
          </form>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center mt-6">
          <svg
            className="animate-spin h-6 w-6 text-blue-600 mb-2"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
          <span className="text-gray-500 dark:text-gray-400 text-sm">Chargement du profil en cours...</span>
        </div>
      )}

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowLogoutConfirm(false)}
          ></div>

          <div
            className="relative bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-sm z-10"
            role="dialog"
            aria-modal="true"
            aria-label="Confirmer déconnexion"
          >
            <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">Déconnexion</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Voulez-vous vraiment vous déconnecter ?
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="px-3 py-2 rounded bg-gray-200 dark:bg-gray-700"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={async () => {
                  setShowLogoutConfirm(false);
                  try {
                    const isLogout = await logout();
                    if (isLogout) {
                      // optional: nettoyer token local
                      localStorage.removeItem("accessToken");
                      navigate("/login");
                    } else {
                      toast.error("Échec de la déconnexion");
                    }
                  } catch (err) {
                    console.error(err);
                    toast.error("Erreur lors de la déconnexion");
                  }
                }}
                className="px-4 py-2 rounded bg-amber-600 hover:bg-amber-700 text-white"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}