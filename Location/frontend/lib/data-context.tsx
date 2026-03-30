"use client"

import React, { createContext, useContext, useReducer, type ReactNode } from "react"
import type { Bien, Client, Contrat, Paiement, Depense, Utilisateur } from "./types"
import {
  biensInitiaux,
  clientsInitiaux,
  contratsInitiaux,
  paiementsInitiaux,
  depensesInitiales,
  utilisateurs,
} from "./mock-data"

// ==============================
// State
// ==============================

interface AppState {
  biens: Bien[]
  clients: Client[]
  contrats: Contrat[]
  paiements: Paiement[]
  depenses: Depense[]
  utilisateurActuel: Utilisateur
}

const initialState: AppState = {
  biens: biensInitiaux,
  clients: clientsInitiaux,
  contrats: contratsInitiaux,
  paiements: paiementsInitiaux,
  depenses: depensesInitiales,
  utilisateurActuel: utilisateurs[0],
}

// ==============================
// Actions
// ==============================

type Action =
  // Biens
  | { type: "ADD_BIEN"; payload: Bien }
  | { type: "UPDATE_BIEN"; payload: Bien }
  | { type: "DELETE_BIEN"; payload: string }
  // Clients
  | { type: "ADD_CLIENT"; payload: Client }
  | { type: "UPDATE_CLIENT"; payload: Client }
  | { type: "DELETE_CLIENT"; payload: string }
  // Contrats
  | { type: "ADD_CONTRAT"; payload: Contrat }
  | { type: "UPDATE_CONTRAT"; payload: Contrat }
  | { type: "DELETE_CONTRAT"; payload: string }
  // Paiements
  | { type: "ADD_PAIEMENT"; payload: Paiement }
  | { type: "UPDATE_PAIEMENT"; payload: Paiement }
  // Dépenses
  | { type: "ADD_DEPENSE"; payload: Depense }
  | { type: "UPDATE_DEPENSE"; payload: Depense }
  | { type: "DELETE_DEPENSE"; payload: string }

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    // Biens
    case "ADD_BIEN":
      return { ...state, biens: [...state.biens, action.payload] }
    case "UPDATE_BIEN":
      return {
        ...state,
        biens: state.biens.map((b) => (b.id === action.payload.id ? action.payload : b)),
      }
    case "DELETE_BIEN":
      return { ...state, biens: state.biens.filter((b) => b.id !== action.payload) }

    // Clients
    case "ADD_CLIENT":
      return { ...state, clients: [...state.clients, action.payload] }
    case "UPDATE_CLIENT":
      return {
        ...state,
        clients: state.clients.map((c) => (c.id === action.payload.id ? action.payload : c)),
      }
    case "DELETE_CLIENT":
      return { ...state, clients: state.clients.filter((c) => c.id !== action.payload) }

    // Contrats
    case "ADD_CONTRAT":
      return { ...state, contrats: [...state.contrats, action.payload] }
    case "UPDATE_CONTRAT":
      return {
        ...state,
        contrats: state.contrats.map((c) => (c.id === action.payload.id ? action.payload : c)),
      }
    case "DELETE_CONTRAT":
      return { ...state, contrats: state.contrats.filter((c) => c.id !== action.payload) }

    // Paiements
    case "ADD_PAIEMENT":
      return { ...state, paiements: [...state.paiements, action.payload] }
    case "UPDATE_PAIEMENT":
      return {
        ...state,
        paiements: state.paiements.map((p) => (p.id === action.payload.id ? action.payload : p)),
      }

    // Dépenses
    case "ADD_DEPENSE":
      return { ...state, depenses: [...state.depenses, action.payload] }
    case "UPDATE_DEPENSE":
      return {
        ...state,
        depenses: state.depenses.map((d) => (d.id === action.payload.id ? action.payload : d)),
      }
    case "DELETE_DEPENSE":
      return { ...state, depenses: state.depenses.filter((d) => d.id !== action.payload) }

    default:
      return state
  }
}

// ==============================
// Context
// ==============================

interface AppContextType extends AppState {
  dispatch: React.Dispatch<Action>
  // Helper lookups
  getBien: (id: string) => Bien | undefined
  getClient: (id: string) => Client | undefined
  getContrat: (id: string) => Contrat | undefined
  getContratsForBien: (bienId: string) => Contrat[]
  getContratsForClient: (clientId: string) => Contrat[]
  getPaiementsForContrat: (contratId: string) => Paiement[]
  getDepensesForBien: (bienId: string) => Depense[]
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function DataProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  const getBien = (id: string) => state.biens.find((b) => b.id === id)
  const getClient = (id: string) => state.clients.find((c) => c.id === id)
  const getContrat = (id: string) => state.contrats.find((c) => c.id === id)
  const getContratsForBien = (bienId: string) => state.contrats.filter((c) => c.bienId === bienId)
  const getContratsForClient = (clientId: string) =>
    state.contrats.filter((c) => c.clientId === clientId)
  const getPaiementsForContrat = (contratId: string) =>
    state.paiements.filter((p) => p.contratId === contratId)
  const getDepensesForBien = (bienId: string) => state.depenses.filter((d) => d.bienId === bienId)

  return (
    <AppContext.Provider
      value={{
        ...state,
        dispatch,
        getBien,
        getClient,
        getContrat,
        getContratsForBien,
        getContratsForClient,
        getPaiementsForContrat,
        getDepensesForBien,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useAppData() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error("useAppData must be used within a DataProvider")
  }
  return context
}
