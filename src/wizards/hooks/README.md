# `useWizardApiFetch`

A custom React hook for making API fetch requests using the wizard API. This hook provides caching, error handling, and state management for wizard-related API calls.

It uses `newspack/wizards` store under the hood.

## Usage

```typescript
const { 
  wizardApiFetch, 
  isFetching, 
  errorMessage, 
  error, 
  cache, 
  setError, 
  resetError 
} = useWizardApiFetch(slug);
```

## Parameters

- `slug` (string): Unique identifier for the wizard data.

## Returns

- `wizardApiFetch`: Async function to make API requests
  - Parameters:
    - `opts` (ApiFetchOptions): Options for the API fetch request
    - `callbacks` (optional ApiFetchCallbacks): Callback functions for different stages of the request
  - Returns: Promise with the API response

- `isFetching` (boolean): Whether a request is currently in progress
- `errorMessage` (string | null): Decoded error message if an error occurred
- `error` (WizardApiError | null): Full error object if an error occurred
- `cache`: Function to access and modify the wizard data cache
  - Parameters:
    - `cacheKey` (string): Key to access in the cache
  - Returns object with:
    - `get(method = 'GET')`: Get cached data for specified HTTP method
    - `set(value, method = 'GET')`: Set cached data for specified HTTP method
- `setError`: Function to manually set an error
- `resetError`: Function to clear the current error

## Features

- Automatic caching
- Request deduplication for concurrent calls
- Error handling and parsing
- Cache management for wizard data
- Support for callbacks during different request stages
- TypeScript support

## API Fetch Options

## Examples

```typescript
const { wizardApiFetch, isFetching, error } = useWizardApiFetch('my-wizard-slug');

const fetchData = async () => {
    wizardApiFetch({
        path: '/api/endpoint',
    }, {
      onSuccess: (data) => console.log('Success:', data),
      onError: (err) => console.error('Error:', err),
    });
};

const updateData = async () => {
    wizardApiFetch({
        path: '/api/endpoint',
        method: 'POST',
        updateCacheMethods: [ 'GET' ], // This will update the cached GET request for this slug `my-wizard-slug`
    }, {
      onSuccess: (data) => console.log('Success:', data),
      onError: (err) => console.error('Error:', err),
    });
};
```

In scenarios where you need to update the cache for a GET request, but the paths are different, you can use the `updateCacheKey` option.

```typescript
const { wizardApiFetch, isFetching, error } = useWizardApiFetch('my-wizard-slug');

const fetchData = async () => {
    wizardApiFetch({
        path: '/api/endpoint/two',
    }, {
        //...
    });
};

const updateData = async () => {
    wizardApiFetch({
        path: '/api/endpoint',
        method: 'POST',
        updateCacheKey: {
            '/api/endpoint/two': 'GET',
        },
    }, {
        //...
    });
};
```

The `wizardApiFetch` function accepts an options object with the following properties:

- `path` (string): API endpoint path
- `method` (string, default: 'GET'): HTTP method
- `isCached` (boolean, default: true for GET requests): Whether to cache the response
- `updateCacheKey` (object, optional): Specify endpoint and method to update in cache
- `updateCacheMethods` (array, optional): Additional methods to update in cache

## Callbacks

Optional callbacks that can be provided:

- `onStart`: Called when the request begins. Called before the request is made.
- `onSuccess`: Called with the response data. Similar to `then` in a promise.
- `onError`: Called with the error object. Similar to `catch` in a promise.
- `onFinally`: Called when the request completes (success or error). Similar to `finally` in a promise.
