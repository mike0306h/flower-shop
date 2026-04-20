'use client'

import { createContext, useContext, useState, useEffect } from 'react'

const AddressContext = createContext()

export function AddressProvider({ children }) {
  const [addresses, setAddresses] = useState([])
  const [defaultAddress, setDefaultAddress] = useState(null)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('flower_addresses')
      const defaultAddr = localStorage.getItem('flower_default_address')
      if (saved) {
        setAddresses(JSON.parse(saved))
      }
      if (defaultAddr) {
        setDefaultAddress(JSON.parse(defaultAddr))
      }
    } catch (e) {}
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (isHydrated) {
      try {
        localStorage.setItem('flower_addresses', JSON.stringify(addresses))
      } catch (e) {}
    }
  }, [addresses, isHydrated])

  useEffect(() => {
    if (isHydrated && defaultAddress) {
      try {
        localStorage.setItem('flower_default_address', JSON.stringify(defaultAddress))
      } catch (e) {}
    }
  }, [defaultAddress, isHydrated])

  const addAddress = (address) => {
    const newAddress = {
      id: Date.now().toString(),
      ...address,
      isDefault: addresses.length === 0,
    }
    setAddresses(prev => [...prev, newAddress])
    if (addresses.length === 0) {
      setDefaultAddress(newAddress)
    }
    return newAddress
  }

  const updateAddress = (id, updates) => {
    setAddresses(prev => {
      const updated = prev.map(addr =>
        addr.id === id ? { ...addr, ...updates } : addr
      )
      return updated
    })
    if (defaultAddress?.id === id) {
      setDefaultAddress(prev => ({ ...prev, ...updates }))
    }
  }

  const removeAddress = (id) => {
    setAddresses(prev => prev.filter(addr => addr.id !== id))
    if (defaultAddress?.id === id) {
      const remaining = addresses.filter(addr => addr.id !== id)
      setDefaultAddress(remaining.length > 0 ? remaining[0] : null)
    }
  }

  const setAsDefault = (id) => {
    const addr = addresses.find(a => a.id === id)
    if (!addr) return

    setAddresses(prev => prev.map(a => ({
      ...a,
      isDefault: a.id === id,
    })))
    setDefaultAddress({ ...addr, isDefault: true })
  }

  return (
    <AddressContext.Provider value={{
      addresses,
      defaultAddress,
      addAddress,
      updateAddress,
      removeAddress,
      setAsDefault,
      isHydrated,
    }}>
      {children}
    </AddressContext.Provider>
  )
}

export function useAddress() {
  return useContext(AddressContext)
}
