import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import Cookies from 'js-cookie'
import { AuthContext } from './AuthContext'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
const STORAGE_KEY = 'fiscal_year_cedula_id'

const FiscalYearContext = createContext(null)

export function FiscalYearProvider({ children }) {
  const currentYear = new Date().getFullYear()
  const [cedulas,        setCedulas]        = useState([])
  const [selectedCedula, setSelectedCedula] = useState(null)
  const [loading,        setLoading]        = useState(true)

  const { isAuthenticated } = useContext(AuthContext)

  const fetchCedulas = useCallback(async () => {
    try {
      const token = Cookies.get('auth_token')
      const res  = await fetch(`${API}/certificacion/cedulas-presupuestarias`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const json = await res.json()
      if (json.success && json.data?.length) {
        const sorted = [...json.data].sort((a, b) => b.anio - a.anio)
        setCedulas(sorted)

        const savedId    = localStorage.getItem(STORAGE_KEY)
        const savedCed   = savedId ? sorted.find(c => String(c.id_cedula_presupuestaria) === savedId) : null
        const currentCed = sorted.find(c => c.anio === currentYear)
        setSelectedCedula(currentCed || savedCed || sorted[0])
      }
    } catch {
      // error silencioso — UI mantiene estado vacío
    } finally {
      setLoading(false)
    }
  }, [currentYear])

  useEffect(() => {
    if (isAuthenticated) {
      fetchCedulas()
    } else {
      setCedulas([])
      setSelectedCedula(null)
      setLoading(false)
    }
  }, [isAuthenticated, fetchCedulas])

  const changeCedula = (cedula) => {
    setSelectedCedula(cedula)
    localStorage.setItem(STORAGE_KEY, String(cedula.id_cedula_presupuestaria))
  }

  const isReadOnly = selectedCedula ? selectedCedula.anio !== currentYear : false

  return (
    <FiscalYearContext.Provider value={{
      cedulas,
      selectedCedula,
      currentYear,
      isReadOnly,
      loading,
      changeCedula,
      refetchCedulas: fetchCedulas,
    }}>
      {children}
    </FiscalYearContext.Provider>
  )
}

export function useFiscalYear() {
  const ctx = useContext(FiscalYearContext)
  if (!ctx) throw new Error('useFiscalYear debe usarse dentro de FiscalYearProvider')
  return ctx
}
