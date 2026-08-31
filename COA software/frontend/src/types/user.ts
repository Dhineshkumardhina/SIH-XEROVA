export interface DepartmentSummary {
  id: string
  code: string
  name: string
}

export interface User {
  id: string
  email: string
  username: string
  full_name: string
  roles: string[]
  permissions: string[]
  department?: DepartmentSummary | null
  is_active: boolean
  is_locked: boolean
  last_login_at?: string | null
  created_at?: string
  updated_at?: string
}

export interface LoginResponseData {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  user: User
}

export interface LoginPayload {
  username: string
  password: string
  remember_me?: boolean
}
