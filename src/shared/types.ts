export type FormUpload = {
  [key: string]: unknown
  filename?: null | string
  filesize?: null | number
  id: string
  mimeType?: null | string
}

export type Form = {
  [key: string]: unknown
  id: string
  title?: null | string
}

export type FileUploadEntry = {
  fieldName: string
  ids: string[]
  maxFiles: number
  relationTo: string
}

export type RemoteFileValue = {
  filename: string
  filesize: number
  id: string
  kind: 'remote'
  mimeType: string
  url: string
}
