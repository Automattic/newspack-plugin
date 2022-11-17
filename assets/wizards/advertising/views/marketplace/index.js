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
import { Grid, ActionCard, Modal, withWizardScreen } from '../../../../components/src';

const IAB_SIZES = window.newspack_ads_wizard.iab_sizes;

const payableEvents = {
	impressions: {
		label: __( 'Impressions', 'newspack' ),
		unit: {
			label: __( 'CPM', 'newspack' ),
			value: 'cpm',
		},
		description: __( 'The number of times the ad is rendered on a page.', 'newspack' ),
	},
	clicks: {
		label: __( 'Clicks', 'newspack' ),
		unit: {
			label: __( 'CPC', 'newspack' ),
			value: 'cpc',
		},
		description: __( 'The number of times a user clicks on the ad.', 'newspack' ),
	},
	viewable_impressions: {
		label: __( 'Viewable Impressions', 'newspack' ),
		unit: {
			label: __( 'Viewable CPM', 'newspack' ),
			value: 'viewable_cpm',
		},
		description: __( 'The number of times the ad is shown on a page.', 'newspack' ),
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

const AdProductEditor = ( { adUnits, product, onChange = () => {}, onSave = () => {} } ) => {
	const getSizes = () => {
		let sizes = Object.keys( IAB_SIZES ).map( sizeString => sizeString.split( 'x' ).map( Number ) );
		if ( product.ad_unit ) {
			sizes = adUnits[ product.ad_unit ]?.sizes || sizes;
		}
		return sizes.map( size => size.join( 'x' ) );
	};
	const handlePayableEventsChange = event => () => {
		const newPayableEvents = [ ...product.payable_events ];
		if ( newPayableEvents.includes( event ) ) {
			newPayableEvents.splice( newPayableEvents.indexOf( event ), 1 );
		} else {
			newPayableEvents.push( event );
		}
		onChange( { ...product, payable_events: newPayableEvents } );
	};
	return (
		<>
			<h3>{ __( 'Payable Events', 'newspack' ) }</h3>
			{ Object.keys( payableEvents ).map( event => (
				<CheckboxControl
					key={ event }
					label={ payableEvents[ event ].label }
					checked={ product.payable_events?.includes( event ) }
					onChange={ handlePayableEventsChange( event ) }
				/>
			) ) }
			<hr />
			<h3>{ __( 'Allowed Sizes', 'newspack' ) }</h3>
			<Grid columns={ 4 } gutter={ 8 }>
				{ getSizes().map( size => (
					<CheckboxControl
						key={ size }
						label={ size }
						checked={ product.allowed_sizes?.includes( size ) }
						onChange={ () => {
							const newSizes = [ ...product.allowed_sizes ];
							if ( newSizes.includes( size ) ) {
								newSizes.splice( newSizes.indexOf( size ), 1 );
							} else {
								newSizes.push( size );
							}
							onChange( { ...product, allowed_sizes: newSizes } );
						} }
					/>
				) ) }
			</Grid>
			<hr />
			{ product.payable_events?.length > 0 && product.allowed_sizes?.length > 0 && (
				<>
					<h3>{ __( 'Pricing', 'newspack' ) }</h3>
					<CheckboxControl
						label={ __( 'Flat fee', 'newspack' ) }
						help={ __(
							'If checked, the ad will be sold for a flat fee, regardless of the creative size.',
							'newspack'
						) }
						checked={ product.is_flat_fee }
						value={ product.is_flat_fee }
						onChange={ is_flat_fee => onChange( { ...product, is_flat_fee } ) }
					/>
					{ product.is_flat_fee ? (
						<Grid columns={ product.payable_events?.length || 1 } gutter={ 8 }>
							{ product.payable_events?.map( event => (
								<AdProductValues
									key={ event }
									event={ event }
									value={ product.prices }
									onChange={ value => onChange( { ...product, prices: value } ) }
								/>
							) ) }
						</Grid>
					) : (
						<div className="sizes">
							{ product.allowed_sizes?.map( ( size, i ) => (
								<div className="size" key={ i }>
									<h4>
										{ sprintf(
											// Translators: size name.
											__( 'Pricing for %s', 'newspack' ),
											size
										) }
									</h4>
									{ product.payable_events?.length && (
										<Grid columns={ product.payable_events?.length || 1 } gutter={ 8 }>
											{ product.payable_events?.map( event => (
												<AdProductValues
													key={ event }
													event={ event }
													value={ product.size?.[ size ]?.prices }
													onChange={ value =>
														onChange( {
															...product,
															size: {
																...product.size,
																[ size ]: {
																	...product.size?.[ size ],
																	...{ prices: value },
																},
															},
														} )
													}
												/>
											) ) }
										</Grid>
									) }
								</div>
							) ) }
						</div>
					) }
				</>
			) }
			<Button disabled={ ! product.event } isPrimary onClick={ onSave }>
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
	const [ products, setProducts ] = useState( {} );
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
			isEditing
				? {
						placement: isEditing,
						ad_unit: placements[ isEditing ]?.data?.ad_unit || null,
						payable_events: [ 'impressions' ],
						is_flat_fee: true,
						allowed_sizes: [],
						...products[ isEditing ],
				  }
				: {}
		);
	}, [ isEditing ] );
	useEffect( fetchPlacements, [] );
	useEffect( fetchProducts, [] );
	const getPlacementName = key => {
		if ( key === 'global' ) {
			return __( 'Global', 'newspack' );
		}
		return placements[ key ]?.name || key;
	};
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
	return (
		<>
			<ActionCard
				isSmall
				disabled={ inFlight }
				title={ __( 'Global', 'newspack' ) }
				actionText={
					<Button disabled={ inFlight } onClick={ () => setIsEditing( 'global' ) }>
						{ __( 'Sell', 'newspack' ) }
					</Button>
				}
			/>
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
						getPlacementName( isEditing )
					) }
					onRequestClose={ () => ! inFlight && setIsEditing( false ) }
				>
					<AdProductEditor
						adUnits={ adUnits }
						product={ product }
						onChange={ setProduct }
						onSave={ saveProduct }
					/>
				</Modal>
			) }
		</>
	);
};

export default withWizardScreen( Marketplace );
