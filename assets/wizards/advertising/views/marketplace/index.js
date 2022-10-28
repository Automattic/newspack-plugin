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

const AdProductValues = ( { event, value = {}, onChange = () => {} } ) => {
	const [ values, setValues ] = useState( value );
	useEffect( () => {
		onChange( values );
	}, [ values ] );
	return (
		<>
			{ event === 'impressions' && (
				<TextControl
					label={ __( 'CPM', 'newspack-ads' ) }
					value={ values?.cpm }
					name="cpm"
					onChange={ val => setValues( { ...values, cpm: val } ) }
				/>
			) }
			{ event === 'clicks' && (
				<TextControl
					label={ __( 'CPC', 'newspack-ads' ) }
					value={ values?.cpc }
					name="cpc"
					onChange={ val => setValues( { ...values, cpc: val } ) }
				/>
			) }
			{ event === 'viewable_impressions' && (
				<TextControl
					label={ __( 'Viewable CPM', 'newspack-ads' ) }
					value={ values?.viewable_impressions }
					name="viewable_cpm"
					onChange={ val => setValues( { ...values, viewable_cpm: val } ) }
				/>
			) }
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
						__( 'Sell %s', 'newspack-ads' ),
						placements[ isEditing ].name
					) }
					onRequestClose={ () => ! inFlight && setIsEditing( false ) }
				>
					<SelectControl
						label={ __( 'Ad Unit', 'newspack-ads' ) }
						value={ product?.ad_unit }
						options={ Object.keys( adUnits ).map( key => ( {
							label: adUnits[ key ].name,
							value: key,
						} ) ) }
						onChange={ val => setProduct( { ...product, ad_unit: val } ) }
					/>
					<SelectControl
						label={ __( 'Event', 'newspack-ads' ) }
						options={ [
							{ label: __( 'Select an event', 'newspack' ), value: '' },
							{ label: __( 'Impressions', 'newspack' ), value: 'impressions' },
							{ label: __( 'Clicks', 'newspack' ), value: 'clicks' },
							{ label: __( 'Viewable Impressions', 'newspack' ), value: 'viewable_impressions' },
						] }
						onChange={ value => setProduct( { ...product, event: value } ) }
					/>
					{ product.event && (
						<>
							<AdProductValues
								event={ product.event }
								value={ product.prices }
								onChange={ value => setProduct( { ...product, prices: value } ) }
							/>
							<CheckboxControl
								name="is_per_size"
								label={ __( 'Set price per size', 'newspack-ads' ) }
								checked={ product.is_per_size }
								onChange={ value => setProduct( { ...product, is_per_size: value } ) }
							/>
							{ product.is_per_size &&
								product.ad_unit &&
								adUnits[ product.ad_unit ]?.sizes?.length && (
									<div className="sizes">
										<h3>{ __( 'Sizes', 'newspack-ads' ) }</h3>
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
					<Button disabled={ ! product.event } isPrimary onClick={ saveProduct }>
						{ __( 'Save Product', 'newspack' ) }
					</Button>
				</Modal>
			) }
		</>
	);
};

export default withWizardScreen( Marketplace );
