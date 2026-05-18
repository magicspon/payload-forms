import type { Payload } from 'payload'

// payload.create() overloads for draft-enabled collections require an explicit `draft`
// property, and the `group` field type is absent from the generated JSON schema types.
// This cast bypasses both issues for seed-only code.
const createForm = (
	payload: Payload,
	data: Record<string, unknown>,
): Promise<unknown> =>
	(
		payload.create as unknown as (opts: {
			collection: string
			data: unknown
		}) => Promise<unknown>
	)({ collection: 'forms', data })

const uid = () => crypto.randomUUID()

function lexicalDoc(...paragraphs: string[]) {
	return {
		root: {
			children: paragraphs.map((text) => ({
				children: [
					{
						detail: 0,
						format: 0,
						mode: 'normal',
						style: '',
						text,
						type: 'text',
						version: 1,
					},
				],
				direction: 'ltr' as const,
				format: '' as const,
				indent: 0,
				type: 'paragraph',
				version: 1,
			})),
			direction: 'ltr' as const,
			format: '' as const,
			indent: 0,
			type: 'root',
			version: 1,
		},
	}
}

function base(overrides: Record<string, unknown> = {}) {
	return {
		_draft: false,
		hidden: false,
		required: false,
		errorMessage: '',
		instructions: '',
		...overrides,
	}
}

// ── Contact Us (basic form) ────────────────────────────────────────────────────

async function createContactForm(payload: Payload) {
	const { totalDocs } = await payload.count({
		collection: 'forms',
		where: { title: { equals: 'Contact Us' } },
	})
	if (totalDocs > 0) {
		return
	}

	await createForm(payload, {
		title: 'Contact Us',
		confirmationType: 'message',
		confirmationMessage: lexicalDoc(
			'Thank you for reaching out!',
			"We'll be in touch within 1–2 business days.",
		),
		notification: [
			{
				email: 'admin@example.com',
				subject: 'New Contact Form Submission',
				message: lexicalDoc(
					'A new contact form submission has been received.',
					'Log in to the admin panel to review the details.',
				),
			},
		],
		pages: [
			{
				id: uid(),
				title: 'Contact Us',
				backButton: 'Back',
				nextButton: 'Next',
				rows: [
					{
						id: uid(),
						columns: [
							{
								...base({ required: true }),
								id: uid(),
								type: 'text',
								name: 'full_name',
								label: 'Full Name',
								placeholder: 'Jane Smith',
								defaultValue: '',
							},
							{
								...base({ required: true }),
								id: uid(),
								type: 'email',
								name: 'email',
								label: 'Email Address',
								placeholder: 'jane@example.com',
								defaultValue: '',
							},
						],
					},
					{
						id: uid(),
						columns: [
							{
								...base(),
								id: uid(),
								type: 'text',
								name: 'phone',
								label: 'Phone Number',
								placeholder: '+44 7700 900000',
								defaultValue: '',
							},
							{
								...base(),
								id: uid(),
								type: 'select',
								name: 'subject',
								label: 'Subject',
								placeholder: 'Select a subject',
								defaultValue: '',
								options: [
									{ label: 'General Enquiry', value: 'general' },
									{ label: 'Support', value: 'support' },
									{ label: 'Sales', value: 'sales' },
									{ label: 'Other', value: 'other' },
								],
							},
						],
					},
					{
						id: uid(),
						columns: [
							{
								...base({ required: true }),
								id: uid(),
								type: 'textarea',
								name: 'message',
								label: 'Message',
								placeholder: 'Tell us how we can help...',
								defaultValue: '',
								rows: 5,
							},
						],
					},
					{
						id: uid(),
						columns: [
							{
								...base({ required: true }),
								id: uid(),
								type: 'consent',
								name: 'consent',
								label: 'I agree to be contacted about my enquiry',
								defaultValue: false,
							},
						],
					},
				],
			},
		],
	})
}

// ── All Fields Demo (kitchen sink) ────────────────────────────────────────────

async function createKitchenSinkForm(payload: Payload) {
	const { totalDocs } = await payload.count({
		collection: 'forms',
		where: { title: { equals: 'All Fields Demo' } },
	})
	if (totalDocs > 0) return

	await createForm(payload, {
		title: 'All Fields Demo',
		confirmationType: 'redirect',
		redirectUrl: 'https://example.com/thank-you',
		notification: [
			{
				email: 'admin@example.com',
				subject: 'New All Fields Demo Submission',
				message: lexicalDoc(
					'A new submission has been received via the All Fields Demo form.',
					'Log in to the admin panel to review the details.',
				),
			},
		],
		pages: [
			// ── Page 1: Personal Details ─────────────────────────────────────
			{
				id: uid(),
				title: 'Personal Details',
				backButton: 'Back',
				nextButton: 'Continue',
				rows: [
					{
						id: uid(),
						columns: [
							{
								...base({ required: true }),
								id: uid(),
								type: 'text',
								name: 'first_name',
								label: 'First Name',
								placeholder: 'Jane',
								defaultValue: '',
							},
							{
								...base({ required: true }),
								id: uid(),
								type: 'text',
								name: 'last_name',
								label: 'Last Name',
								placeholder: 'Smith',
								defaultValue: '',
							},
						],
					},
					{
						id: uid(),
						columns: [
							{
								...base({ required: true }),
								id: uid(),
								type: 'email',
								name: 'email',
								label: 'Email Address',
								placeholder: 'jane@example.com',
								defaultValue: '',
							},
							{
								...base(),
								id: uid(),
								type: 'text',
								name: 'phone',
								label: 'Phone Number',
								placeholder: '+44 7700 900000',
								defaultValue: '',
							},
						],
					},
					{
						id: uid(),
						columns: [
							{
								...base(),
								id: uid(),
								type: 'number',
								name: 'age',
								label: 'Age',
								placeholder: '',
								min: 16,
								max: 120,
								step: 1,
							},
							{
								...base(),
								id: uid(),
								type: 'date',
								name: 'date_of_birth',
								label: 'Date of Birth',
								placeholder: '',
								defaultValue: '',
							},
						],
					},
					{
						id: uid(),
						columns: [
							{
								...base(),
								id: uid(),
								type: 'textarea',
								name: 'bio',
								label: 'Short Bio',
								placeholder: 'Tell us about yourself...',
								defaultValue: '',
								rows: 3,
							},
						],
					},
				],
			},

			// ── Page 2: Preferences ──────────────────────────────────────────
			{
				id: uid(),
				title: 'Preferences',
				backButton: 'Back',
				nextButton: 'Continue',
				rows: [
					{
						id: uid(),
						columns: [
							{
								...base(),
								id: uid(),
								type: 'select',
								name: 'country',
								label: 'Country',
								placeholder: 'Select your country',
								defaultValue: '',
								options: [
									{ label: 'United Kingdom', value: 'uk' },
									{ label: 'United States', value: 'us' },
									{ label: 'Canada', value: 'ca' },
									{ label: 'Australia', value: 'au' },
									{ label: 'Other', value: 'other' },
								],
							},
							{
								...base(),
								id: uid(),
								type: 'radio',
								name: 'experience_level',
								label: 'Experience Level',
								defaultValue: '',
								options: [
									{ label: 'Beginner', value: 'beginner' },
									{ label: 'Intermediate', value: 'intermediate' },
									{ label: 'Advanced', value: 'advanced' },
									{ label: 'Expert', value: 'expert' },
								],
							},
						],
					},
					{
						id: uid(),
						columns: [
							{
								...base(),
								id: uid(),
								type: 'checkbox',
								name: 'interests',
								label: 'Interests',
								defaultValue: [],
								options: [
									{ label: 'Technology', value: 'technology' },
									{ label: 'Sports', value: 'sports' },
									{ label: 'Arts', value: 'arts' },
									{ label: 'Music', value: 'music' },
									{ label: 'Food', value: 'food' },
									{ label: 'Travel', value: 'travel' },
								],
							},
						],
					},
					{
						id: uid(),
						columns: [
							{
								...base(),
								id: uid(),
								type: 'toggle',
								name: 'subscribe_newsletter',
								label: 'Subscribe to our newsletter',
								defaultValue: false,
							},
						],
					},
					{
						// Only visible when subscribe_newsletter is checked
						id: uid(),
						columns: [
							{
								...base(),
								id: uid(),
								type: 'radio',
								name: 'newsletter_frequency',
								label: 'Newsletter Frequency',
								defaultValue: '',
								options: [
									{ label: 'Daily', value: 'daily' },
									{ label: 'Weekly', value: 'weekly' },
									{ label: 'Monthly', value: 'monthly' },
								],
								conditions: {
									logic: 'and',
									conditions: [
										{
											field: 'subscribe_newsletter',
											operator: 'isNotEmpty',
										},
									],
								},
							},
						],
					},
					{
						id: uid(),
						columns: [
							{
								...base(),
								id: uid(),
								type: 'number',
								name: 'budget',
								label: 'Budget (£)',
								placeholder: 'Enter your budget',
								min: 0,
								step: 100,
							},
							{
								...base(),
								id: uid(),
								type: 'date',
								name: 'available_from',
								label: 'Available From',
								placeholder: '',
								defaultValue: '',
							},
						],
					},
					{
						id: uid(),
						columns: [
							{
								...base(),
								id: uid(),
								type: 'file',
								name: 'resume',
								label: 'Upload CV / Resume',
								allowedFileTypes: '.pdf,.doc,.docx',
								maxFileSize: 5 * 1024 * 1024,
								maxFiles: 1,
								multiple: false,
							},
						],
					},
				],
			},

			// ── Page 3: Final Details ────────────────────────────────────────
			{
				id: uid(),
				title: 'Final Details',
				backButton: 'Back',
				nextButton: 'Submit',
				rows: [
					{
						id: uid(),
						columns: [
							{
								id: uid(),
								type: 'message',
								richText: lexicalDoc(
									"You're almost done!",
									'Please complete the final details below and submit your application.',
								),
							},
						],
					},
					{
						id: uid(),
						columns: [
							{
								...base(),
								id: uid(),
								type: 'array',
								name: 'team_members',
								label: 'Team Members',
								minRows: 0,
								maxRows: 5,
								rows: [
									{
										id: uid(),
										columns: [
											{
												...base(),
												id: uid(),
												type: 'text',
												name: 'member_name',
												label: 'Name',
												placeholder: 'Team member name',
												defaultValue: '',
											},
											{
												...base(),
												id: uid(),
												type: 'text',
												name: 'member_role',
												label: 'Role',
												placeholder: 'e.g. Designer',
												defaultValue: '',
											},
											{
												...base(),
												id: uid(),
												type: 'email',
												name: 'member_email',
												label: 'Email',
												placeholder: 'team@example.com',
												defaultValue: '',
											},
										],
									},
								],
							},
						],
					},
					{
						id: uid(),
						columns: [
							{
								...base(),
								id: uid(),
								type: 'group',
								name: 'address',
								label: 'Address',
								rows: [
									{
										id: uid(),
										columns: [
											{
												...base(),
												id: uid(),
												type: 'text',
												name: 'street',
												label: 'Street Address',
												placeholder: '123 Main Street',
												defaultValue: '',
											},
											{
												...base(),
												id: uid(),
												type: 'text',
												name: 'city',
												label: 'City',
												placeholder: 'London',
												defaultValue: '',
											},
											{
												...base(),
												id: uid(),
												type: 'text',
												name: 'postcode',
												label: 'Postcode',
												placeholder: 'SW1A 1AA',
												defaultValue: '',
											},
										],
									},
								],
							},
						],
					},
					{
						// Only visible when country is not 'uk'
						id: uid(),
						columns: [
							{
								...base(),
								id: uid(),
								type: 'textarea',
								name: 'additional_notes',
								label: 'Additional Notes',
								placeholder: "Anything else you'd like to add?",
								defaultValue: '',
								rows: 3,
								conditions: {
									logic: 'and',
									conditions: [
										{
											field: 'country',
											operator: 'notEquals',
											value: 'uk',
										},
									],
								},
							},
						],
					},
					{
						id: uid(),
						columns: [
							{
								...base({ required: true }),
								id: uid(),
								type: 'consent',
								name: 'terms_consent',
								label: 'I agree to the Terms & Conditions and Privacy Policy',
								defaultValue: false,
							},
							{
								...base(),
								id: uid(),
								type: 'consent',
								name: 'marketing_consent',
								label: 'I agree to receive marketing communications',
								defaultValue: false,
							},
						],
					},
				],
			},
		],
	})
}

export async function seedForms(payload: Payload) {
	await createContactForm(payload)
	await createKitchenSinkForm(payload)
}
