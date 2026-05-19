"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type { AccountPersona } from "@/types";
import { usePersonas } from "@/hooks/usePersonas";

interface PersonaContextValue {
  personas: AccountPersona[];
  activePersona: AccountPersona | null;
  setActivePersona: (persona: AccountPersona) => void;
  getPersonaByHandle: (handle: string) => AccountPersona | undefined;
}

const PersonaContext = createContext<PersonaContextValue | null>(null);

export function PersonaProvider({ children }: { children: ReactNode }) {
  const { data: personas } = usePersonas();
  const personasList = personas ?? [];
  const [activePersona, setActivePersona] = useState<AccountPersona | null>(
    null
  );

  useEffect(() => {
    if (!activePersona && personasList.length > 0) {
      setActivePersona(personasList[0]);
    }
  }, [activePersona, personasList]);

  const getPersonaByHandle = useCallback(
    (handle: string) => personasList.find((p) => p.account_handle === handle),
    [personasList]
  );

  return (
    <PersonaContext.Provider
      value={{
        personas: personasList,
        activePersona,
        setActivePersona,
        getPersonaByHandle,
      }}
    >
      {children}
    </PersonaContext.Provider>
  );
}

export function usePersonaContext() {
  const context = useContext(PersonaContext);
  if (!context) {
    throw new Error("usePersonaContext must be used within a PersonaProvider");
  }
  return context;
}
