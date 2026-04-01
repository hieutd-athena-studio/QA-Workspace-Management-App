export interface Category {
  id: number
  name: string
  project_id: number
  created_at: string
  updated_at: string
}

export interface CreateCategoryDTO {
  name: string
  project_id: number
}

export interface UpdateCategoryDTO {
  name?: string
}
