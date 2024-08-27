/**
 * Allow image to be imported as a modules
 */
declare module '*.png' {
	const path: string;
	export default path;
}

/**
 * Wizard API fetch function
 */
type WizardApiFetch< T = {} > = (
	options: ApiFetchOptions,
	callbacks?: ApiFetchCallbacks< any >
) => Promise< T >;
