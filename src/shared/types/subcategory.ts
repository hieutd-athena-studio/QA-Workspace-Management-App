export interface Subcategory {
  id: number
  name: string
  category_id: number
  project_id: number
  created_at: string
  updated_at: string
}

export interface CreateSubcategoryDTO {
  name: string
  category_id: number
  project_id: number
}

export interface UpdateSubcategoryDTO {
  name?: string
}
