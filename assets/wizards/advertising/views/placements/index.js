/**
 * Ads Global Placements Settings.
 */

/**
 * External dependencies
 */
import classnames from 'classnames';
import { set } from 'lodash/fp';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { Fragment, useState, useEffect } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { settings } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import {
	ActionCard,
	Button,
	Card,
	Modal,
	Notice,
	ToggleControl,
	withWizardScreen,
} from '../../../../components/src';
import PlacementControl from '../../components/placement-control';

/**
 * Advertising Placements management screen.
 */
const Placements = () => {
	const [ initialized, setInitialized ] = useState( false );
	const [ inFlight, setInFlight ] = useState( false );
	const [ error, setError ] = useState( null );
	const [ providers, setProviders ] = useState( [] );
	const [ editingPlacement, setEditingPlacement ] = useState( null );
	const [ placements, setPlacements ] = useState( {} );
	const [ bidders, setBidders ] = useState( {} );
	const [ biddersError, setBiddersError ] = useState( null );

	const placementsApiFetch = async options => {
		try {
			const data = await apiFetch( options );
			setPlacements( data );
			setError( null );
		} catch ( err ) {
			setError( err );
		}
	};
	const handlePlacementToggle = placement => async value => {
		await placementsApiFetch( {
			path: `/newspack-ads/v1/placements/${ placement }`,
			method: value ? 'POST' : 'DELETE',
		} );
		if ( value ) {
			setEditingPlacement( placement );
		}
	};
	const handlePlacementChange = ( placementKey, hookKey ) => value => {
		const placementData = placements[ placementKey ]?.data;
		let data = {
			...placementData,
			...value,
		};
		if ( hookKey ) {
			data = {
				...placementData,
				hooks: {
					...placementData.hooks,
					[ hookKey ]: value,
				},
			};
		}
		setPlacements( {
			...placements,
			[ placementKey ]: {
				...placements[ placementKey ],
				data,
			},
		} );
	};
	const updatePlacement = async placementKey => {
		setInFlight( true );
		await placementsApiFetch( {
			path: `/newspack-ads/v1/placements/${ placementKey }`,
			method: 'POST',
			data: placements[ placementKey ].data,
		} );
		setInFlight( false );
	};
	const isEnabled = placementKey => {
		return placements[ placementKey ].data?.enabled;
	};

	// Fetch placements, providers and bidders.
	useEffect( async () => {
		setInFlight( true );
		await placementsApiFetch( { path: '/newspack-ads/v1/placements' } );
		try {
			const data = await apiFetch( { path: '/newspack-ads/v1/providers' } );
			setProviders( data );
		} catch ( err ) {
			setError( err );
		}
		try {
			const data = await apiFetch( { path: '/newspack-ads/v1/bidders' } );
			setBidders( data );
		} catch ( err ) {
			setBiddersError( err );
		}
		setInitialized( true );
		setInFlight( false );
	}, [] );

	// Silently refetch placements data when exiting edit modal.
	useEffect( () => {
		if ( ! editingPlacement && initialized ) {
			placementsApiFetch( { path: '/newspack-ads/v1/placements' } );
		}
	}, [ editingPlacement ] );

	const placement = editingPlacement ? placements[ editingPlacement ] : null;

	return (
		<Fragment>
			{ ! inFlight && ! providers.length && (
				<Notice isWarning noticeText={ __( 'There is no provider available.', 'newspack' ) } />
			) }
			<div
				className={ classnames( {
					'newspack-wizard-ads-placements': true,
					'newspack-wizard-section__is-loading': inFlight && ! Object.keys( placements ).length,
				} ) }
			>
				{ Object.keys( placements ).map( key => {
					return (
						<ActionCard
							key={ key }
							isSmall
							disabled={ inFlight || ! providers.length }
							title={ placements[ key ].name }
							description={ placements[ key ].description }
							toggleOnChange={ handlePlacementToggle( key ) }
							toggleChecked={ isEnabled( key ) }
							actionText={
								isEnabled( key ) ? (
									<Button
										isQuaternary
										isSmall
										disabled={ inFlight || ! providers.length }
										onClick={ () => setEditingPlacement( key ) }
										icon={ settings }
										label={ __( 'Placement settings', 'newspack' ) }
										tooltipPosition="bottom center"
									/>
								) : null
							}
						/>
					);
				} ) }
			</div>
			{ editingPlacement && placement && (
				<Modal
					title={ sprintf(
						// translators: %s is the name of the placement
						__( '%s placement settings', 'newspack' ),
						placement.name
					) }
					onRequestClose={ () => setEditingPlacement( null ) }
				>
					{ error && <Notice isError noticeText={ error.message } /> }
					{ biddersError && <Notice isWarning noticeText={ biddersError.message } /> }
					{ isEnabled( editingPlacement ) && placement.hook_name && (
						<PlacementControl
							providers={ providers }
							bidders={ bidders }
							value={ placement.data }
							disabled={ inFlight }
							onChange={ handlePlacementChange( editingPlacement ) }
						/>
					) }
					{ placement.hooks &&
						Object.keys( placement.hooks ).map( hookKey => {
							const hook = {
								hookKey,
								...placement.hooks[ hookKey ],
							};
							return (
								<Card noBorder key={ hookKey }>
									<PlacementControl
										label={ hook.name + ' ' + __( 'Ad Unit', 'newspack' ) }
										providers={ providers }
										bidders={ bidders }
										value={ placement.data?.hooks ? placement.data.hooks[ hookKey ] : {} }
										disabled={ inFlight }
										onChange={ handlePlacementChange( editingPlacement, hookKey ) }
									/>
								</Card>
							);
						} ) }
					<ToggleControl
						label={ __( 'Use fixed height', 'newspack' ) }
						help={ __(
							'Avoid content layout shift by using the ad unit height as fixed height for this placement. This is recommended if an ad will be shown across all devices.',
							'newspack'
						) }
						checked={ !! placement.data?.fixed_height }
						onChange={ value => {
							setPlacements(
								set( [ editingPlacement, 'data', 'fixed_height' ], value, placements )
							);
						} }
					/>
					{ placement.supports?.indexOf( 'stick_to_top' ) > -1 && (
						<ToggleControl
							label={ __( 'Stick to Top', 'newspack' ) }
							checked={ !! placement.data?.stick_to_top }
							onChange={ value => {
								setPlacements(
									set( [ editingPlacement, 'data', 'stick_to_top' ], value, placements )
								);
							} }
						/>
					) }
					<Card buttonsCard noBorder className="justify-end">
						<Button
							isSecondary
							disabled={ inFlight }
							onClick={ () => {
								setEditingPlacement( null );
							} }
						>
							{ __( 'Cancel', 'newspack' ) }
						</Button>
						<Button
							isPrimary
							disabled={ inFlight }
							onClick={ async () => {
								await updatePlacement( editingPlacement );
								setEditingPlacement( null );
							} }
						>
							{ __( 'Save', 'newspack' ) }
						</Button>
					</Card>
				</Modal>
			) }
		</Fragment>
	);
};

export default withWizardScreen( Placements );
