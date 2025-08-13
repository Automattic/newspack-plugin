/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import AutocompleteTokenField from '../../../../components/src/autocomplete-tokenfield';

export default function ListsControl( { label, help, placeholder, value, onChange, path, deletedItemLabel } ) {
	const getSuggestions = item => ( {
		value: isNaN( parseInt( item.id ) ) ? item.id.toString() : parseInt( item.id ),
		label: item.title || item.name || deletedItemLabel,
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
			fetchSavedInfo={ async ids => {
				const lists = await apiFetch( {
					path,
				} );
				const values = Array.isArray( lists ) ? lists : Object.values( lists );
				return ids
					.map( id => {
						const item = values.find( it => ( isNaN( it.id ) ? it.id : parseInt( it.id ) === id ) );
						if ( item ) {
							return getSuggestions( item );
						}
						return deletedItemLabel ? getSuggestions( { id } ) : false;
					} )
					.filter( Boolean );
			} }
			onChange={ onChange }
		/>
	);
}
