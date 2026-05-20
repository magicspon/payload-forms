import { Form } from '@forms/components/Form'
import { notFound } from 'next/navigation'
import config from '@payload-config'
import { getPayload } from 'payload'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function FormPage({ params }: Props) {
  const { slug } = await params
  const payload = await getPayload({ config })

  const form = await payload
    .find({
      collection: 'forms',
      where: { slug: { equals: slug } },
    })
    .then((resp) => resp.docs?.[0])
    .catch(() => null)

  if (!form) {
    notFound()
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Form data={form} />
    </div>
  )
}
