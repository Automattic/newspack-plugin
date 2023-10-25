/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import AutocompleteTokenField from '../../../../components/src/autocomplete-tokenfield';

export default function ListsControl( { label, help, placeholder, value, onChange, path } ) {
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
				const suggestions = values.map( getSuggestions );

				return suggestions;
			} }
			fetchSavedInfo={ async ids => {
				const lists = await apiFetch( {
					path,
				} );
				const values = Array.isArray( lists ) ? lists : Object.values( lists );
				return values.filter( item => ids.includes( item.id ) ).map( getSuggestions );
			} }
			onChange={ onChange }
		/>
	);
}
