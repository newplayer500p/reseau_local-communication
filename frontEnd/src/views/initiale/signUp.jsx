import { useRef, useState } from "react";
import { FaUser, FaCamera } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { sign_up } from "../../controller/user.controller";
import { useAppContext } from "../AppContext";

export default function SignUp() {
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [error, setError] = useState("");
  const [err, setErr] = useState("");
  const { state, setState, handleLogin } = useAppContext();

  const [status, setStatus] = useState("Utilisateur");
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false); // ✅ Nouveau state pour la popup

  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const onTakeImage = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setAvatar(selected);
      setError("");
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (avatar == null) {
      setError("Vous devez choisir une image");
      return;
    }
    if (nom === "" || email === "" || password === "") {
      setError("Vous devez compléter tous les champs");
      return;
    } else {
      setError("");
    }

    setLoading(true);

    const verdict = await sign_up(
      nom,
      email,
      password,
      status,
      avatar,
      handleLogin
    );

    if (verdict) {
      setState(!state);
      setLoading(false);
      navigate("/dashboardGenerale");
    } else if (verdict === false) {
      setLoading(false);
      setErr("Cet email est déjà utilisé");
    } else if (verdict === null) {
      setLoading(false);
      setErr("Une erreur s’est produite");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-gray-100">
        Inscription
      </h1>
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
        {/* Avatar */}
        <div className="relative w-full flex justify-center">
          <div className="w-30 h-30 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
            {avatar ? (
              <img
                src={URL.createObjectURL(avatar)}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <FaUser className="text-white w-15 h-15" />
            )}
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current.click()}
            className="relative top-20 -left-8 w-9 h-9 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center cursor-pointer hover:bg-blue-700"
          >
            <FaCamera className="text-white w-4 h-4" />
          </button>

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            capture="environment"
            onChange={onTakeImage}
          />
        </div>

        <br />
        <form onSubmit={onSubmit} className="space-y-4">
          {/* Nom */}
          <div>
            <label className="block mb-1 dark:text-white">
              Nom avec Prénom
            </label>
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Tiago Tuverie"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block mb-1 dark:text-white">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErr("");
              }}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="email@example.com"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block mb-1 dark:text-white">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          {/* Statut */}
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Quel est votre statut ?
            </label>

            <div role="radiogroup" aria-label="Statut" className="flex gap-3">
              {/* Utilisateur */}
              <label
                className={`flex-1 cursor-pointer select-none rounded-lg px-4 py-2 text-center border transition
                  ${
                    status === "Utilisateur"
                      ? "bg-green-500 text-white border-green-600 shadow-sm"
                      : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-700"
                  }`}
              >
                <input
                  type="radio"
                  name="status"
                  value="Utilisateur"
                  checked={status === "Utilisateur"}
                  onChange={() => setStatus("Utilisateur")}
                  className="sr-only"
                />
                Utilisateur
              </label>

              {/* Responsable */}
              <label
                className={`flex-1 cursor-pointer select-none rounded-lg px-4 py-2 text-center border transition
                  ${
                    status === "EnCours"
                      ? "bg-green-500 text-white border-green-600 shadow-sm"
                      : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-700"
                  }`}
              >
                <input
                  type="radio"
                  name="status"
                  value="EnCours"
                  checked={status === "EnCours"}
                  onChange={() => {
                    setStatus("EnCours");
                    setShowDialog(true); // ✅ ouvre le dialogue
                  }}
                  className="sr-only"
                />
                Responsable
              </label>
            </div>
          </div>

          {error && <p className="text-red-500">{error}</p>}
          {err !== "" && (
            <p className="items-center text-center text-red-500 mt-10">{err}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md shadow transition-opacity duration-150
              ${loading ? "cursor-not-allowed opacity-75" : ""}`}
          >
            {loading ? "Chargement..." : "S’inscrire"}
          </button>
        </form>

        {/* ✅ Dialogue (modal) */}
        {showDialog && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-80 text-center">
              <h2 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-100">
                Validation requise
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Le statut <strong>Responsable</strong> doit être validé par un
                administrateur. <br />
                En attendant, vous aurez les privilèges d’un{" "}
                <strong>Utilisateur</strong>.
              </p>
              <button
                onClick={() => setShowDialog(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                OK, j’ai compris
              </button>
            </div>
          </div>
        )}

        <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          Vous avez déjà un compte ?{" "}
          <Link to="/login" className="text-blue-600 hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
