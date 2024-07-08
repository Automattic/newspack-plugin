/**
 * OAuth payload
 */
type OAuthData = {
	user_basic_info?: { email: string; has_refresh_token: boolean };
	username?: string;
	error?: Error;
};

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

/**
 * Modals component props.
 */
type ModalComponentProps = {
	endpoint: Endpoint;
	actions: string[];
	errorMessage: string | null;
	inFlight: boolean;
	action: WebhookActions;
	setError: ( err: WizardErrorType | null | string ) => void;
	setAction: ( action: WebhookActions, id: number | string ) => void;
	wizardApiFetch: < T = any >( opts: ApiFetchOptions, callbacks?: ApiFetchCallbacks< T > ) => void;
	setEndpoints: ( endpoints: Endpoint[] ) => void;
};

/*
 * Google Analytics 4 credentials Type.
 */
type Ga4Credentials = Record< string, string >;
