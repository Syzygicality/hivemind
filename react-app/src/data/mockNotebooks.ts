// Mock notebook data shaped similarly to the backend serializers
const mockNotebooks = [
  {
    notebook_id: 'nb-1',
    title: 'Math Notes',
    admin: { id: 'u-1', username: 'alice', email: 'alice@example.com' },
    user_ids: [{ id: 'u-1', username: 'alice' }],
    isPrivate: true,
    contributors: [],
    created_at: '2025-01-10T10:00:00Z',
    updated_at: '2025-02-02T12:00:00Z',
    pages: [
      { page_id: 'p-1', title: 'Algebra', latest_version: { version_id: 'v-1', created_at: '2025-01-10T10:05:00Z' } },
    ],
  },
  {
    notebook_id: 'nb-2',
    title: 'Chemistry Notes',
    admin: { id: 'u-2', username: 'bob', email: 'bob@example.com' },
    user_ids: [{ id: 'u-2', username: 'bob' }],
    isPrivate: true,
    contributors: [],
    created_at: '2025-02-01T08:30:00Z',
    updated_at: '2025-02-05T09:00:00Z',
    pages: [
      { page_id: 'p-2', title: 'Organic Chemistry', latest_version: { version_id: 'v-2', created_at: '2025-02-01T08:35:00Z' } },
      { page_id: 'p-3', title: 'Inorganic Chemistry', latest_version: { version_id: 'v-3', created_at: '2025-02-03T11:00:00Z' } },
    ],
  },
  {
    notebook_id: 'nb-3',
    title: 'History Notes',
    admin: { id: 'u-3', username: 'carol', email: 'carol@example.com' },
    user_ids: [{ id: 'u-3', username: 'carol' }, { id: 'u-1', username: 'alice' }, { id: 'u-2', username: 'bob' }],
    isPrivate: false,
    contributors: ['Alice Johnson', 'Bob Smith'],
    created_at: '2024-11-12T09:00:00Z',
    updated_at: '2025-01-15T14:20:00Z',
    pages: [
      { page_id: 'p-4', title: 'World War II', latest_version: { version_id: 'v-4', created_at: '2024-11-12T09:05:00Z' } },
    ],
  },
  {
    notebook_id: 'nb-4',
    title: 'Physics Notes',
    admin: { id: 'u-1', username: 'alice', email: 'alice@example.com' },
    user_ids: [{ id: 'u-1', username: 'alice' }],
    isPrivate: true,
    contributors: [],
    created_at: '2025-03-03T07:00:00Z',
    updated_at: '2025-03-04T07:00:00Z',
    pages: [
      { page_id: 'p-5', title: 'Classical Mechanics', latest_version: { version_id: 'v-5', created_at: '2025-03-03T07:05:00Z' } },
    ],
  },
]

export default mockNotebooks
