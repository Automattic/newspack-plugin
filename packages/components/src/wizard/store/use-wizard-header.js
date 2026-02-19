/**
 * WordPress dependencies.
 */
import { useDispatch } from '@wordpress/data';
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { WIZARD_STORE_NAMESPACE } from '.';

/**
 * Set wizard header data and auto-reset on unmount.
 *
 * Can be called multiple times in the same component with different
 * data subsets and dependency arrays — setHeaderData does a shallow merge.
 *
 * @param {Object} headerData Partial header data to merge into the store.
 * @param {Array}  deps       Dependency array (like useEffect).
 */
export default function useWizardHeader( headerData, deps ) {
	const { setHeaderData, resetHeaderData } = useDispatch( WIZARD_STORE_NAMESPACE );

	useEffect( () => {
		setHeaderData( headerData );
	}, deps ); // eslint-disable-line react-hooks/exhaustive-deps

	useEffect( () => () => resetHeaderData(), [] ); // eslint-disable-line react-hooks/exhaustive-deps
}
