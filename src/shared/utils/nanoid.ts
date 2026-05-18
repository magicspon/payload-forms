// crypto.randomUUID() is globally available in Node 18+ and all modern browsers — no import needed
export const nanoid = () => crypto.randomUUID()
