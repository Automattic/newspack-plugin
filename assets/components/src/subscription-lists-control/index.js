/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import AutocompleteTokenField from '../autocomplete-tokenfield';

export default function SubscriptionListsControl( { label, help, placeholder, value, onChange } ) {
	return (
		<AutocompleteTokenField
			label={ label }
			help={ help }
			placeholder={ placeholder }
			tokens={ value || [] }
			fetchSuggestions={ async () => {
				const lists = await apiFetch( {
					path: '/newspack-newsletters/v1/lists_config',
				} );
				return Object.values( lists ).map( item => ( { value: item.id, label: item.title } ) );
			} }
			fetchSavedInfo={ async ids => {
				const lists = await apiFetch( {
					path: '/newspack-newsletters/v1/lists_config',
				} );
				return Object.values( lists )
					.filter( item => ids.includes( item.id ) )
					.map( item => ( { value: item.id, label: item.title } ) );
			} }
			onChange={ onChange }
		/>
	);
}
