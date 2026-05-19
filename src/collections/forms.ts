import type { JSONSchema4 } from 'json-schema'
import type { CollectionConfig, Field, RichTextField, Tab } from 'payload'

import { buildFormSchema } from '@/form-builder/utils/buildFormSchema'
import { type FormPage, getAllFields } from '@/form-builder/utils/formTree'
import { formJSONSchema } from '@/shared/fieldSchema'
import { nanoid } from '@/shared/utils/nanoid'
import {
	BoldFeature,
	FixedToolbarFeature,
	HeadingFeature,
	ItalicFeature,
	lexicalEditor,
	LinkFeature,
	UnderlineFeature,
} from '@payloadcms/richtext-lexical'
import { APIError, slugField } from 'payload'

import { FormFieldReferenceFeature } from '../form-builder/components/lexical/FormFieldReference'




const basicEditor = lexicalEditor({
	features: [
		HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3'] }),
		FixedToolbarFeature(),
		BoldFeature(),
		ItalicFeature(),
		UnderlineFeature(),
		LinkFeature({ maxDepth: 2 }),
	],
})

const notificationEditor = lexicalEditor({
	features: [
		HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3'] }),
		FixedToolbarFeature(),
		BoldFeature(),
		ItalicFeature(),
		UnderlineFeature(),
		LinkFeature({ maxDepth: 2 }),
		FormFieldReferenceFeature(),
	],
})

export interface FormsCollectionOptions {
	features?: {
		confirmations: boolean
		fieldPalette: boolean
		importSchema: boolean
		multipage: boolean
		notifications: boolean
	}
	/** Live preview URL factory — if omitted, live preview is disabled. */
	livePreviewUrl?: (args: {
		data: Record<string, unknown>
		locale: { code: string }
	}) => null | string
	/** Options for the locale language selector. Defaults to English only. */
	localeOptions?: { label: string; value: string }[]
	settings?: Field[]

	/** Collection slug. Defaults to `'forms'`. */
	slug?: string

	tabLabels?: {
		canvas: string
		settings: string
	}

	tabs?: Tab[]

	/** teamField to include in the sidebar, or undefined to omit. */
	teamField?: Field
}

/** Build the forms CollectionConfig. */
export function buildFormsCollection(
	opts: FormsCollectionOptions = {},
): CollectionConfig {
	const {
		slug = 'forms',
		features = {
			confirmations: true,
			fieldPalette: true,
			importSchema: false,
			multipage: true,
			notifications: true,
		},
		livePreviewUrl,
		localeOptions,
		settings = [],

		tabLabels = {
			canvas: 'Canvas',
			settings: 'Settings',
		},
		teamField,
	} = opts

	const settingsFields: Field[] = []

	if (localeOptions?.length) {
		settingsFields.push({
			name: 'languages',
			type: 'select',
			admin: { description: 'The languages this form is available in.' },
			defaultValue: ['en'],
			hasMany: true,
			label: 'Active Languages',
			options: localeOptions,
			required: true,
		})
	}

	settingsFields.push(...settings)

	const tabs: Tab[] = [
		{
			fields: [
				{
					name: 'canvas',
					type: 'ui',
					admin: {
						components: {
							Field: {
								clientProps: {
									fieldPalette: features?.fieldPalette,
									multipage: features?.multipage,
								},
								path: '@spon/payload-forms/client#FormCanvas',
							},
						},
					},
				},
			],
			label: tabLabels?.canvas ?? 'Canvas',
		},
		...(opts?.tabs ?? []),
	]

	const confirmation: Tab = {
		fields: [
			{
				name: 'confirmationType',
				type: 'select',
				options: [
					{ label: 'Redirect', value: 'redirect' },
					{ label: 'Message', value: 'message' },
				],
			},
			{
				name: 'confirmationMessage',
				type: 'richText',
				// lexicalEditor() returns LexicalEditorConfig which is not assignable to
			// RichTextField['editor'] due to a type mismatch in @payloadcms/richtext-lexical.
			// This cast is the upstream-recommended workaround until the package exports
			// a compatible type.
			editor: notificationEditor as unknown as RichTextField['editor'],
			},
			{
				name: 'redirectUrl',
				type: 'text',
				admin: {
					condition: (_data, siblingData) =>
						siblingData?.confirmationType === 'redirect',
				},
			},
			{
				name: 'redirect',
				type: 'text',
				admin: { hidden: true },
				virtual: true,
			},
		],
		label: 'Confirmation',
	}

	const notifications: Tab = {
		fields: [
			{
				name: 'notification',
				type: 'array',
				fields: [
					{
						name: 'email',
						type: 'text',
						admin: {
							components: {
								Field: '@spon/payload-forms/client#EmailNotificationInput',
							},
						},
						required: true,
					},
					{
						name: 'subject',
						type: 'text',
						required: true,
					},
					{
						name: 'message',
						type: 'richText',
						required: true,
						// lexicalEditor() returns LexicalEditorConfig which is not assignable to
			// RichTextField['editor'] due to a type mismatch in @payloadcms/richtext-lexical.
			// This cast is the upstream-recommended workaround until the package exports
			// a compatible type.
			editor: notificationEditor as unknown as RichTextField['editor'],
					},
					{
						name: 'conditions',
						type: 'json',
						admin: {
							components: {
								Field:
									'@spon/payload-forms/client#NotificationConditionEditor',
							},
						},
					},
				],
			},
		],
		label: 'Notifications',
	}

	const importSchema: Tab = {
		fields: [
			{
				name: 'import',
				type: 'ui',
				admin: {
					components: {
						Field: '@spon/payload-forms/client#ImportSchema',
					},
				},
			},
		],
		label: 'Import',
	}

	if (features?.importSchema) {
		tabs.push(importSchema)
	}

	if (features?.confirmations) {
		tabs.push(confirmation)
	}

	if (features?.notifications) {
		tabs.push(notifications)
	}

	tabs.push({
		admin: {
			hidden: true,
		},
		fields: [
			{
				name: 'formSchema',
				type: 'json',
				admin: { readOnly: true },
				typescriptSchema: [
					() => ({
						tsType: `Record<string, unknown> | null`,
					}),
				],
			},
		],
		label: 'Schema',
	})

	tabs.push({
		admin: {
			hidden: true,
		},
		fields: [
			{
				name: 'submissions',
				type: 'join',
				collection: 'submissions',
				on: 'form',
			},
		],
		label: 'Submissions',
	})

	const fields: Field[] = [
		{
			name: 'title',
			type: 'text',
			admin: { position: 'sidebar' },
			required: true,
		},
		slugField({
			disableUnique: true,
			fieldToUse: 'title',
			position: 'sidebar',
		}),
		{
			name: 'locked',
			type: 'checkbox',
			admin: {
				description: `Form fields become locked once a form has submissions or connected data`,
				position: 'sidebar',
				readOnly: true,
			},
		},
		{
			type: 'tabs',
			tabs,
		},
		{
			name: 'pages',
			type: 'json',
			admin: { hidden: true },
			hooks: {
				beforeValidate: [
					({ value }) => {
						if (value) {return value}
						return [
							{
								id: nanoid(),
								backButton: 'Back',
								nextButton: 'Next',
								rows: [{ id: nanoid(), columns: [] }],
								title: 'Page 1',
							},
						]
					},
				],
			},
			typescriptSchema: [() => formJSONSchema as JSONSchema4],
		},
	]

	if (teamField) {fields.push(teamField)}

	if (features?.confirmations || features?.notifications) {
		fields.push({
			name: 'richText',
			type: 'richText',
			// Same lexicalEditor() type workaround as the notification fields above
		admin: {
				description: 'Schema path used for rich text content field (message)',
				hidden: true,
			},
			editor: basicEditor
		})
	}

	return {
		slug,
		admin: {
			components: {
				edit: {
					editMenuItems: [
						'@spon/payload-forms/client#FormCSVTemplateButton',
					],

				},
			},
			defaultColumns: ['title', 'slug'],
			group: 'Forms',
			useAsTitle: 'title',
			...(livePreviewUrl
				? {
						livePreview: {
							url: ({ data, locale }) =>
								livePreviewUrl({
									data: data as Record<string, unknown>,
									locale,
								}),
						},
					}
				: {}),
		},
		fields,
		hooks: {
			beforeChange: [
				({ data, req }) => {
					if (Array.isArray(data?.pages)) {
						try {
							const fields = getAllFields(data.pages as FormPage[])
							data.formSchema = buildFormSchema({ fields })
						} catch (err) {
							req.payload.logger.warn(
								{ err, formId: data?.id },
								'beforeChange: failed to generate formSchema — skipping',
							)
						}
					}
					return data
				},
			],
			// (FR-039) Guard against saving a form with no pages.
			beforeValidate: [
				({ data }) => {
					if (!Array.isArray(data?.pages) || data.pages.length === 0) {
						throw new APIError(
							'Form must have at least one page',
							400,
							{},
							true,
						)
					}
					return data
				},
			],
		},
		labels: { plural: 'Forms', singular: 'Form' },
		versions: {
			drafts: {
				autosave: { interval: 60000, showSaveDraftButton: true },
			},
			maxPerDoc: 10,
		},
	}
}
