/**
 * Wizard API fetch function
 */
type WizardApiFetch< T = {} > = (
	options: ApiFetchOptions,
	callbacks?: ApiFetchCallbacks< any >
) => Promise< T >;
