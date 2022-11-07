/**
 * Ad Unit Management Screens.
 */

/**
 * External dependencies
 */
import { omit } from 'lodash';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { Button, TextControl, CheckboxControl, SelectControl } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { ActionCard, Modal, withWizardScreen } from '../../../../components/src';

const payableEvents = {
	impressions: {
		label: __( 'Impressions', 'newspack' ),
		unit: {
			label: __( 'CPM', 'newspack' ),
			value: 'cpm',
		},
		description: __( 'The number of times your ad is rendered on a page.', 'newspack' ),
	},
	clicks: {
		label: __( 'Clicks', 'newspack' ),
		unit: {
			label: __( 'CPC', 'newspack' ),
			value: 'cpc',
		},
		description: __( 'The number of times a user clicks on your ad.', 'newspack' ),
	},
	viewable_impressions: {
		label: __( 'Viewable Impressions', 'newspack' ),
		unit: {
			label: __( 'Viewable CPM', 'newspack' ),
			value: 'viewable_cpm',
		},
		description: __( 'The number of times your ad is shown on a page.', 'newspack' ),
	},
};

const AdProductValues = ( { event, value = {}, onChange = () => {}, ...props } ) => {
	const [ values, setValues ] = useState( value || {} );
	const eventData = payableEvents[ event ];
	useEffect( () => {
		onChange( values );
	}, [ values ] );
	if ( ! eventData ) return null;
	return (
		<TextControl
			label={ eventData.unit.label }
			help={ eventData.description }
			value={ values[ eventData.unit.value ] || '' }
			onChange={ val => setValues( { ...values, [ eventData.unit.value ]: val } ) }
			{ ...props }
		/>
	);
};

/**
 * Advertising Markplace screen.
 */
const Marketplace = ( { adUnits } ) => {
	const [ isEditing, setIsEditing ] = useState( false );
	const [ placements, setPlacements ] = useState( {} );
	const [ products, setProducts ] = useState( {} );
	const [ product, setProduct ] = useState( {} );
	const [ inFlight, setInFlight ] = useState( false );
	const fetchPlacements = () => {
		apiFetch( {
			path: `/newspack-ads/v1/placements`,
		} ).then( data => {
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
			isEditing
				? {
						placement: isEditing,
						ad_unit: placements[ isEditing ]?.data?.ad_unit,
						...products[ isEditing ],
				  }
				: {}
		);
	}, [ isEditing ] );
	useEffect( fetchPlacements, [] );
	useEffect( fetchProducts, [] );
	const saveProduct = () => {
		setInFlight( true );
		apiFetch( {
			path: `/newspack-ads/v1/products/${ product.placement }`,
			method: 'POST',
			data: omit( product, 'placement' ),
		} )
			.then( res => {
				setProducts( { ...products, [ product.placement ]: res } );
				setIsEditing( false );
			} )
			.finally( () => {
				setInFlight( false );
			} );
	};
	const isPerSize = () => {
		return product.ad_unit && adUnits[ product.ad_unit ]?.sizes?.length && product.is_per_size;
	};
	return (
		<>
			{ Object.keys( placements ).map( key => (
				<ActionCard
					key={ key }
					isSmall
					disabled={ inFlight }
					title={ placements[ key ].name }
					actionText={
						<Button disabled={ inFlight } onClick={ () => setIsEditing( key ) }>
							{ __( 'Sell', 'newspack' ) }
						</Button>
					}
				/>
			) ) }
			{ isEditing && (
				<Modal
					title={ sprintf(
						// Translators: placement name.
						__( 'Sell %s', 'newspack' ),
						placements[ isEditing ].name
					) }
					onRequestClose={ () => ! inFlight && setIsEditing( false ) }
				>
					<SelectControl
						label={ __( 'Ad Unit', 'newspack' ) }
						value={ product?.ad_unit }
						options={ [
							{ label: __( 'Select an ad unit', 'newspack' ), value: '' },
							...Object.keys( adUnits ).map( key => ( {
								label: adUnits[ key ].name,
								value: key,
							} ) ),
						] }
						onChange={ val => setProduct( { ...product, ad_unit: val } ) }
					/>
					<SelectControl
						label={ __( 'Event', 'newspack' ) }
						value={ product?.event }
						disabled={ ! product?.ad_unit }
						options={ [
							{ label: __( 'Select a payable event', 'newspack' ), value: '' },
							...Object.keys( payableEvents ).map( key => ( {
								label: payableEvents[ key ].label,
								value: key,
							} ) ),
						] }
						onChange={ value => setProduct( { ...product, event: value } ) }
					/>
					{ product.event && (
						<>
							<AdProductValues
								event={ product.event }
								value={ product.prices }
								disabled={ isPerSize() }
								onChange={ value => setProduct( { ...product, prices: value } ) }
							/>
							{ product.ad_unit && adUnits[ product.ad_unit ]?.sizes?.length > 1 && (
								<>
									<CheckboxControl
										name="is_per_size"
										label={ __( 'Set price per size', 'newspack' ) }
										checked={ product.is_per_size }
										onChange={ value => setProduct( { ...product, is_per_size: value } ) }
									/>
									{ product.is_per_size && (
										<div className="sizes">
											<h3>{ __( 'Sizes', 'newspack' ) }</h3>
											{ adUnits[ product.ad_unit ].sizes.map( ( size, i ) => (
												<div className="size" key={ i }>
													{ size[ 0 ] } x { size[ 1 ] }
													<AdProductValues
														event={ product.event }
														value={ product.per_size?.[ `${ size[ 0 ] }x${ size[ 1 ] }` ]?.prices }
														onChange={ value =>
															setProduct( {
																...product,
																per_size: {
																	...product.per_size,
																	[ `${ size[ 0 ] }x${ size[ 1 ] }` ]: {
																		...product.per_size?.[ `${ size[ 0 ] }x${ size[ 1 ] }` ],
																		...{ prices: value },
																	},
																},
															} )
														}
													/>
												</div>
											) ) }
										</div>
									) }
								</>
							) }
						</>
					) }
					<Button disabled={ ! product.event } isPrimary onClick={ saveProduct }>
						{ __( 'Save Product', 'newspack' ) }
					</Button>
				</Modal>
			) }
		</>
	);
};

export default withWizardScreen( Marketplace );
