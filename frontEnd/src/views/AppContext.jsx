import { createContext, useContext } from "react";

export const AppContext = createContext(); // contexte vide

// Un hook pratique pour consommer le contexte
export function useAppContext() {
  return useContext(AppContext);
}
