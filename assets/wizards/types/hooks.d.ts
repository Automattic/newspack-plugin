/**
 * useWizardApiFetch hook types
 */
interface ApiFetchOptions {
	path: string;
	method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
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
	updateCacheMethods?: ( 'GET' | 'POST' | 'PUT' | 'DELETE' )[];
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
