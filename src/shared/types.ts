/**
 * Minimal type stubs for plugin-owned and consumer-supplied collection shapes.
 * These will be replaced with Payload-generated types during the refactoring phase.
 */

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

export type TeamMember = {
  [key: string]: unknown
  id: string
  role?: null | string
  user?: unknown
}

export type Team = {
  [key: string]: unknown
  id: string
  name?: null | string
  teamMembers?: { docs?: Array<string | TeamMember> } | null
}

export type User = {
  [key: string]: unknown
  email?: null | string
  id: string
  name?: null | string
}
