/**
 * Content Gate component.
 */

/**
 * WordPress dependencies.
 */
import { __, sprintf } from '@wordpress/i18n';
import { FormTokenField } from '@wordpress/components';
import type { TokenItem } from '@wordpress/components/build-types/form-token-field/types.d.ts';
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState, useCallback, useMemo } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { addQueryArgs } from '@wordpress/url';

const debounce = ( func: ( search?: string ) => void, wait: number ) => {
	let timeout: ReturnType< typeof setTimeout >;
	return ( search?: string ) => {
		clearTimeout( timeout );
		timeout = setTimeout( () => func( search ), wait );
	};
};

export default function ContentRuleControlTokenField( { slug, value, exclusion, onChange, isStatic = false }: GateRuleControlProps ) {
	const rule = useMemo( () => window.newspackAudienceContentGates.available_content_rules[ slug ], [ slug ] );

	const [ savedItems, setSavedItems ] = useState< { value: string; label: string }[] >( [] );
	const [ suggestions, setSuggestions ] = useState< { value: string; label: string }[] >( [] );
	const endpoint = useMemo( () => {
		if ( rule?.endpoint ) {
			return rule.endpoint;
		}
		let _endpoint = '';
		switch ( slug ) {
			case 'post_tag':
				_endpoint = 'tags';
				break;
			case 'category':
				_endpoint = 'categories';
				break;
			default:
				_endpoint = slug;
		}
		return 'wp/v2/' + _endpoint;
	}, [ slug ] );

	const fetchSuggestions = useCallback(
		( search: string = '' ) => {
			apiFetch< { db_id?: number; id: number; name: string; type_label?: string }[] >( {
				path: addQueryArgs( endpoint, {
					search,
					per_page: 10,
					_fields: 'db_id,id,name,type_label',
				} ),
			} )
				.then( terms => {
					if ( ! terms || terms.length === 0 ) {
						setSuggestions( [] );
						return;
					}
					setSuggestions(
						terms.map( term => ( {
							value: term.db_id ? term.db_id.toString() : term.id.toString(),
							label: decodeEntities(
								`${ term.db_id || term.id }: ${ term.name || __( '(no name)', 'newspack-plugin' ) }${
									term.type_label ? ` (${ term.type_label })` : ''
								}`
							),
						} ) )
					);
				} )
				.catch( error => {
					console.warn( 'Error fetching suggestions for taxonomy: ' + endpoint, error ); // eslint-disable-line no-console
				} );
		},
		[ endpoint ]
	);

	// Fetch current items.
	useEffect( () => {
		if ( ! value || value.length === 0 ) {
			return;
		}
		apiFetch< { db_id?: number; id: number; name: string; type_label?: string }[] >( {
			path: addQueryArgs( endpoint, {
				include: value.join( ',' ),
				_fields: 'db_id,id,name,type_label',
			} ),
		} )
			.then( terms => {
				setSavedItems(
					terms.map( term => ( {
						value: term.db_id ? term.db_id.toString() : term.id.toString(),
						label: decodeEntities(
							`${ term.db_id || term.id }: ${ term.name || __( '(no name)', 'newspack-plugin' ) }${
								term.type_label ? ` (${ term.type_label })` : ''
							}`
						),
					} ) )
				);
			} )
			.catch( error => {
				console.warn( 'Error fetching saved items for taxonomy: ' + endpoint, error ); // eslint-disable-line no-console
			} );
	}, [ value, endpoint ] );

	// Set initial suggestions.
	useEffect( () => {
		fetchSuggestions();
	}, [ fetchSuggestions ] );

	const debouncedFetchSuggestions = useMemo( () => debounce( fetchSuggestions, 100 ), [ fetchSuggestions ] );

	const handleInputChange = ( search: string ) => {
		debouncedFetchSuggestions( search );
	};

	const tokens = useMemo( () => {
		const items = [ ...savedItems, ...suggestions ];
		const result = items.filter( i => value.includes( i.value ) ).map( i => i.label );
		return [ ...new Set( result ) ];
	}, [ value, savedItems, suggestions ] );

	const staticLabels = useMemo( () => {
		return tokens.length === 0
			? '-'
			: tokens
					.map( token => token.split( ':' ).slice( 1 ).join( ':' ).trim() )
					.filter( label => label.length > 0 )
					.join( ', ' );
	}, [ tokens ] );

	const handleChange = useCallback(
		( newTokens: ( string | TokenItem )[] ) => {
			const items = [ ...savedItems, ...suggestions ];

			// Find items.
			const foundItems = newTokens.map( t => {
				if ( typeof t === 'string' ) {
					const [ val ] = t.split( ':' );
					return items.find( i => i.value === val );
				}
				return items.find( i => i.value === t.value );
			} );
			onChange( foundItems.filter( i => i !== undefined ).map( i => i.value ) );
		},
		[ savedItems, suggestions, onChange ]
	);

	if ( ! rule || ! Array.isArray( value ) ) {
		return null;
	}

	if ( isStatic ) {
		return (
			<p>
				<strong>
					{ sprintf(
						// translators: 1: rule name, 2: includes or excludes
						__( '%1$s %2$s:', 'newspack-plugin' ),
						rule.name,
						exclusion ? __( 'exclude', 'newspack-plugin' ) : __( 'include', 'newspack-plugin' )
					) }
				</strong>{ ' ' }
				{ staticLabels }
			</p>
		);
	}

	return (
		<>
			<FormTokenField
				label={ '' }
				suggestions={ suggestions.map( s => s.label ) }
				onInputChange={ handleInputChange }
				value={ tokens }
				onChange={ handleChange }
				placeholder={ __( 'Click to select, type to search', 'newspack-plugin' ) }
				__experimentalExpandOnFocus
				__next40pxDefaultSize
			/>
		</>
	);
}
