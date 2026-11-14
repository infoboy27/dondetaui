import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import BlackFridayDigestScreen from './BlackFridayDigestScreen'
import { digestsApi } from '../api/digests'

vi.mock('../api/digests', () => ({
  digestsApi: {
    status: vi.fn(),
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
    unsubscribeByToken: vi.fn(),
  },
}))

const api = vi.mocked(digestsApi)
const user = { id: 'u1', email: 'ana@example.com', name: 'Ana', emailVerified: true }
const noop = async () => {}

function renderAt(search: string, signedIn: boolean) {
  window.history.replaceState(null, '', `/cuenta/black-friday${search}`)
  return render(
    <BlackFridayDigestScreen user={signedIn ? user : null} onBack={() => {}} onLogin={noop} onRegister={noop} authLoading={false} authError={null} />,
  )
}

afterEach(() => vi.clearAllMocks())

describe('BlackFridayDigestScreen', () => {
  it('subscribes right away when a signed-in user arrives from the ad (?activar=1)', async () => {
    api.status.mockResolvedValue(false)
    api.subscribe.mockResolvedValue(true)
    renderAt('?activar=1', true)
    expect(await screen.findByText(/¡Listo! Te enviaremos a ana@example.com/)).toBeInTheDocument()
    expect(api.subscribe).toHaveBeenCalledWith('black-friday')
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true')
  })

  it('only shows the status when opened from Perfil (no auto-subscribe)', async () => {
    api.status.mockResolvedValue(false)
    renderAt('', true)
    await waitFor(() => expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false'))
    expect(api.subscribe).not.toHaveBeenCalled()
  })

  it('asks guests to create an account, starting on the register tab', () => {
    renderAt('?activar=1', false)
    expect(screen.getByText('Crea tu cuenta gratis para recibirlas')).toBeInTheDocument()
    expect(api.status).not.toHaveBeenCalled()
  })

  it('unsubscribes with the email token without signing in', async () => {
    api.unsubscribeByToken.mockResolvedValue()
    renderAt(`?baja=${'a'.repeat(48)}`, false)
    expect(await screen.findByText(/ya no te enviaremos/)).toBeInTheDocument()
    expect(api.unsubscribeByToken).toHaveBeenCalledWith('a'.repeat(48))
  })
})
