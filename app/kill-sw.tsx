"use client"

import { useEffect } from "react"

export function KillServiceWorker() {
  useEffect(() => {
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister()
          console.log("Service worker killed")
        }
      })
    }
  }, [])
  return null
}
