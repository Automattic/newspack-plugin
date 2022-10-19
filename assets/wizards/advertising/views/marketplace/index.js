/**
 * Ad Unit Management Screens.
 */

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
	const [ product, setProduct ] = useState( {} );
	const [ inFlight, setInFlight ] = useState( false );
	const fetchPlacements = () => {
		apiFetch( {
			path: `/newspack-ads/v1/placements`,
		} ).then( data => {
			console.log( data );
			setPlacements( data );
		} );
	};
	useEffect( () => {
		setProduct(
			isEditing ? { placement: isEditing, ad_unit: placements[ isEditing ]?.data?.ad_unit } : {}
		);
	}, [ isEditing ] );
	useEffect( fetchPlacements, [] );
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
							{ label: 'Select an event', value: '' },
							{ label: 'Impressions', value: 'impressions' },
							{ label: 'Clicks', value: 'clicks' },
							{ label: 'Viewable Impressions', value: 'viewable_impressions' },
						] }
						onChange={ value => setProduct( { ...product, event: value } ) }
					/>
					{ product.event && (
						<>
							<AdProductValues
								event={ product.event }
								onChange={ value => setProduct( { ...product, values: value } ) }
							/>
							<CheckboxControl
								name="is_size_priced"
								label={ __( 'Set price per size', 'newspack-ads' ) }
								checked={ product.is_size_priced }
								onChange={ value => setProduct( { ...product, is_size_priced: value } ) }
							/>
							{ product.is_size_priced && product.ad_unit && adUnits[ product.ad_unit ] && (
								<div className="sizes">
									<h3>{ __( 'Sizes', 'newspack-ads' ) }</h3>
									{ adUnits[ product.ad_unit ].sizes.map( ( size, i ) => (
										<div className="size" key={ i }>
											{ size[ 0 ] } x { size[ 1 ] }
											<AdProductValues
												event={ product.event }
												onChange={ value =>
													setProduct( {
														...product,
														per_size: {
															...product.per_size,
															[ `${ size[ 0 ] }x${ size[ 1 ] }` ]: value,
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
				</Modal>
			) }
		</>
	);
};

export default withWizardScreen( Marketplace );
