/**
 * useWizardApiFetch hook types
 */
interface ApiFetchOptions {
	path: string;
	method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
	data?: any;
	isQuietFetch?: boolean;
	isLocalError?: boolean;
}
interface ApiFetchCallbacks< T > {
	onStart?: () => void;
	onSuccess?: ( data: T ) => void;
	onError?: ( error: any ) => void;
	onFinally?: () => void;
}
