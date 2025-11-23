// Mock data untuk development tanpa Supabase

export interface MockElection {
  id: string
  title: string
  description: string
  hero_banner_url: string | null
  start_date: string | null
  end_date: string | null
  is_active: boolean
  allow_view_results: boolean
  created_at: string
  updated_at: string
}

export interface MockCandidate {
  id: string
  election_id: string
  name: string
  description: string
  photo_url: string | null
  order_index: number
  created_at: string
  updated_at: string
}

export interface MockVote {
  id: string
  election_id: string
  category_id: string | null
  candidate_id: string
  voter_token: string
  created_at: string
}

export interface MockVotingSession {
  id: string
  election_id: string
  qr_code: string
  is_active: boolean
  created_at: string
  expires_at: string | null
}

export interface MockCategory {
  id: string
  election_id: string
  name: string
  description: string | null
  icon_url: string | null
  order_index: number
  is_active: boolean
  created_at: string
  updated_at: string
}

// Storage keys
const STORAGE_KEYS = {
  elections: 'mock_elections',
  candidates: 'mock_candidates',
  votes: 'mock_votes',
  sessions: 'mock_sessions',
  categories: 'mock_categories',
}

// Initialize with sample data
const getInitialData = () => {
  const sampleElection: MockElection = {
    id: '1',
    title: 'Pilih Pejabat Favorit Anda 2025',
    description: 'Pilih Pejabat Favorit Anda',
    hero_banner_url: null,
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: true,
    allow_view_results: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const sampleCandidates: MockCandidate[] = [
    {
      id: '1',
      election_id: '1',
      name: 'John Smith',
      description: 'Experienced financial planner',
      photo_url: null,
      order_index: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '2',
      election_id: '1',
      name: 'Michael Lee',
      description: 'Tech-savvy innovator in finance',
      photo_url: null,
      order_index: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '3',
      election_id: '1',
      name: 'Emily Wong',
      description: 'Advocate for financial literacy',
      photo_url: null,
      order_index: 2,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]

  return { sampleElection, sampleCandidates }
}

// LocalStorage helpers
const getFromStorage = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch {
    return defaultValue
  }
}

const saveToStorage = <T>(key: string, value: T): void => {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error('Error saving to localStorage:', error)
  }
}

// Query builder untuk mock Supabase
class MockQueryBuilder {
  private table: string
  private filters: Array<{ column: string; value: any }> = []
  private orderBy?: { column: string; ascending: boolean }
  private limitCount?: number
  private selectColumns?: string

  constructor(table: string) {
    this.table = table
  }

  select(columns: string = '*') {
    this.selectColumns = columns
    return this
  }

  eq(column: string, value: any) {
    this.filters.push({ column, value })
    return this
  }

  order(column: string, options?: { ascending: boolean }) {
    this.orderBy = { column, ascending: options?.ascending !== false }
    return this
  }

  limit(count: number) {
    this.limitCount = count
    return this
  }

  async single() {
    const result = await this.execute()
    if (Array.isArray(result.data) && result.data.length > 0) {
      return { data: result.data[0], error: null }
    }
    return { data: null, error: { message: 'Not found' } }
  }

  async then(callback?: (result: any) => any) {
    const result = await this.execute()
    if (callback) {
      return callback(result)
    }
    return Promise.resolve(result)
  }

  async execute() {
    let data: any[] = []

    // Get data from storage
    switch (this.table) {
      case 'elections':
        data = getFromStorage<MockElection[]>(STORAGE_KEYS.elections, [])
        if (data.length === 0) {
          const { sampleElection } = getInitialData()
          data = [sampleElection]
          saveToStorage(STORAGE_KEYS.elections, data)
        }
        break
      case 'candidates':
        data = getFromStorage<MockCandidate[]>(STORAGE_KEYS.candidates, [])
        if (data.length === 0) {
          const { sampleCandidates } = getInitialData()
          data = sampleCandidates
          saveToStorage(STORAGE_KEYS.candidates, data)
        }
        break
      case 'categories':
        data = getFromStorage<MockCategory[]>(STORAGE_KEYS.categories, [])
        break
      case 'votes':
        data = getFromStorage<MockVote[]>(STORAGE_KEYS.votes, [])
        break
      case 'voting_sessions':
        data = getFromStorage<MockVotingSession[]>(STORAGE_KEYS.sessions, [])
        break
    }

    // Apply filters
    this.filters.forEach((filter) => {
      data = data.filter((item: any) => item[filter.column] === filter.value)
    })

    // Apply ordering
    if (this.orderBy) {
      data.sort((a: any, b: any) => {
        const aVal = a[this.orderBy!.column]
        const bVal = b[this.orderBy!.column]
        if (this.orderBy!.ascending) {
          return aVal < bVal ? -1 : aVal > bVal ? 1 : 0
        } else {
          return aVal > bVal ? -1 : aVal < bVal ? 1 : 0
        }
      })
    }

    // Apply limit
    if (this.limitCount) {
      data = data.slice(0, this.limitCount)
    }

    // Filter columns if specified
    if (this.selectColumns && this.selectColumns !== '*') {
      const columns = this.selectColumns.split(',').map((c) => c.trim())
      data = data.map((item: any) => {
        const filtered: any = {}
        columns.forEach((col) => {
          if (item.hasOwnProperty(col)) {
            filtered[col] = item[col]
          }
        })
        return filtered
      })
    }

    return { data, error: null }
  }
}

// Mock Supabase-like API
export const mockSupabase = {
  from: (table: string) => ({
    select: (columns?: string) => {
      const builder = new MockQueryBuilder(table)
      if (columns) builder.select(columns)
      return builder
    },
    insert: (data: any) => ({
      select: (columns?: string) => ({
        single: async () => {
          let newItem: any = {}
          const now = new Date().toISOString()

          switch (table) {
            case 'elections':
              const elections = getFromStorage<MockElection[]>(STORAGE_KEYS.elections, [])
              newItem = {
                id: Date.now().toString(),
                title: data.title || '',
                description: data.description || null,
                hero_banner_url: data.hero_banner_url || null,
                start_date: data.start_date || null,
                end_date: data.end_date || null,
                is_active: data.is_active ?? false,
                created_at: now,
                updated_at: now,
              }
              elections.push(newItem)
              saveToStorage(STORAGE_KEYS.elections, elections)
              break

            case 'candidates':
              const candidates = getFromStorage<MockCandidate[]>(STORAGE_KEYS.candidates, [])
              newItem = {
                id: Date.now().toString(),
                election_id: data.election_id || '',
                name: data.name || '',
                description: data.description || null,
                photo_url: data.photo_url || null,
                order_index: data.order_index ?? 0,
                created_at: now,
                updated_at: now,
              }
              candidates.push(newItem)
              saveToStorage(STORAGE_KEYS.candidates, candidates)
              break

            case 'categories':
              const categories = getFromStorage<MockCategory[]>(STORAGE_KEYS.categories, [])
              newItem = {
                id: Date.now().toString(),
                election_id: data.election_id || '',
                name: data.name || '',
                description: data.description || null,
                icon_url: data.icon_url || null,
                order_index: data.order_index ?? 0,
                is_active: data.is_active ?? true,
                created_at: now,
                updated_at: now,
              }
              categories.push(newItem)
              saveToStorage(STORAGE_KEYS.categories, categories)
              break

            case 'votes':
              const votes = getFromStorage<MockVote[]>(STORAGE_KEYS.votes, [])
              // Check existing votes for this voter in this election and category
              const existingVotes = votes.filter(
                (v) => 
                  v.election_id === data.election_id && 
                  v.voter_token === data.voter_token &&
                  v.category_id === (data.category_id || null)
              )
              
              // Allow up to 2 votes per voter per category
              if (existingVotes.length >= 2) {
                return { data: null, error: { code: '23505', message: 'Maximum votes reached' } }
              }
              
              // Check if voter is trying to vote for the same candidate twice
              const duplicateCandidate = existingVotes.find(
                (v) => v.candidate_id === data.candidate_id
              )
              if (duplicateCandidate) {
                return { data: null, error: { code: '23505', message: 'Cannot vote for the same candidate twice' } }
              }
              
              newItem = {
                id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9),
                election_id: data.election_id || '',
                category_id: data.category_id || null,
                candidate_id: data.candidate_id || '',
                voter_token: data.voter_token || '',
                created_at: now,
              }
              votes.push(newItem)
              saveToStorage(STORAGE_KEYS.votes, votes)
              break

            case 'voting_sessions':
              const sessions = getFromStorage<MockVotingSession[]>(STORAGE_KEYS.sessions, [])
              newItem = {
                id: Date.now().toString(),
                election_id: data.election_id || '',
                qr_code: data.qr_code || '',
                is_active: data.is_active ?? true,
                created_at: now,
                expires_at: data.expires_at || null,
              }
              sessions.push(newItem)
              saveToStorage(STORAGE_KEYS.sessions, sessions)
              break
          }

          return { data: newItem, error: null }
        },
      }),
    }),
    update: (data: any) => ({
      eq: (column: string, value: any) => ({
        then: async (callback?: (result: any) => any) => {
          let updated: any = null
          const now = new Date().toISOString()

          switch (table) {
            case 'elections':
              const elections = getFromStorage<MockElection[]>(STORAGE_KEYS.elections, [])
              const electionIndex = elections.findIndex((e: any) => e[column] === value)
              if (electionIndex !== -1) {
                elections[electionIndex] = { 
                  ...elections[electionIndex], 
                  ...data, 
                  allow_view_results: data.allow_view_results !== undefined ? data.allow_view_results : elections[electionIndex].allow_view_results,
                  updated_at: now 
                }
                updated = elections[electionIndex]
                saveToStorage(STORAGE_KEYS.elections, elections)
              }
              break

            case 'candidates':
              const candidates = getFromStorage<MockCandidate[]>(STORAGE_KEYS.candidates, [])
              const candidateIndex = candidates.findIndex((c: any) => c[column] === value)
              if (candidateIndex !== -1) {
                candidates[candidateIndex] = { ...candidates[candidateIndex], ...data, updated_at: now }
                updated = candidates[candidateIndex]
                saveToStorage(STORAGE_KEYS.candidates, candidates)
              }
              break

            case 'categories':
              const categories = getFromStorage<MockCategory[]>(STORAGE_KEYS.categories, [])
              const categoryIndex = categories.findIndex((c: any) => c[column] === value)
              if (categoryIndex !== -1) {
                categories[categoryIndex] = { ...categories[categoryIndex], ...data, updated_at: now }
                updated = categories[categoryIndex]
                saveToStorage(STORAGE_KEYS.categories, categories)
              }
              break

            case 'voting_sessions':
              const sessions = getFromStorage<MockVotingSession[]>(STORAGE_KEYS.sessions, [])
              const sessionIndex = sessions.findIndex((s: any) => s[column] === value)
              if (sessionIndex !== -1) {
                sessions[sessionIndex] = { ...sessions[sessionIndex], ...data }
                updated = sessions[sessionIndex]
                saveToStorage(STORAGE_KEYS.sessions, sessions)
              }
              break
          }

          const result = { data: updated, error: updated ? null : { message: 'Not found' } }
          if (callback) return callback(result)
          return result
        },
      }),
    }),
    delete: () => ({
      eq: (column: string, value: any) => ({
        then: async (callback?: (result: any) => any) => {
          switch (table) {
            case 'elections':
              const elections = getFromStorage<MockElection[]>(STORAGE_KEYS.elections, [])
              const filteredElections = elections.filter((e: any) => e[column] !== value)
              saveToStorage(STORAGE_KEYS.elections, filteredElections)
              break

            case 'candidates':
              const candidates = getFromStorage<MockCandidate[]>(STORAGE_KEYS.candidates, [])
              const filteredCandidates = candidates.filter((c: any) => c[column] !== value)
              saveToStorage(STORAGE_KEYS.candidates, filteredCandidates)
              break

            case 'categories':
              const categories = getFromStorage<MockCategory[]>(STORAGE_KEYS.categories, [])
              const filteredCategories = categories.filter((c: any) => c[column] !== value)
              saveToStorage(STORAGE_KEYS.categories, filteredCategories)
              break
          }

          const result = { data: null, error: null }
          if (callback) return callback(result)
          return result
        },
      }),
    }),
  }),

  // Realtime subscription (mock)
  channel: (name: string) => ({
    on: (event: string, config: any, callback: () => void) => {
      return {
        subscribe: () => {
          // Mock realtime - just return unsubscribe function
          return {
            unsubscribe: () => {},
          }
        },
      }
    },
  }),
  removeChannel: () => {},
}

// Initialize sample data on first load
if (typeof window !== 'undefined') {
  const { sampleElection, sampleCandidates } = getInitialData()
  
  const existingElections = getFromStorage<MockElection[]>(STORAGE_KEYS.elections, [])
  const existingCandidates = getFromStorage<MockCandidate[]>(STORAGE_KEYS.candidates, [])
  
  // Always update sample election (id: '1') with latest data
  const sampleElectionIndex = existingElections.findIndex(e => e.id === '1')
  if (sampleElectionIndex !== -1) {
    // Update existing sample election
    existingElections[sampleElectionIndex] = {
      ...sampleElection,
      id: '1', // Keep the same ID
    }
    saveToStorage(STORAGE_KEYS.elections, existingElections)
  } else if (existingElections.length === 0) {
    // Create new if none exists
    saveToStorage(STORAGE_KEYS.elections, [sampleElection])
  }
  
  // Always update candidates for election '1'
  const otherCandidates = existingCandidates.filter(c => c.election_id !== '1')
  saveToStorage(STORAGE_KEYS.candidates, [...otherCandidates, ...sampleCandidates])
}
