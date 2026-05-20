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
