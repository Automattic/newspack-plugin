/**
 * Content Gate component.
 */

/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { AutocompleteWithSuggestions } from '../../../../../packages/components/src';

export default function ContentRuleControlTaxonomy( { slug, value, onChange }: GateRuleControlProps ) {
	const [ savedItems, setSavedItems ] = useState< { value: number; label: string }[] >( [] );
	const [ suggestions, setSuggestions ] = useState< { value: number; label: string }[] >( [] );

	let endpoint = '';
	switch ( slug ) {
		case 'post_tag':
			endpoint = 'tags';
			break;
		case 'category':
			endpoint = 'categories';
			break;
		default:
			endpoint = slug;
	}

	useEffect( () => {
		if ( ! Array.isArray( value ) || value.length === 0 ) {
			setSavedItems( [] );
			return;
		}
		const _savedItems = suggestions.filter( s => value.includes( s.value ) );
		if ( _savedItems.length > 0 ) {
			setSavedItems( _savedItems );
			return;
		}
		apiFetch( {
			path: addQueryArgs( 'wp/v2/' + endpoint, {
				per_page: 10,
				include: value.join( ',' ),
				_fields: 'id,name',
			} ),
		} ).then( ( terms: { id: number; name: string }[] ) => {
			const formattedTerms = terms.map( ( _term: { id: number; name: string } ) => ( {
				value: _term.id,
				label: decodeEntities( _term.name ) || __( '(no name)', 'newspack-plugin' ),
			} ) );
			setSavedItems( formattedTerms );
		} );
	}, [ value ] );

	const rule = window.newspackAudienceContentGates.available_content_rules[ slug ];
	if ( ! rule || ! Array.isArray( value ) ) {
		return null;
	}

	return (
		<AutocompleteWithSuggestions
			label={ rule.name }
			multiSelect={ true }
			selectedItems={ savedItems }
			postTypeLabel={ __( 'term', 'newspack-plugin' ) }
			postTypeLabelPlural={ __( 'terms', 'newspack-plugin' ) }
			fetchSuggestions={ async ( search: string ) => {
				const terms = await apiFetch( {
					path: addQueryArgs( 'wp/v2/' + endpoint, {
						search,
						per_page: 10,
						_fields: 'id,name',
					} ),
				} );

				const _suggestions = terms.map( ( _term: { id: number; name: string } ) => ( {
					value: _term.id,
					label: decodeEntities( _term.name ) || __( '(no name)', 'newspack-plugin' ),
				} ) );
				return _suggestions;
			} }
			onChange={ ( items: { value: number; label: string }[] ) => onChange( items.map( o => o.value ) ) }
		/>
	);
}
