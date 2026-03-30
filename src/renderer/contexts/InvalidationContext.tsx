import React, { createContext, useContext, useCallback, useRef } from 'react'

type Domain = 'folders' | 'testCases' | 'testPlans' | 'testCycles' | 'assignments' | 'reports'
type Listener = () => void

interface InvalidationContextType {
  invalidate: (domain: Domain) => void
  subscribe: (domain: Domain, listener: Listener) => () => void
}

const InvalidationContext = createContext<InvalidationContextType | null>(null)

export function InvalidationProvider({ children }: { children: React.ReactNode }) {
  const listenersRef = useRef<Map<Domain, Set<Listener>>>(new Map())

  const subscribe = useCallback((domain: Domain, listener: Listener) => {
    if (!listenersRef.current.has(domain)) {
      listenersRef.current.set(domain, new Set())
    }
    listenersRef.current.get(domain)!.add(listener)
    return () => {
      listenersRef.current.get(domain)?.delete(listener)
    }
  }, [])

  const invalidate = useCallback((domain: Domain) => {
    listenersRef.current.get(domain)?.forEach((fn) => fn())
  }, [])

  return (
    <InvalidationContext.Provider value={{ invalidate, subscribe }}>
      {children}
    </InvalidationContext.Provider>
  )
}

export function useInvalidation() {
  const ctx = useContext(InvalidationContext)
  if (!ctx) throw new Error('useInvalidation must be used within InvalidationProvider')
  return ctx
}
