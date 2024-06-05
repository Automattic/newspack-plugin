/**
 * Webhook actions data type.
 */
type WebhookActions = 'edit' | 'delete' | 'view' | 'toggle' | 'new' | null;

/**
 * Endpoint data type.
 */
type Endpoint = {
	url: string;
	label: string;
	requests: {
		errors: any[];
		id: string;
		status: 'pending' | 'finished' | 'killed';
		scheduled: string;
		action_name: string;
	}[];
	disabled: boolean;
	disabled_error: boolean;
	id: string | number;
	system: string;
	global: boolean;
	actions: string[];
	bearer_token?: string;
};

/**
 * @wordpress/components/CheckboxControl component props override. Required to apply
 * correct types to legacy version.
 */
type WpCheckboxControlPropsOverride< T > = React.ComponentProps< T > & {
	indeterminate?: boolean;
	key?: React.Key | null;
};
