/**
 * useWizardApiFetch hook types
 */
interface ApiFetchOptions {
	path: string;
	method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
	data?: any;
	isQuietFetch?: boolean;
	isLocalError?: boolean;
	isCached?: boolean;
	/** Update a specific cacheKey, requires `{ [path]: method }` format */
	updateCacheKey?: { [ k: string ]: string };
	/** Will purge and replace cache keys matching method. Well suited for endpoints where only the `method` changes */
	updateCacheMethods?: ( 'GET' | 'POST' | 'PUT' | 'DELETE' )[];
}
interface ApiFetchCallbacks< T > {
	onStart?: () => void;
	onSuccess?: ( data: T ) => void;
	onError?: ( error: any ) => void;
	onFinally?: () => void;
}
