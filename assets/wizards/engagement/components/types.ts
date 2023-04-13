/**
 * Types for the Prequisite component.
 */

// Available transactional email slugs.
type EmailSlugs =
	| 'reader-activation-verification'
	| 'reader-activation-magic-link'
	| 'reader-activation-otp-authentication'
	| 'reader-activation-reset-password'
	| 'reader-activation-delete-account';

// RAS config inherited from RAS wizard view.
type Config = {
	enabled?: boolean;
	enabled_account_link?: boolean;
	account_link_menu_locations?: [ 'tertiary-menu' ];
	newsletters_label?: string;
	terms_text?: string;
	terms_url?: string;
	sync_esp?: boolean;
	metadata_prefix?: string;
	sync_esp_delete?: boolean;
	active_campaign_master_list?: number;
	mailchimp_audience_id?: string;
	emails?: {
		[ key in EmailSlugs ]: {
			label: string;
			description: string;
			post_id: number;
			edit_link: string;
			subject: string;
			from_name: string;
			from_email: string;
			reply_to_email: string;
			status: string;
		};
	};
	sender_name?: string;
	sender_email_address?: string;
	contact_email_address?: string;
};

// Props for the Prequisite component.
export type PrequisiteProps = {
	config: Config;
	getSharedProps: (
		configKey: string,
		type: string
	) => {
		onChange: ( value: string | boolean ) => void;
		disabled?: boolean;
		checked?: boolean;
		value?: string;
	};
	inFlight: boolean;
	saveConfig: ( config: Config ) => void;

	// Schema for prequisite object is defined in PHP class Reader_Activation::get_prerequisites_status().
	prerequisite: {
		active: boolean;
		label: string;
		description: string;
		help_url: string;
		fields?: {
			[ fieldName: string ]: {
				label: string;
				description: string;
			};
		};
		href?: string;
		action_text?: string;
		action_enabled?: boolean;
		disabled_text?: string;
	};
};
