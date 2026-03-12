export type IntentLabel =
	| 'Refund Request'
	| 'Login Issue'
	| 'Billing Issue'
	| 'Comp Request'
	| 'Complaint';

export interface ContextAction {
	label: string;
	variant: 'primary' | 'secondary';
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
}

export interface Conversation {
	id: string;
	senderName: string;
	senderEmail: string;
	subject: string;
	intentLabel: IntentLabel;
	timestamp: string;
	read: boolean;
	messages: Message[];
	contextPanels: ContextPanel[];
	suggestedActions: ContextAction[];
}

const conversations: Conversation[] = [
	{
		id: '1',
		senderName: 'Sarah Chen',
		senderEmail: 'sarah.chen@email.com',
		subject: 'Requesting refund for annual subscription',
		intentLabel: 'Refund Request',
		timestamp: '2 hours ago',
		read: false,
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
			},
		],
		contextPanels: [
			{
				heading: 'Reader',
				fields: {
					Email: 'sarah.chen@email.com',
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
		suggestedActions: [
			{ label: 'Process Full Refund', variant: 'primary' },
			{ label: 'Draft Response', variant: 'secondary' },
		],
	},
	{
		id: '2',
		senderName: 'Mike Torres',
		senderEmail: 'mike.torres@email.com',
		subject: 'Can\'t log in to my account',
		intentLabel: 'Login Issue',
		timestamp: '5 hours ago',
		read: false,
		messages: [
			{
				id: '2-1',
				from: 'Mike Torres',
				date: 'Mar 12, 2026 at 7:30 AM',
				body: `Hello,

I've been trying to log in for the past hour but I keep getting "invalid password" even though I'm sure my password is correct. I've tried resetting it twice but never received the reset email.

My email is mike.torres@email.com. Can you please help?

Mike`,
			},
		],
		contextPanels: [
			{
				heading: 'Reader',
				fields: {
					Email: 'mike.torres@email.com',
					'Member since': 'Jan 12, 2025',
					'Last login': 'Feb 28, 2026',
				},
			},
			{
				heading: 'Account',
				fields: {
					Status: 'Active',
					'Email verified': 'Yes',
					'Failed logins (24h)': '6',
				},
			},
		],
		suggestedActions: [
			{ label: 'Send Password Reset', variant: 'primary' },
			{ label: 'Draft Response', variant: 'secondary' },
		],
	},
	{
		id: '3',
		senderName: 'David Park',
		senderEmail: 'david.park@email.com',
		subject: 'Subscription stopped — card expired?',
		intentLabel: 'Billing Issue',
		timestamp: '1 day ago',
		read: true,
		messages: [
			{
				id: '3-1',
				from: 'David Park',
				date: 'Mar 11, 2026 at 3:45 PM',
				body: `Hi,

I just noticed I can't access subscriber-only articles anymore. I think my credit card might have expired — I got a new one from my bank last month but forgot to update it.

Can you help me get my subscription back? I've been a subscriber for over two years and don't want to lose access.

David`,
			},
		],
		contextPanels: [
			{
				heading: 'Reader',
				fields: {
					Email: 'david.park@email.com',
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
		suggestedActions: [
			{ label: 'Send Payment Update Link', variant: 'primary' },
			{ label: 'Draft Response', variant: 'secondary' },
		],
	},
	{
		id: '4',
		senderName: 'Maria Gonzalez',
		senderEmail: 'maria.gonzalez@email.com',
		subject: 'Complimentary subscription for our nonprofit',
		intentLabel: 'Comp Request',
		timestamp: '2 days ago',
		read: true,
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
			},
		],
		contextPanels: [
			{
				heading: 'Reader',
				fields: {
					Email: 'maria.gonzalez@email.com',
					'Member since': 'Not a member',
					Organization: 'Downtown Community Alliance',
				},
			},
		],
		suggestedActions: [
			{ label: 'Grant Comp Subscription', variant: 'primary' },
			{ label: 'Draft Response', variant: 'secondary' },
		],
	},
	{
		id: '5',
		senderName: 'Rachel Kim',
		senderEmail: 'rachel.kim@email.com',
		subject: 'CHARGED TWICE — need immediate refund',
		intentLabel: 'Complaint',
		timestamp: '3 days ago',
		read: true,
		messages: [
			{
				id: '5-1',
				from: 'Rachel Kim',
				date: 'Mar 9, 2026 at 9:05 AM',
				body: `I just checked my bank statement and I was charged TWICE for my monthly subscription — $15 on March 3rd AND March 5th. This is completely unacceptable.

I need the duplicate charge refunded IMMEDIATELY. If this isn't resolved today I'm canceling my subscription entirely and disputing both charges with my bank.

Rachel Kim`,
			},
		],
		contextPanels: [
			{
				heading: 'Reader',
				fields: {
					Email: 'rachel.kim@email.com',
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
		suggestedActions: [
			{ label: 'Refund Duplicate Charge', variant: 'primary' },
			{ label: 'Draft Response', variant: 'secondary' },
		],
	},
];

export default conversations;
