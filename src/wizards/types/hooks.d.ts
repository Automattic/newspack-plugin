/**
 * API Method types
 */
type ApiMethods = 'GET' | 'POST' | 'PUT' | 'DELETE';

/**
 * useWizardApiFetch hook types
 */
interface ApiFetchOptions {
	path: string;
	method?: ApiMethods;
	/** Data to send along with request */
	data?: any;
	/** Display simplified loading status during request */
	isQuietFetch?: boolean;
	/** Throw errors to be caught in hooks/components */
	isLocalError?: boolean;
	/** Should this request be cached. If omitted and `GET` method is used the request will cache automatically */
	isCached?: boolean;
	/** Update a specific cacheKey, requires `{ [path]: method }` format */
	updateCacheKey?: { [ k: string ]: string };
	/** Will purge and replace cache keys matching method. Well suited for endpoints where only the `method` changes */
	updateCacheMethods?: ApiMethods[];
}

/**
 * API callback functions
 */
interface ApiFetchCallbacks< T > {
	onStart?: () => void;
	onSuccess?: ( data: T ) => void;
	onError?: ( error: any ) => void;
	onFinally?: () => void;
}

/**
 * WP API Fetch error
 */
type WpFetchError = Error & {
	code: string;
	data?: null | {
		status: number;
	};
};

/**
 * Wizard store schema
 */
type WizardData = {
	error: WizardApiError | null;
} & {
	[ key: string ]: { [ k in ApiMethods ]?: Record< string, any > | null };
};
