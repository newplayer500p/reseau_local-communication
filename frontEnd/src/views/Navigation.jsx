// src/components/NavigationRail.jsx
import { FaTimes } from "react-icons/fa";
import { Link } from "react-router-dom";

export default function NavigationRail({ open, setOpen, status }) {

  const links = [
    { to: "/dashboardGenerale/", label: "Annonce et Evenement" },
    { to: "/dashboardGenerale/publicationFile", label: "Documents publics partagés" },
    { to: "/dashboardGenerale/discussions", label: "Messagerie et Salon de discussion" },
    { to: "/dashboardGenerale/depot", label: "Mes envois" },
    { to: "/dashboardGenerale/autre", label: "A propos | Autre" },
    { to: "/dashboardGenerale/profil", label: "Mon profil" },
  ];

  if (status === "Admin") links.push({ to: "/dashboardGenerale/admin", label: "Espace Administrateur" })

  return (
    <>
      {/* Overlay mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer / Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-900 shadow-lg z-50 transform transition-transform duration-300 border-r border-gray-200 dark:border-gray-800
          ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">Menu</h2>
          {/* Close button visible only on mobile */}
          <button
            onClick={() => setOpen(false)}
            className="md:hidden text-gray-700 dark:text-gray-200 transform transition-transform duration-200 hover:scale-110"
            aria-label="Fermer le menu"
          >
            <FaTimes size={20} />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {links.map((link, index) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setOpen(false)} // ferme le drawer sur mobil
              className={`block text-gray-700 dark:text-gray-200 hover:text-blue-500 ${index!=links.length-1 ? "border-b-2 py-3 border-gray-300": "border-b-3 py-3 border-gray-100"}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}
