import { createContext, useState, useCallback, useEffect, useContext } from 'react'

export const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize from localStorage + sync memberships dari DB
  useEffect(() => {
    const init = async () => {
      const storedToken = localStorage.getItem('token')
      const storedUser = localStorage.getItem('user')

      if (storedToken && storedUser) {
        const parsedUser = JSON.parse(storedUser)
        setToken(storedToken)

        // Langsung fetch memberships terbaru dari tabel community_members
        try {
          const res = await fetch('http://localhost:3000/api/communities/my', {
            headers: { 'Authorization': `Bearer ${storedToken}` }
          })
          if (res.ok) {
            const communities = await res.json()
            const memberships = communities.map(c => ({
              community_id: c.id,
              community_role: c.community_role,
              status_keanggotaan: c.status_keanggotaan,
              nama_komunitas: c.name
            }))
            parsedUser.memberships = memberships
          }
        } catch (err) {
          console.error('Error fetching memberships on init:', err)
        }

        setUser(parsedUser)
        localStorage.setItem('user', JSON.stringify(parsedUser))
      }
      setIsLoading(false)
    }
    init()
  }, [])

  const login = useCallback(async (email, password) => {
    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Login failed')
      }

      const data = await response.json()
      const newToken = data.token
      const newUser = data.user

      setToken(newToken)
      setUser(newUser)
      localStorage.setItem('token', newToken)
      localStorage.setItem('user', JSON.stringify(newUser))

      return { success: true, user: newUser }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }, [])

  const register = useCallback(async (nama, email, password) => {
    try {
      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nama, email, password }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Registration failed')
      }

      const data = await response.json()
      return { success: true, userId: data.userId }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }, [])

  // Helper: Cek apakah user punya komunitas aktif
  const hasCommunity = user?.memberships && user.memberships.length > 0

  // Helper: Ambil role user di komunitas tertentu
  const getCommunityRole = useCallback((communityId) => {
    if (!user?.memberships) return null
    const membership = user.memberships.find(m => m.community_id === communityId)
    return membership ? membership.community_role : null
  }, [user])

  // Helper: Cek apakah user adalah pengurus (KETUA/SEKRETARIS/BENDAHARA)
  const isAdmin = useCallback((communityId) => {
    const role = getCommunityRole(communityId)
    return ['KETUA', 'SEKRETARIS', 'BENDAHARA'].includes(role)
  }, [getCommunityRole])

  // Refresh membership data dari tabel community_members
  const refreshMemberships = useCallback(async (currentToken) => {
    const tkn = currentToken || token
    if (!tkn) return
    try {
      const res = await fetch('http://localhost:3000/api/communities/my', {
        headers: { 'Authorization': `Bearer ${tkn}` }
      })
      if (res.ok) {
        const communities = await res.json()
        const memberships = communities.map(c => ({
          community_id: c.id,
          community_role: c.community_role,
          status_keanggotaan: c.status_keanggotaan,
          nama_komunitas: c.name
        }))

        setUser(prevUser => {
          if (!prevUser) return null
          const updatedUser = { ...prevUser, memberships }
          localStorage.setItem('user', JSON.stringify(updatedUser))
          return updatedUser
        })
      }
    } catch (err) {
      console.error('Error refreshing memberships:', err)
    }
  }, [token])

  // Auto-refresh memberships setiap kali app dimuat (sync dari DB community_members)
  useEffect(() => {
    if (token && user) {
      refreshMemberships(token)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const value = {
    user,
    token,
    isLoading,
    login,
    register,
    logout,
    isAuthenticated: !!token,
    hasCommunity,
    getCommunityRole,
    isAdmin,
    refreshMemberships,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
