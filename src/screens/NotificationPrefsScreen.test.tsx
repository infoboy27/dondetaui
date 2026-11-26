import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import NotificationPrefsScreen from './NotificationPrefsScreen'
import { notificationPrefsApi, savedSearchesApi } from '../api/notificationPrefs'
import { ApiError } from '../api/http'
import { defaultPrefs } from '../domain/notificationPrefs'

vi.mock('../api/notificationPrefs', () => ({
  notificationPrefsApi: { get: vi.fn(), update: vi.fn() },
  savedSearchesApi: { list: vi.fn(), remove: vi.fn() },
}))

const prefsApi = vi.mocked(notificationPrefsApi)
const searchesApi = vi.mocked(savedSearchesApi)
const user = { id: 'u1', email: 'ana@example.com', name: 'Ana', emailVerified: true }
const search = { id: 's1', query: 'nevera', maxPrice: 25000, createdAt: '2026-11-01T00:00:00Z' }

function renderScreen(signedIn = true, onLogin = () => {}) {
  return render(<NotificationPrefsScreen user={signedIn ? user : null} onBack={() => {}} onLogin={onLogin} />)
}

afterEach(() => vi.clearAllMocks())

describe('NotificationPrefsScreen', () => {
  it('shows each switch with its saved value: alerts on, promotions off by default', async () => {
    prefsApi.get.mockResolvedValue(defaultPrefs())
    searchesApi.list.mockResolvedValue([search])
    renderScreen()
    expect(await screen.findByRole('switch', { name: 'Volvió a estar disponible' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('switch', { name: 'Resumen semanal' })).toHaveAttribute('aria-checked', 'false')
    expect(screen.getAllByRole('switch')).toHaveLength(6)
    expect(screen.getByText('nevera')).toBeInTheDocument()
    expect(screen.getByText(/^Hasta RD\$25.000$/)).toBeInTheDocument()
  })

  it('saves a switch change', async () => {
    prefsApi.get.mockResolvedValue(defaultPrefs())
    searchesApi.list.mockResolvedValue([])
    prefsApi.update.mockResolvedValue({ ...defaultPrefs(), weekly_digest: true })
    renderScreen()
    fireEvent.click(await screen.findByRole('switch', { name: 'Resumen semanal' }))
    expect(prefsApi.update).toHaveBeenCalledWith({ weekly_digest: true })
    await waitFor(() => expect(screen.getByRole('switch', { name: 'Resumen semanal' })).toHaveAttribute('aria-checked', 'true'))
  })

  it('rolls the switch back and explains when saving fails', async () => {
    prefsApi.get.mockResolvedValue(defaultPrefs())
    searchesApi.list.mockResolvedValue([])
    prefsApi.update.mockRejectedValue(new ApiError('Ese tipo de aviso no existe.', 400))
    renderScreen()
    fireEvent.click(await screen.findByRole('switch', { name: 'Precio más bajo en 90 días' }))
    expect(await screen.findByText('Ese tipo de aviso no existe.')).toBeInTheDocument()
    expect(screen.getByRole('switch', { name: 'Precio más bajo en 90 días' })).toHaveAttribute('aria-checked', 'true')
  })

  it('removes a saved search after confirming', async () => {
    prefsApi.get.mockResolvedValue(defaultPrefs())
    searchesApi.list.mockResolvedValue([search])
    searchesApi.remove.mockResolvedValue()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    renderScreen()
    fireEvent.click(await screen.findByRole('button', { name: 'Borrar búsqueda nevera' }))
    await waitFor(() => expect(screen.queryByText('nevera')).not.toBeInTheDocument())
    expect(searchesApi.remove).toHaveBeenCalledWith('s1')
    expect(screen.getByText('Aún no tienes búsquedas guardadas.')).toBeInTheDocument()
  })

  it('asks guests to sign in and loads nothing', () => {
    const onLogin = vi.fn()
    renderScreen(false, onLogin)
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
    expect(onLogin).toHaveBeenCalled()
    expect(prefsApi.get).not.toHaveBeenCalled()
  })
})
