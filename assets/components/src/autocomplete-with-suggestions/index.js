/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';

/**
 * External dependencies.
 */
import { AutocompleteTokenField } from '../';
import './style.scss';

const AutocompleteWithSuggestions = ( {
	fetchSavedPosts = false,
	fetchSuggestions = false,
	onChange = false,
	help = __( 'Begin typing search term, click autocomplete result to select.', 'newspack' ),
	label = __( 'Search', 'newspack' ),
	postTypeLabel = __( 'post', 'newspack' ),
	selectedPost = 0,
} ) => {
	const [ suggestions, setSuggestions ] = useState( [] );

	/**
	 * Fetch recent posts to show as suggestions.
	 */
	useEffect( () => {
		if ( fetchSuggestions ) {
			fetchSuggestions().then( _suggestions => {
				if ( 0 < _suggestions.length ) {
					setSuggestions( _suggestions );
				}
			} );
		}
	}, [] );

	/**
	 * Render a single suggestion object that can be clicked to select it immediately.
	 *
	 * @param {Object} suggestion Suggestion object with value and label keys.
	 * @param {number} index Index of this suggestion in the array.
	 */
	const renderSuggestion = ( suggestion, index ) => {
		return (
			<Button isLink key={ index } onClick={ () => onChange( [ suggestion ] ) }>
				{ suggestion.label }
			</Button>
		);
	};

	/**
	 * Render a list of suggestions that can be clicked to select instead of searching by title.
	 */
	const renderSuggestions = () => {
		return (
			<>
				<p className="newspack-autocomplete-with-suggestions__label">
					{ __( 'Or, select a recent ', 'newspack' ) + sprintf( ' %s:', postTypeLabel ) }
				</p>
				<div className="newspack-autocomplete-with-suggestions__search-suggestions">
					{ suggestions.map( renderSuggestion ) }
				</div>
			</>
		);
	};

	return (
		<div className="newspack-autocomplete-with-suggestions">
			<AutocompleteTokenField
				tokens={ [ selectedPost ] }
				onChange={ onChange }
				fetchSuggestions={ fetchSuggestions }
				fetchSavedInfo={ postIDs => fetchSavedPosts( postIDs ) }
				label={ label }
				help={ help }
			/>
			{ 0 < suggestions.length && renderSuggestions() }
		</div>
	);
};

export default AutocompleteWithSuggestions;
