/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import AutocompleteTokenField from '../../../../components/src/autocomplete-tokenfield';

export default function ListsControl( { label, help, placeholder, value, onChange, path, getDeletedItemLabel } ) {
	const getSuggestions = item => ( {
		value: isNaN( parseInt( item.id ) ) ? item.id.toString() : parseInt( item.id ),
		label: item.title || item.name,
	} );

	return (
		<AutocompleteTokenField
			label={ label }
			help={ help }
			placeholder={ placeholder }
			tokens={ value || [] }
			fetchSuggestions={ async () => {
				const lists = await apiFetch( {
					path,
				} );
				const values = Array.isArray( lists ) ? lists : Object.values( lists );
				return values.map( getSuggestions );
			} }
			fetchSavedInfo={ async (ids) => {
				const lists = await apiFetch( {
					path,
				} );
				const values = Array.isArray( lists ) ? lists : Object.values( lists );
				const foundItems = values.filter( item => ids.includes( item.id ) ).map( getSuggestions );

				// If no callback for the label of deleted items is provided, return found items without checking for deletions.
				if ( ! getDeletedItemLabel ) {
					return foundItems;
				}

				const foundIds = foundItems.map( item => item.value );
				const missingIds = ids.filter( id => ! foundIds.includes( id ) );
				const deletedItems = missingIds.map( id => ( {
					value: isNaN( parseInt( id ) ) ? id.toString() : parseInt( id ),
					label: getDeletedItemLabel( id ),
				} ) );

				return [ ...foundItems, ...deletedItems ];
			} }
			onChange={ onChange }
		/>
	);
}
