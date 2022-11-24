/**
 * Ad Unit Management Screens.
 */

/**
 * External dependencies
 */
import { uniq } from 'lodash';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { Button, TextControl, CheckboxControl } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { settings, trash } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { Grid, ActionCard, Modal, withWizardScreen } from '../../../../components/src';

const AdProductEditor = ( {
	product,
	adUnits = {},
	placements = {},
	onChange = () => {},
	onSave = () => {},
} ) => {
	const getSizes = () => {
		const productPlacements = product.placements || [];
		const sizes = [];
		productPlacements.forEach( placement => {
			const adUnit = adUnits[ placements[ placement ].data.ad_unit ];
			if ( adUnit ) {
				sizes.push( ...adUnit.sizes );
			}
		} );
		return uniq( sizes.map( size => size.join( 'x' ) ) );
	};
	const isValid = () => {
		return (
			product.placements?.length &&
			product.required_sizes?.length &&
			parseFloat( product.price ) > 0
		);
	};
	return (
		<>
			<h3>{ __( 'Placements', 'newspack' ) }</h3>
			<Grid columns={ 2 } gutter={ 8 }>
				{ Object.keys( placements ).map( key => (
					<CheckboxControl
						key={ key }
						label={ placements[ key ].name }
						checked={ product.placements?.includes( key ) }
						onChange={ () => {
							const newPlacements = [ ...product.placements ];
							if ( newPlacements.includes( key ) ) {
								newPlacements.splice( newPlacements.indexOf( key ), 1 );
							} else {
								newPlacements.push( key );
							}
							onChange( { ...product, placements: newPlacements } );
						} }
					/>
				) ) }
			</Grid>
			{ getSizes().length > 0 && (
				<>
					<h3>{ __( 'Required Sizes', 'newspack' ) }</h3>
					<Grid columns={ 4 } gutter={ 8 }>
						{ getSizes().map( size => (
							<CheckboxControl
								key={ size }
								label={ size }
								checked={ product.required_sizes?.includes( size ) }
								onChange={ () => {
									const newSizes = [ ...product.required_sizes ];
									if ( newSizes.includes( size ) ) {
										newSizes.splice( newSizes.indexOf( size ), 1 );
									} else {
										newSizes.push( size );
									}
									onChange( { ...product, required_sizes: newSizes } );
								} }
							/>
						) ) }
					</Grid>
				</>
			) }
			{ product.placements?.length > 0 && product.required_sizes?.length > 0 && (
				<>
					<h3>{ __( 'Pricing', 'newspack' ) }</h3>
					<TextControl
						label={ __( 'CPD', 'newspack' ) }
						value={ product.price }
						onChange={ price => onChange( { ...product, price } ) }
					/>
				</>
			) }
			<Button disabled={ ! isValid() } isPrimary onClick={ onSave }>
				{ __( 'Save Product', 'newspack' ) }
			</Button>
		</>
	);
};

/**
 * Advertising Markplace screen.
 */
const Marketplace = ( { adUnits } ) => {
	const [ isEditing, setIsEditing ] = useState( false );
	const [ placements, setPlacements ] = useState( {} );
	const [ products, setProducts ] = useState( [] );
	const [ product, setProduct ] = useState( {} );
	const [ inFlight, setInFlight ] = useState( false );
	const fetchPlacements = () => {
		apiFetch( {
			path: `/newspack-ads/v1/placements`,
		} ).then( data => {
			for ( const key in data ) {
				if ( ! data[ key ].data?.ad_unit ) {
					delete data[ key ];
				}
			}
			setPlacements( data );
		} );
	};
	const fetchProducts = () => {
		setInFlight( true );
		apiFetch( {
			path: `/newspack-ads/v1/products`,
		} )
			.then( data => {
				setProducts( data );
			} )
			.finally( () => setInFlight( false ) );
	};
	useEffect( () => {
		setProduct(
			false !== isEditing
				? {
						placements: [],
						required_sizes: [],
						...products[ isEditing ],
				  }
				: {}
		);
	}, [ isEditing ] );
	useEffect( fetchPlacements, [] );
	useEffect( fetchProducts, [] );
	const getProductTitle = ( { placements: productPlacements } ) => {
		const productPlacementsNames = productPlacements.map( key => placements[ key ].name );
		return productPlacementsNames.join( ', ' );
	};
	const getProductDescription = ( { price, required_sizes: productSizes } ) => {
		return sprintf(
			/* translators: 1: price, 2: list of required sizes. */
			__( 'CPD: %1$s - Required Sizes: %2$s', 'newspack' ),
			price,
			productSizes.join( ', ' )
		);
	};
	const saveProduct = () => {
		setInFlight( true );
		let path = `/newspack-ads/v1/products`;
		if ( product.id ) {
			path += `/${ product.id }`;
		}
		apiFetch( {
			path,
			method: 'POST',
			data: product,
		} )
			.then( res => {
				const newProducts = [ ...products ];
				const idx = newProducts.findIndex( p => p.id === res.id );
				if ( idx > -1 ) {
					newProducts[ idx ] = res;
				} else {
					newProducts.push( res );
				}
				setProducts( newProducts );
				setIsEditing( false );
			} )
			.finally( () => {
				setInFlight( false );
			} );
	};
	const deleteProduct = id => {
		// eslint-disable-next-line no-alert
		if ( ! confirm( __( 'Are you sure you want to delete this product?', 'newspack' ) ) ) {
			return;
		}
		setInFlight( true );
		apiFetch( {
			path: `/newspack-ads/v1/products/${ id }`,
			method: 'DELETE',
		} )
			.then( data => {
				setProducts( data );
				setIsEditing( false );
			} )
			.finally( () => {
				setInFlight( false );
			} );
	};
	return (
		<>
			{ products.map( ( p, i ) => (
				<ActionCard
					key={ p.id }
					isSmall
					disabled={ inFlight }
					title={ getProductTitle( p ) }
					description={ getProductDescription( p ) }
					actionText={
						<>
							<Button
								disabled={ inFlight }
								onClick={ () => setIsEditing( i ) }
								icon={ settings }
								label={ __( 'Edit product', 'newspack' ) }
								tooltipPosition="bottom center"
							/>
							<Button
								disabled={ inFlight }
								onClick={ () => deleteProduct( p.id ) }
								icon={ trash }
								label={ __( 'Delete product', 'newspack' ) }
								tooltipPosition="bottom center"
							/>
						</>
					}
				/>
			) ) }
			<Button isPrimary onClick={ () => setIsEditing( true ) }>
				{ __( 'Create New Product', 'newspack' ) }
			</Button>
			{ false !== isEditing && (
				<Modal
					title={
						product.id
							? __( 'Edit ad product', 'newspack' )
							: __( 'Create new ad product', 'newspack' )
					}
					onRequestClose={ () => ! inFlight && setIsEditing( false ) }
				>
					<AdProductEditor
						product={ product }
						adUnits={ adUnits }
						placements={ placements }
						onChange={ setProduct }
						onSave={ saveProduct }
					/>
				</Modal>
			) }
		</>
	);
};

export default withWizardScreen( Marketplace );
