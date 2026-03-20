export type IntentLabel =
	| 'Refund Request'
	| 'Login Issue'
	| 'Billing Issue'
	| 'Comp Request'
	| 'Complaint'
	| 'Retention'
	| 'Access Issue';

export interface SuggestedAction {
	label: string;
	completedLabel: string;
	checked: boolean;
}

export interface AiAssessment {
	body: string;
	status: 'verified' | 'discrepancy';
}

export interface ContextPanel {
	heading: string;
	fields: Record< string, string >;
}

export interface Message {
	id: string;
	from: string;
	date: string;
	body: string;
	aiAssessment?: AiAssessment;
}

export interface Conversation {
	id: string;
	senderName: string;
	senderEmail: string;
	subject: string;
	intentLabel: IntentLabel;
	timestamp: string;
	messages: Message[];
	contextPanels: ContextPanel[];
	draftReply: string;
	actions: SuggestedAction[];
}

const conversations: Conversation[] = [
	{
		id: '2',
		senderName: 'Mike Torres',
		senderEmail: 'miketorres84@gmail.com',
		subject: 'Can\'t log in to my account',
		intentLabel: 'Login Issue',
		timestamp: '30 min ago',
		messages: [
			{
				id: '2-1',
				from: 'Mike Torres',
				date: 'Mar 12, 2026 at 7:30 AM',
				body: `Hello,

I've been trying to log in for the past hour but I keep getting "invalid password" even though I'm sure my password is correct.

My email is miketorres84@gmail.com. Can you please help?

Mike`,
				aiAssessment: {
					status: 'verified',
					body: 'Account found for miketorres84@gmail.com.',
				},
			},
		],
		contextPanels: [
			{
				heading: 'Reader',
				fields: {
					Email: 'miketorres84@gmail.com',
					'Member since': 'Jan 12, 2025',
					'Last login': 'Feb 28, 2026',
				},
			},
			{
				heading: 'Account',
				fields: {
					Status: 'Active',
					'Email verified': 'Yes',
				},
			},
		],
		draftReply: `Hi Mike,

Sorry you're having trouble getting in! I can see your account is active.

Here's a direct link to reset your password: https://dailytribune.com/my-account/lost-password/?key=aB3kP9xmQ7nR&id=48291

If you still have trouble after resetting, let me know and we can try an alternative approach.

Best regards`,
		actions: [],
	},
	{
		id: '1',
		senderName: 'Sarah Chen',
		senderEmail: 'schen.writes@gmail.com',
		subject: 'Requesting refund for annual subscription',
		intentLabel: 'Refund Request',
		timestamp: '5 hours ago',
		messages: [
			{
				id: '1-1',
				from: 'Sarah Chen',
				date: 'Mar 12, 2026 at 10:15 AM',
				body: `Hi there,

I signed up for the annual subscription last week but honestly the content isn't what I expected. I was hoping for more in-depth investigative pieces but most of what I've seen is wire stories I can find elsewhere.

Could I please get a refund? I paid $120 for the year.

Thanks,
Sarah`,
				aiAssessment: {
					status: 'verified',
					body: 'Reader says "last week" — subscription started Mar 5, 2026 (7 days ago). Reader says "$120" — matches the single charge on file.',
				},
			},
		],
		contextPanels: [
			{
				heading: 'Reader',
				fields: {
					Email: 'schen.writes@gmail.com',
					'Member since': 'Mar 5, 2026',
					'Total spent': '$120.00',
				},
			},
			{
				heading: 'Subscription',
				fields: {
					Plan: 'Annual — $120/yr',
					Status: 'Active',
					'Started on': 'Mar 5, 2026',
					'Next renewal': 'Mar 5, 2027',
				},
			},
		],
		draftReply: `Hi Sarah,

Thank you for reaching out. I'm sorry to hear our content hasn't met your expectations — we appreciate the feedback.

I've gone ahead and processed a full refund of $120.00 to your original payment method. You should see it reflected within 5–10 business days.

If you'd like to give us another try in the future, we'd love to have you back. We have several investigative series launching in the coming months.

Best regards`,
		actions: [
			{ label: 'Process full refund ($120.00)', completedLabel: 'Refunded $120.00 to Visa ending in 9042 — <a href="https://dailytribune.com/wp-admin/post.php?post=8834&action=edit">refund #8834</a>', checked: true },
			{ label: 'Cancel subscription', completedLabel: 'Cancelled subscription <a href="https://dailytribune.com/wp-admin/post.php?post=8801&action=edit">#8801</a>', checked: true },
		],
	},
	{
		id: '3',
		senderName: 'David Park',
		senderEmail: 'dpark@outlook.com',
		subject: 'Subscription stopped — card expired?',
		intentLabel: 'Billing Issue',
		timestamp: '1 day ago',
		messages: [
			{
				id: '3-1',
				from: 'David Park',
				date: 'Mar 11, 2026 at 3:45 PM',
				body: `Hi,

I just noticed I can't access subscriber-only articles anymore. I think my credit card might have expired — I got a new one from my bank last month but forgot to update it.

Can you help me get my subscription back? I've been a subscriber for over two years and don't want to lose access.

David`,
				aiAssessment: {
					status: 'verified',
					body: 'Reader says card "expired" — confirmed, Visa ending in 4821 expired Feb 2026. Reader says "over two years" — subscribed since Nov 2023 (28 months).',
				},
			},
		],
		contextPanels: [
			{
				heading: 'Reader',
				fields: {
					Email: 'dpark@outlook.com',
					'Member since': 'Nov 3, 2023',
					'Total spent': '$360.00',
				},
			},
			{
				heading: 'Subscription',
				fields: {
					Plan: 'Monthly — $15/mo',
					Status: 'On Hold (payment failed)',
					'Last payment': 'Feb 3, 2026',
					'Failed since': 'Mar 3, 2026',
				},
			},
		],
		draftReply: `Hi David,

Thanks for being a loyal subscriber for over two years — we really appreciate your support!

It does look like your last payment on March 3rd didn't go through, which is why access was paused. I've sent you a secure link to update your payment method. Once you update your card, your subscription will resume immediately and you'll have full access again.

No need to re-subscribe or pay anything extra — we'll just pick up where you left off.

Best regards`,
		actions: [
			{ label: 'Send payment method update link', completedLabel: 'Sent payment update link to dpark@outlook.com', checked: true },
			{ label: 'Extend access for 7 days while card is updated', completedLabel: 'Extended access on subscription <a href="https://dailytribune.com/wp-admin/post.php?post=6215&action=edit">#6215</a> until Mar 18, 2026', checked: true },
		],
	},
	{
		id: '4',
		senderName: 'Maria Gonzalez',
		senderEmail: 'mgonzalez@downtowncommunityalliance.org',
		subject: 'Complimentary subscription for our nonprofit',
		intentLabel: 'Comp Request',
		timestamp: '2 days ago',
		messages: [
			{
				id: '4-1',
				from: 'Maria Gonzalez',
				date: 'Mar 10, 2026 at 11:20 AM',
				body: `Dear Editor,

I'm the executive director of the Downtown Community Alliance. We're a nonprofit that works closely with the communities you cover, and your reporting has been incredibly valuable to our work.

Unfortunately, our budget is tight this year. Would it be possible to receive a complimentary digital subscription so our team can continue following your coverage?

Happy to discuss further or provide any documentation about our organization.

Best regards,
Maria Gonzalez
Executive Director, Downtown Community Alliance`,
				aiAssessment: {
					status: 'verified',
					body: 'Reader says "executive director" — email domain matches the organization. No existing subscriber account for this address.',
				},
			},
		],
		contextPanels: [
			{
				heading: 'Reader',
				fields: {
					Email: 'mgonzalez@downtowncommunityalliance.org',
					'Member since': 'Not a member',
					Organization: 'Downtown Community Alliance',
				},
			},
		],
		draftReply: `Dear Maria,

Thank you for reaching out, and for the important work the Downtown Community Alliance does in our community.

We'd be happy to provide a complimentary digital subscription for your organization. I've set one up on your account — you should now have full access using your email address mgonzalez@downtowncommunityalliance.org.

This comp subscription is valid for one year and will be reviewed at that point. If you need access for additional team members, feel free to let us know.

Best regards`,
		actions: [
			{ label: 'Grant 1-year comp subscription', completedLabel: 'Created comp subscription <a href="https://dailytribune.com/wp-admin/post.php?post=9102&action=edit">#9102</a> — expires Mar 12, 2027', checked: true },
		],
	},
	{
		id: '5',
		senderName: 'Rachel Kim',
		senderEmail: 'rachelkim77@yahoo.com',
		subject: 'CHARGED TWICE — need immediate refund',
		intentLabel: 'Complaint',
		timestamp: '3 days ago',
		messages: [
			{
				id: '5-1',
				from: 'Rachel Kim',
				date: 'Mar 9, 2026 at 9:05 AM',
				body: `I just checked my bank statement and I was charged TWICE for my monthly subscription — $15 on March 3rd AND March 5th. This is completely unacceptable.

I need the duplicate charge refunded IMMEDIATELY. If this isn't resolved today I'm canceling my subscription entirely and disputing both charges with my bank.

Rachel Kim`,
				aiAssessment: {
					status: 'verified',
					body: 'Reader says "charged TWICE" and "$15 on March 3rd AND March 5th" — confirmed, two charges of $15.00 found on those dates. The Mar 5 charge is a duplicate.',
				},
			},
		],
		contextPanels: [
			{
				heading: 'Reader',
				fields: {
					Email: 'rachelkim77@yahoo.com',
					'Member since': 'Aug 22, 2025',
					'Total spent': '$105.00',
				},
			},
			{
				heading: 'Billing',
				fields: {
					Plan: 'Monthly — $15/mo',
					Status: 'Active',
					'Mar 3 charge': '$15.00 (renewal)',
					'Mar 5 charge': '$15.00 (duplicate)',
				},
			},
		],
		draftReply: `Hi Rachel,

I sincerely apologize for the duplicate charge — that should not have happened and I completely understand your frustration.

I've confirmed that the $15.00 charge on March 5th was indeed a duplicate, and I've processed a refund for it immediately. You should see the $15.00 credited back to your account within 3–5 business days.

Your subscription remains active and in good standing, with your next regular renewal on April 3rd. Please don't hesitate to reach out if you have any other concerns.

Best regards`,
		actions: [
			{ label: 'Refund duplicate charge ($15.00 on Mar 5)', completedLabel: 'Refunded $15.00 to Mastercard ending in 7763 — <a href="https://dailytribune.com/wp-admin/post.php?post=9044&action=edit">refund #9044</a>', checked: true },
		],
	},
	{
		id: '6',
		senderName: 'James Wright',
		senderEmail: 'jwright@protonmail.com',
		subject: 'Refund for my $200 subscription',
		intentLabel: 'Refund Request',
		timestamp: '3 days ago',
		messages: [
			{
				id: '6-1',
				from: 'James Wright',
				date: 'Mar 9, 2026 at 2:40 PM',
				body: `Hi,

I'd like to request a refund for my annual subscription. I paid $200 for the year and I'd like the full amount back. I just don't have time to read anymore.

Thanks,
James Wright`,
				aiAssessment: {
					status: 'discrepancy',
					body: 'The reader states they paid $200, but the only charge on file is $120.00 for the Annual plan on Sep 15, 2025.',
				},
			},
		],
		contextPanels: [
			{
				heading: 'Reader',
				fields: {
					Email: 'jwright@protonmail.com',
					'Member since': 'Sep 15, 2025',
					'Total spent': '$120.00',
				},
			},
			{
				heading: 'Subscription',
				fields: {
					Plan: 'Annual — $120/yr',
					Status: 'Active',
					'Started on': 'Sep 15, 2025',
					'Next renewal': 'Sep 15, 2026',
				},
			},
		],
		draftReply: `Hi James,

Thank you for reaching out. I'd be happy to help with your refund request.

I did want to clarify the amount — our records show your annual subscription was charged at $120.00 on September 15, 2025. I wasn't able to find a charge of $200 on your account. Could you double-check your statement in case the $200 charge is from a different service?

In the meantime, I can process a refund of $120.00 if you'd like to go ahead with canceling. Just let me know how you'd like to proceed.

Best regards`,
		actions: [
			{ label: 'Process refund ($120.00)', completedLabel: 'Refunded $120.00 to Visa ending in 3318 — <a href="https://dailytribune.com/wp-admin/post.php?post=7550&action=edit">refund #7550</a>', checked: false },
			{ label: 'Cancel subscription', completedLabel: 'Cancelled subscription <a href="https://dailytribune.com/wp-admin/post.php?post=7401&action=edit">#7401</a>', checked: false },
		],
	},
	{
		id: '7',
		senderName: 'Lisa Pham',
		senderEmail: 'lisa.pham@fastmail.com',
		subject: 'Please cancel my subscription',
		intentLabel: 'Retention',
		timestamp: '4 days ago',
		messages: [
			{
				id: '7-1',
				from: 'Lisa Pham',
				date: 'Mar 8, 2026 at 9:12 AM',
				body: `Please cancel my subscription. I just can't afford it right now.`,
				aiAssessment: {
					status: 'verified',
					body: 'Reader says "can\'t afford it" — active subscription at $15/mo.',
				},
			},
			{
				id: '7-2',
				from: 'Lisa Pham',
				date: 'Mar 8, 2026 at 3:45 PM',
				body: `Actually, do you have any kind of reduced rate? I really do value the journalism, I just took a pay cut.`,
			},
			{
				id: '7-3',
				from: 'Lisa Pham',
				date: 'Mar 8, 2026 at 6:50 PM',
				body: `I looked at your site and don't see a discounted tier. If there isn't one, go ahead and cancel.`,
				aiAssessment: {
					status: 'verified',
					body: 'Reader says "don\'t see a discounted tier" — correct, no reduced-rate plan is listed publicly. However, an unlisted $5/mo plan exists.',
				},
			},
		],
		contextPanels: [
			{
				heading: 'Reader',
				fields: {
					Email: 'lisa.pham@fastmail.com',
					'Member since': 'Feb 10, 2022',
					'Total spent': '$720.00',
					'Articles (30 days)': '23',
				},
			},
			{
				heading: 'Subscription',
				fields: {
					Plan: 'Monthly — $15/mo',
					Status: 'Active',
					'Next renewal': 'Mar 22, 2026',
				},
			},
			{
				heading: 'Available Plans',
				fields: {
					'Reduced rate': '$5/mo (unlisted)',
					Standard: '$15/mo',
					Annual: '$120/yr',
				},
			},
		],
		draftReply: `Hi Lisa,

Thank you for being a reader for four years — we really value your support and your readership.

We do have a reduced rate that isn't listed on the site. I can switch your subscription to $5/month so you can keep reading without the strain on your budget.

If that works for you, I'll make the change right away — your next billing on March 22nd would be at the lower rate. And if your circumstances change in the future, you can always switch back.

Let me know!

Best regards`,
		actions: [
			{ label: 'Switch to reduced rate ($5/mo)', completedLabel: 'Switched subscription <a href="https://dailytribune.com/wp-admin/post.php?post=4190&action=edit">#4190</a> from $15/mo to $5/mo — effective Mar 22, 2026', checked: true },
		],
	},
	{
		id: '8',
		senderName: 'Tony Rezende',
		senderEmail: 'trezende@gmail.com',
		subject: 'Premium content still paywalled — I donate $25/month',
		intentLabel: 'Access Issue',
		timestamp: '5 days ago',
		messages: [
			{
				id: '8-1',
				from: 'Tony Rezende',
				date: 'Mar 7, 2026 at 11:30 AM',
				body: `Hi,

I've been a monthly donor ($25/month) for over a year now and I was told donors at my level get access to all premium content. But I'm still hitting the paywall on every article. Can you fix this?

Thanks,
Tony`,
				aiAssessment: {
					status: 'discrepancy',
					body: 'Reader says "$25/month for over a year" — confirmed, recurring $25/mo since Jan 2025. Reader says "donors at my level get access" — correct per Premium membership plan ($20+/mo), but no access has been provisioned on this account.',
				},
			},
		],
		contextPanels: [
			{
				heading: 'Reader',
				fields: {
					Email: 'trezende@gmail.com',
					'Account created': 'Jan 5, 2025',
					'Has subscription': 'No',
				},
			},
			{
				heading: 'Donations',
				fields: {
					'Recurring amount': '$25/mo',
					'Active since': 'Jan 2025',
					'Total donated': '$350.00',
					Payments: '14',
				},
			},
			{
				heading: 'Membership Plans',
				fields: {
					Supporter: '$10+/mo — Newsletter access',
					Premium: '$20+/mo — Full content access',
					Patron: '$50+/mo — Content + events',
				},
			},
		],
		draftReply: `Hi Tony,

Thank you so much for your generous support — 14 months of monthly donations is incredible, and we truly appreciate it.

You're absolutely right that donors at your level should have full premium access. I'm sorry this wasn't set up properly on your account — that's our mistake. I've activated premium access for you now, so you should be able to read all content immediately.

This access will remain active as long as your monthly donation continues. Please let me know if you run into any further issues.

Best regards`,
		actions: [
			{ label: 'Grant premium content access', completedLabel: 'Granted Premium access on membership <a href="https://dailytribune.com/wp-admin/post.php?post=9201&action=edit">#9201</a>', checked: true },
		],
	},
];

export default conversations;

