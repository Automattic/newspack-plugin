/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { BaseControl, PanelRow, Spinner } from '@wordpress/components';
import { useState, useEffect } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import AutocompleteWithSuggestions from '../components/src/autocomplete-with-suggestions';

function ProductControl( { rule, value, onChange } ) {
	const [ inFlight, setInFlight ] = useState( false );
	const [ selected, setSelected ] = useState( [] );
	const [ productError, setProductError ] = useState( '' );

	function fetchSuggestions( search ) {
		return apiFetch( {
			// The search query is wrapped in quotes to ensure that the search is for
			// the exact phrase, matching the behavior of the FormTokenField component.
			path: addQueryArgs( '/wc/v3/products', {
				include_types: 'subscription,variable-subscription',
				search: encodeURIComponent( search ),
			} ),
		} ).then( products => {
			return products.map( product => {
				// Variable products will populate price with one of the variations prices.
				return {
					label: `${ product.id }: ${ product.name }`,
					value: product.id,
				};
			} );
		} );
	}
	function fetchSaved() {
		setInFlight( true );
		return apiFetch( {
			path: addQueryArgs( '/wc/v3/products', { include: value } ),
		} )
			.then( products => {
				setSelected(
					products.map( product => {
						// Variable products will populate price with one of the variations prices.
						return {
							label: `${ product.id }: ${ product.name }`,
							value: product.id,
						};
					} )
				);
				setProductError( '' );
			} )
			.catch( () => {
				setProductError( __( 'Failed to fetch saved products. Please select a different product.', 'newspack-blocks' ) );
				setSelected( [] );
			} )
			.finally( () => setInFlight( false ) );
	}
	useEffect( () => {
		if ( value.length ) {
			fetchSaved();
		} else {
			setSelected( [] );
		}
	}, [ value ] );
	return (
		<>
			<PanelRow>
				<BaseControl id="product-control" label={ rule.name } help={ rule.description } />
			</PanelRow>
			{ ( productError || ! value?.length || inFlight ) && (
				<PanelRow>
					{ productError && <p className="newspack-product-control__error">{ productError }</p> }
					{ ! value.length && ! inFlight && (
						<p>
							<em>{ __( 'No products selected', 'newspack-plugin' ) }</em>
						</p>
					) }
					{ inFlight && <Spinner /> }
				</PanelRow>
			) }
			<PanelRow>
				<AutocompleteWithSuggestions
					label={ __( 'Search for a product', 'newspack-plugin' ) }
					hideHelp
					multiSelect
					onChange={ onChange }
					postTypes={ [ { slug: 'product', label: 'Product' } ] }
					postTypeLabel={ __( 'product', 'newspack-plugin' ) }
					postTypeLabelPlural={ __( 'products', 'newspack-plugin' ) }
					selectedItems={ selected }
					fetchSuggestions={ fetchSuggestions }
					fetchSaved={ fetchSaved }
				/>
			</PanelRow>
		</>
	);
}

export default ProductControl;
