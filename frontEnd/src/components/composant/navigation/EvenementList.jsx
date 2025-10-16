// src/components/event/EvenementList.jsx
import { useState, useEffect } from "react";
import { evenementService } from "../../../service/Evenement.service";
import { EvenementCard } from "../event/EvenementCard";
import { EvenementForm } from "../event/EvenementForm"
import { useAppContext } from "../../../views/AppContext";

export const EvenementList = () => {
  const { profile: user, dataServer } = useAppContext();
  const [evenements, setEvenements] = useState([]);
  const [total, setTotal] = useState(0);
  const [filterPriority, setFilterPriority] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchEvenements = async (opts = {}) => {
    const { page = 1 } = opts;
    setLoading(page === 1);
    setLoadingMore(page > 1);
    try {
      // si ton backend gère skip/limit tu peux ajouter params: { skip: (page-1)*pageSize, limit: pageSize }
      const res = await evenementService.getAnonce();
      const items = Array.isArray(res.data?.items) ? res.data.items : [];
      const totalCount = Number(res.data?.total ?? items.length);
      if (page === 1) {
        setEvenements(items);
      } else {
        setEvenements(prev => [...prev, ...items]);
      }
      setTotal(totalCount);
    } catch (err) {
      console.error("Erreur fetchEvenements", err);
      setEvenements([]);
      setTotal(0);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchEvenements({ page: 1 });
  }, []);

  useEffect(() => {
    const handleAnnonceChanged = (event) => {
      console.log("Annonce changed event received:", event.detail);
      fetchEvenements();
    };

    window.addEventListener("anonces-changed", handleAnnonceChanged);

    return () => {
      window.removeEventListener("anonces-changed", handleAnnonceChanged);
    };
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer cet événement ?")) return;
    try {
      await evenementService.deleteAnonce(id);
      setEvenements(prev => prev.filter(e => e._id !== id));
      setTotal(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Erreur suppression", err);
      alert("Impossible de supprimer l'événement.");
    }
  };

  const filtered = evenements.filter(ev => {
    if (filterPriority && ev.priority !== filterPriority) return false;
    if (query) {
      const q = query.toLowerCase();
      const inTitle = (ev.title || "").toLowerCase().includes(q);
      const inDesc = (ev.description || "").toLowerCase().includes(q);
      return inTitle || inDesc;
    }
    return true;
  });

  // Unique priorities (normalize case: backend peut renvoyer "haute" ou "Haute")
  const existingPriorities = [...new Set(evenements.map(e => {
    const p = e.priority || "";
    return p.charAt(0).toUpperCase() + p.slice(1);
  }))];

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchEvenements({ page: next });
  };

  return (
    <div className="space-y-6 mt-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">📌Annonce</h2>
          <p className="text-sm text-gray-500">Total : {total}</p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Recherche titre ou description..."
            className={`px-3 py-2 border rounded w-64 ${
              query==="" ? "border border-gray-300 dark:border-gray-700"
              : "border-2 border-blue-500 focus:outline-0"
            }`}
          />
        </div>
      </div>

      {/* Formulaire création (si droit) */}
      <EvenementForm onCreated={() => fetchEvenements({ page: 1 })} />

      {/* Filtres */}
      {evenements.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterPriority("")}
            className={`px-3 py-1 rounded ${filterPriority === "" ? "bg-blue-600 text-white" : "bg-gray-100"}`}
          >
            Tout
          </button>
          {["Critique","Haute","Moyen","Basse"].map(p => (
            existingPriorities.includes(p) && (
              <button
                key={p}
                onClick={() => setFilterPriority(p)}
                className={`px-3 py-1 rounded ${filterPriority === p ? "bg-blue-600 text-white" : "bg-gray-100"}`}
              >
                {p}
              </button>
            )
          ))}
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-100 p-4 rounded" style={{ minHeight: 80 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {evenements.length === 0 ? "Aucun événement à afficher" : `Aucun événement pour votre recherche / filtre.`}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(ev => (
            <EvenementCard
              key={ev._id}
              evenement={ev}
              onDelete={handleDelete}
              currentUser={user}
              dataServer={dataServer}
            />
          ))}
        </div>
      )}

      {/* pagination simple */}
      {evenements.length < total && (
        <div className="text-center">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            {loadingMore ? "Chargement..." : "Afficher plus"}
          </button>
        </div>
      )}
    </div>
  );
};
