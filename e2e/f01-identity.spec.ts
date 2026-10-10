import { test, expect } from '@playwright/test'
import type { User } from '@supabase/supabase-js'
import { discordIdOf } from '../src/lib/discordId'

// Pure checks: who the app thinks the viewer is.
function user(fields: Partial<User>): User {
  return { id: 'u1', app_metadata: {}, user_metadata: {}, aud: 'authenticated', created_at: '', ...fields } as User
}

test.describe('F01 identity comes from the Discord identity, not metadata', () => {
  test('F01-H4 reads the ID from the discord identity', () => {
    const u = user({ identities: [{ id: '111', identity_id: 'x', user_id: 'u1', provider: 'discord' }] })
    expect(discordIdOf(u)).toBe('111')
  })

  test('F01-N5 ignores an ID written into user_metadata', () => {
    const u = user({
      user_metadata: { provider_id: '999', sub: '999' },
      identities: [{ id: '111', identity_id: 'x', user_id: 'u1', provider: 'discord' }],
    })
    expect(discordIdOf(u)).toBe('111')
  })

  test('F01-N6 no discord identity means no ID, whatever metadata says', () => {
    const u = user({
      user_metadata: { provider_id: '999' },
      identities: [{ id: 'u1', identity_id: 'y', user_id: 'u1', provider: 'email' }],
    })
    expect(discordIdOf(u)).toBeUndefined()
  })
})
