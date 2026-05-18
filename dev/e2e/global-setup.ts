import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default function globalSetup() {
	// Ensure .auth dir exists before admin-user.spec.ts tries to write the session file.
	fs.mkdirSync(path.resolve(__dirname, '../.auth'), { recursive: true })
}
