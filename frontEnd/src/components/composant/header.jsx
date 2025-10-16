// src/components/Header.jsx
import { FaBars } from "react-icons/fa";

export default function Header({ onOpen }) {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 border-b border-gray-50 bg-white dark:border-gray-950 dark:bg-gray-900 shadow z-50 flex items-center px-4">
      <button
        onClick={() => onOpen(true)}
        className="md:hidden text-gray-700 dark:text-gray-200 text-2xl"
        aria-label="Ouvrir le menu"
      >

        <FaBars />
      </button>

      <h1 className="text-lg font-bold text-gray-800 dark:text-gray-200 ml-5">
        MonApplication
      </h1>

    </header>
  );
}
