import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../../controller/user.controller";
import { useAppContext } from "../AppContext";

export default function Login() {

  const { state, setState, handleLogin } = useAppContext();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    const verdict = await login(email, password, handleLogin);

    console.log(verdict)

    if (verdict){
        setState(!state);
        setLoading(false);
        navigate("/dashboardGenerale");
    } else{
      setLoading(false);
      setErr("Verifier votre information.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-gray-100">
          Connexion
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 text-gray-700 dark:text-gray-300">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setErr("")
              }}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="email@example.com"
            />
          </div>

          <div>
            <label className="block mb-1 text-gray-700 dark:text-gray-300">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setErr("")
              }}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          {
            err !== "" && <p className="items-center text-center text-red-500 mt-10">{err}</p>
          }

          <button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            className={`w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md shadow transition-opacity duration-150
                ${loading ? "cursor-not-allowed opacity-75 hover:bg-blue-600" : ""}`}
            >
            {loading ? (
                <span className="inline-flex items-center justify-center gap-2">
                {/* spinner */}
                <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
                <span>Se connecter...</span>
                </span>
            ) : (
                "Se connecter"
            )}
        </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          Pas encore de compte ? <Link to="/signUp" className="text-blue-600 hover:underline">S'inscrire</Link>
        </p>
      </div>
    </div>
  );
}
