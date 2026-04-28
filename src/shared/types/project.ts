export type ProjectStatus = 'On-going' | 'On-hold' | 'Dropped'

export interface Project {
  id: number
  name: string
  code: string
  status: ProjectStatus
  description: string
  color?: string
  created_at: string
  updated_at: string
}

export interface CreateProjectDTO {
  name: string
  code: string
  status: ProjectStatus
  description: string
  color?: string
}

export interface UpdateProjectDTO {
  name?: string
  code?: string
  status?: ProjectStatus
  description?: string
  color?: string
}
