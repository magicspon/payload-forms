---
"@spon/payload-forms": minor
---

Add CC/BCC fields to email notifications and a `beforeEmail` hook.

**CC and BCC recipients**

Each notification rule in the **Notifications** tab now has optional **CC** and **BCC** fields alongside the existing **To** field. All three support plain email addresses, comma-separated lists, and `{{fieldName}}` tokens that resolve to submission values at send time.

**`beforeEmail` hook**

A new `beforeEmail` option on `formsPlugin` lets you intercept each outgoing notification email before it is sent. The hook receives the fully resolved email data — tokens already substituted, Lexical content already converted to HTML and plain text — and can suppress `payload.sendEmail()` by returning `false`.

```ts
import { formsPlugin, type BeforeEmailHook } from '@spon/payload-forms'

const beforeEmail: BeforeEmailHook = async ({ to, cc, bcc, subject, html, text }) => {
  await myEmailService.send({ to, cc, bcc, subject, html, text })
  return false // skip payload.sendEmail()
}

export default buildConfig({
  plugins: [formsPlugin({ beforeEmail })],
})
```

The hook is called once per notification item. Returning `false` cancels the send for that item only — other rules still fire. If the hook throws, the error is logged and the send proceeds normally.
