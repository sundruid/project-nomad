import * as assert from 'node:assert/strict'
import { test } from 'node:test'

import { buildBearerAuthHeaders } from '../../app/utils/remote_ai_auth.js'

test('builds a bearer authorization header for a configured API key', () => {
  assert.deepEqual(buildBearerAuthHeaders('  sk-example  '), {
    Authorization: 'Bearer sk-example',
  })
})

test('does not add an authorization header when no API key is configured', () => {
  assert.deepEqual(buildBearerAuthHeaders(undefined), {})
  assert.deepEqual(buildBearerAuthHeaders(null), {})
  assert.deepEqual(buildBearerAuthHeaders('   '), {})
})
