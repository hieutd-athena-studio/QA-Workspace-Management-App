export interface Folder {
  id: number
  name: string
  parent_id: number | null
  path: string
  project_id: number
  created_at: string
  updated_at: string
}

export interface CreateFolderDTO {
  name: string
  parent_id: number | null
  project_id: number
}

export interface UpdateFolderDTO {
  name?: string
}

export interface MoveFolderDTO {
  new_parent_id: number | null
}
