import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function StatsScreen() {
  const navigate = useNavigate()
  useEffect(() => { navigate('/') }, [navigate])
  return null
}
