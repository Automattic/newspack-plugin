/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { Button, CheckboxControl, SelectControl, Spinner } from '@wordpress/components';
import { decodeEntities } from '@wordpress/html-entities';
import { useEffect, useState } from '@wordpress/element';
import { __, _x, sprintf } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';

/**
 * External dependencies.
 */
import { AutocompleteTokenField } from '../';
import './style.scss';

const AutocompleteWithSuggestions = ( {
	multiSelect = false,
	fetchSavedPosts = false,
	fetchSuggestions = false,
	onChange = false,
	help = __( 'Begin typing search term, click autocomplete result to select.', 'newspack' ),
	hideHelp = false,
	label = __( 'Search', 'newspack' ),
	postTypes = [ { slug: 'post', label: 'Post' } ],
	postTypeLabel = __( 'item', 'newspack' ),
	postTypeLabelPlural = __( 'items', 'newspack' ),
	selectedItems = [],
	selectedPost = 0, // legacy prop when single-select was the only option.
	suggestionsToFetch = 10,
} ) => {
	const [ isLoading, setIsLoading ] = useState( false );
	const [ suggestions, setSuggestions ] = useState( [] );
	const [ postTypeToSearch, setPostTypeToSearch ] = useState( postTypes[ 0 ].slug );

	const classNames = [ 'newspack-autocomplete-with-suggestions' ];

	if ( hideHelp ) {
		classNames.push( 'hide-help' );
	}

	/**
	 * Fetch recent posts to show as suggestions.
	 */
	useEffect( () => {
		setIsLoading( true );
		handleFetchSuggestions()
			.then( _suggestions => {
				if ( 0 < _suggestions.length ) {
					setSuggestions( _suggestions );
				}
			} )
			.finally( () => setIsLoading( false ) );
	}, [ postTypeToSearch ] );

	/**
	 * If passed a `fetchSavedPosts` prop, use that, otherwise, build it based on the selected post type.
	 */
	const handleFetchSaved = fetchSavedPosts
		? fetchSavedPosts
		: async ( postIds = [] ) => {
				const postTypeSlug =
					'post' === postTypeToSearch || 'page' === postTypeToSearch
						? postTypeToSearch + 's' // Default post type endpoints are plural.
						: postTypeToSearch; // Custom post type endpoints are singular.
				const posts = await apiFetch( {
					path: addQueryArgs( '/wp/v2/' + postTypeSlug, {
						per_page: 100,
						include: postIds.join( ',' ),
						_fields: 'id,title',
					} ),
				} );

				return posts.map( post => ( {
					value: post.id,
					label: decodeEntities( post.title ) || __( '(no title)', 'newspack' ),
				} ) );
		  };

	/**
	 * If passed a `fetchSuggestions` prop, use that, otherwise, build it based on the selected post type.
	 */
	const handleFetchSuggestions = fetchSuggestions
		? fetchSuggestions
		: async ( search = null, offset = 0 ) => {
				const postTypeSlug =
					'post' === postTypeToSearch || 'page' === postTypeToSearch
						? postTypeToSearch + 's' // Default post type endpoints are plural.
						: postTypeToSearch; // Custom post type endpoints are singular.
				const posts = await apiFetch( {
					path: addQueryArgs( '/wp/v2/' + postTypeSlug, {
						search,
						offset,
						per_page: suggestionsToFetch,
						_fields: 'id,title',
					} ),
				} );

				// Format suggestions for FormTokenField display.
				return posts.reduce( ( acc, post ) => {
					acc.push( {
						value: post.id,
						label: decodeEntities( post.title.rendered ) || __( '(no title)', 'newspack' ),
					} );

					return acc;
				}, [] );
		  };

	/**
	 * Intercept onChange callback so we can decide whether to allow multiple selections.
	 */
	const handleOnChange = _selections => {
		// If only allowing one selection, just return the one selected item.
		if ( ! multiSelect ) {
			return onChange( _selections );
		}

		// Handle legacy `selectedPost` prop.
		const selections = selectedPost ? [ ...selectedItems, selectedPost ] : [ ...selectedItems ];

		// Loop through new selections to determine whether to add or remove them.
		_selections.forEach( _selection => {
			const existingSelection = selections.findIndex(
				selection => selection.value === _selection.value
			);

			if ( -1 < existingSelection ) {
				// If the selection is already selected, remove it.
				selections.splice( existingSelection, 1 );
			} else {
				// Otherwise, add it.
				selections.push( _selection );
			}
		} );

		onChange( selections );
	};

	/**
	 * Render selected item(s) for this component. Clicking on a selection deselects it.
	 */
	const renderSelections = () => {
		// Handle legacy `selectedPost` prop.
		const selections = selectedPost ? [ ...selectedItems, selectedPost ] : selectedItems;
		const selectedMessage = multiSelect
			? sprintf(
					__( '%s %s selected', 'newspack' ),
					selections.length,
					selections.length > 1 ? postTypeLabelPlural : postTypeLabel
			  )
			: sprintf( __( 'Selected %s', 'newspack' ), postTypeLabel );

		return (
			<div className="newspack-autocomplete-with-suggestions__selected-items">
				<p className="newspack-autocomplete-with-suggestions__label">
					{ selectedMessage }
					{ 1 < selections.length && _x( ' – ', 'separator character', 'newspack' ) }
					{ 1 < selections.length && (
						<Button onClick={ () => onChange( [] ) } isLink>
							{ __( 'Clear all', 'newspack' ) }
						</Button>
					) }
				</p>
				{ selections.map( selection => (
					<Button
						key={ selection.value }
						className="newspack-autocomplete-with-suggestions__selected-item-button"
						isTertiary
						onClick={ () =>
							onChange( selections.filter( _selection => _selection.value !== selection.value ) )
						}
					>
						{ selection.label }
					</Button>
				) ) }
			</div>
		);
	};

	/**
	 * Render post type select dropdown.
	 */
	const renderPostTypeSelect = () => {
		return (
			<SelectControl
				label={ sprintf(
					__( `%s type`, 'newspack' ),
					postTypeLabel.charAt( 0 ).toUpperCase() + postTypeLabel.slice( 1 )
				) }
				value={ postTypeToSearch }
				options={ postTypes.map( postTypeOption => ( {
					label: postTypeOption.label,
					value: postTypeOption.slug,
				} ) ) }
				onChange={ _postType => setPostTypeToSearch( _postType ) }
			/>
		);
	};

	/**
	 * Render a single suggestion object that can be clicked to select it immediately.
	 *
	 * @param {Object} suggestion Suggestion object with value and label keys.
	 */
	const renderSuggestion = suggestion => {
		if ( multiSelect ) {
			const selections = selectedPost ? [ ...selectedItems, selectedPost ] : [ ...selectedItems ];
			const isSelected = !! selections.find( _selection => _selection.value === suggestion.value );
			return (
				<CheckboxControl
					key={ suggestion.value }
					checked={ isSelected }
					onChange={ () => handleOnChange( [ { ...suggestion, postType: postTypeToSearch } ] ) }
					label={ suggestion.label }
				/>
			);
		}
		return (
			<Button
				isLink
				key={ suggestion.value }
				onClick={ () => handleOnChange( [ { ...suggestion, postType: postTypeToSearch } ] ) }
			>
				{ suggestion.label }
			</Button>
		);
	};

	/**
	 * Render a list of suggestions that can be clicked to select instead of searching by title.
	 */
	const renderSuggestions = () => {
		if ( isLoading ) {
			return (
				<div className="newspack-autocomplete-with-suggestions__suggestions-spinner">
					<Spinner />
				</div>
			);
		}

		if ( 0 === suggestions.length ) {
			return null;
		}

		const className = multiSelect
			? 'newspack-autocomplete-with-suggestions__search-suggestions-multiselect'
			: 'newspack-autocomplete-with-suggestions__search-suggestions';

		return (
			<>
				{ ! hideHelp && (
					<p className="newspack-autocomplete-with-suggestions__label">
						{ sprintf( __( 'Or, select a recent %s:', 'newspack' ), postTypeLabel ) }
					</p>
				) }
				<div className={ className }>{ suggestions.map( renderSuggestion ) }</div>
			</>
		);
	};

	return (
		<div className={ classNames.join( ' ' ) }>
			{ 0 < selectedItems.length && renderSelections() }
			{ 1 < postTypes.length && renderPostTypeSelect() }
			<AutocompleteTokenField
				tokens={ [] }
				onChange={ handleOnChange }
				fetchSuggestions={ fetchSuggestions }
				fetchSavedInfo={ postIds => handleFetchSaved( postIds ) }
				label={ label }
				help={ ! hideHelp && help }
				returnFullObjects
			/>
			{ renderSuggestions() }
		</div>
	);
};

export default AutocompleteWithSuggestions;
