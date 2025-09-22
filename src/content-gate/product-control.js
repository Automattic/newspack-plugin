/**
 * External dependencies
 */
import { debounce, invert } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { BaseControl, TextControl, FormTokenField, Button, Spinner } from '@wordpress/components';
import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

function ProductControl( props ) {
	const [ inFlight, setInFlight ] = useState( false );
	const [ suggestions, setSuggestions ] = useState( {} );
	const [ selected, setSelected ] = useState( false );
	const [ isChanging, setIsChanging ] = useState( false );
	const [ productError, setProductError ] = useState( '' );

	function fetchSuggestions( search ) {
		setInFlight( true );
		return apiFetch( {
			// The search query is wrapped in quotes to ensure that the search is for
			// the exact phrase, matching the behavior of the FormTokenField component.
			path: `/wc/v2/products?include_types=subscription,variable-subscription&search=${ encodeURIComponent( '"' + search + '"' ) }`,
		} )
			.then( products => {
				const _suggestions = {};
				products.forEach( product => {
					// Variable products will populate price with one of the variations prices.
					_suggestions[ product.id ] = `${ product.id }: ${ product.name }`;
				} );
				setSuggestions( _suggestions );
			} )
			.finally( () => setInFlight( false ) );
	}
	function fetchSaved() {
		setInFlight( true );
		return apiFetch( {
			path: `/wc/v2/products/${ props.value }`,
		} )
			.then( product => {
				setSuggestions( { [ product.id ]: `${ product.id }: ${ product.name }` } );
				setSelected( product );
				setProductError( '' );
				props.onProduct( product );
			} )
			.catch( () => {
				setProductError(
					sprintf(
						// translators: %s: product ID.
						__( 'Could not find a product with ID %s. Please select a different product.', 'newspack-blocks' ),
						props.value
					)
				);
			} )
			.finally( () => setInFlight( false ) );
	}
	useEffect( () => {
		setIsChanging( false );
		if ( props.value ) {
			fetchSaved();
		} else {
			setSelected( false );
		}
	}, [ props.value ] );
	function onChange( tokens ) {
		const productName = tokens[ 0 ];
		const productId = invert( suggestions )[ productName ];
		setIsChanging( false );
		props.onChange( productId );
	}
	const debouncedFetchProductSuggestions = debounce( fetchSuggestions, 200 );
	const handleInputChange = value => {
		if ( value.length > 2 ) {
			setInFlight( true );
			debouncedFetchProductSuggestions( value );
		} else {
			setInFlight( false );
		}
	};
	if ( props.value && ! productError && ! selected && inFlight ) {
		return <Spinner />;
	}
	return (
		<div className="newspack-product-control__product-field" style={ { marginBottom: '16px' } }>
			{ selected && ! isChanging ? (
				<>
					<BaseControl label={ __( 'Product', 'newspack-blocks' ) } id="selected-product-control">
						<TextControl value={ selected.name } __next40pxDefaultSize disabled />
						<Button
							variant="link"
							onClick={ () => setIsChanging( true ) }
							aria-label={ __( 'Change the selected product', 'newspack-blocks' ) }
						>
							{ __( 'Edit', 'newspack-blocks' ) }
						</Button>
					</BaseControl>
					{ props.children }
				</>
			) : (
				<>
					<div className="newspack-product-control__product-field__tokenfield">
						<FormTokenField
							placeholder={ props.placeholder || __( 'Type to search for a product…', 'newspack-blocks' ) }
							label={ __( 'Product', 'newspack-blocks' ) }
							maxLength={ 1 }
							onChange={ onChange }
							onInputChange={ handleInputChange }
							suggestions={ Object.values( suggestions ) }
							__next40pxDefaultSize
						/>
						{ inFlight && <Spinner /> }
					</div>
					{ selected && (
						<Button variant="link" onClick={ () => setIsChanging( false ) }>
							{ __( 'Cancel', 'newspack-blocks' ) }
						</Button>
					) }
				</>
			) }
			{ productError && <p className="newspack-product-control__product-field__error">{ productError }</p> }
		</div>
	);
}

export default ProductControl;
