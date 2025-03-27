"use client"

import { useEffect } from "react"

export default function Particles() {
  useEffect(() => {
    const container = document.getElementById("particles-container")
    if (!container) return

    const createParticle = () => {
      const particle = document.createElement("div")
      particle.style.position = "absolute"
      particle.style.width = "6px"
      particle.style.height = "6px"
      particle.style.borderRadius = "50%"
      particle.style.background = "rgba(59, 130, 246, 0.3)"
      particle.style.boxShadow = "0 0 10px rgba(59, 130, 246, 0.5)"

      // Random position
      const x = Math.random() * 100
      const y = Math.random() * 100
      particle.style.left = `${x}%`
      particle.style.top = `${y}%`

      // Random size
      const size = Math.random() * 4 + 2
      particle.style.width = `${size}px`
      particle.style.height = `${size}px`

      // Animation
      particle.style.transition = "transform 15s linear, opacity 15s linear"
      particle.style.opacity = "0"

      container.appendChild(particle)

      // Start animation after a small delay
      setTimeout(() => {
        const moveX = (Math.random() - 0.5) * 50
        const moveY = (Math.random() - 0.5) * 50
        particle.style.transform = `translate(${moveX}px, ${moveY}px)`
        particle.style.opacity = "0.7"

        // Remove particle after animation
        setTimeout(() => {
          container.removeChild(particle)
        }, 15000)
      }, 10)
    }

    // Create initial particles
    for (let i = 0; i < 30; i++) {
      createParticle()
    }

    // Create new particles periodically
    const interval = setInterval(() => {
      createParticle()
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return null
}
