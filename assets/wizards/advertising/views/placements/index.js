/**
 * Ads Global Placements Settings.
 */

/**
 * External dependencies
 */
import classnames from 'classnames';

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
	Modal,
	Card,
	Notice,
	SectionHeader,
	Button,
	withWizardScreen,
} from '../../../../components/src';
import PlacementControl from '../../components/placement-control';

/**
 * Advertising Placements management screen.
 */
const Placements = ( { adUnits } ) => {
	const [ initialized, setInitialized ] = useState( false );
	const [ inFlight, setInFlight ] = useState( false );
	const [ error, setError ] = useState( null );
	const [ editingPlacement, setEditingPlacement ] = useState( null );
	const [ placements, setPlacements ] = useState( {} );
	const [ bidders, setBidders ] = useState( {} );
	const [ biddersError, setBiddersError ] = useState( null );

	const placementsApiFetch = async ( options, quiet = false ) => {
		if ( ! quiet ) setInFlight( true );
		try {
			const data = await apiFetch( options );
			setPlacements( data );
			setError( null );
		} catch ( err ) {
			setError( err );
		} finally {
			if ( ! quiet ) setInFlight( false );
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
		await placementsApiFetch( {
			path: `/newspack-ads/v1/placements/${ placementKey }`,
			method: 'POST',
			data: placements[ placementKey ].data,
		} );
	};
	const isEnabled = placementKey => {
		return placements[ placementKey ].data?.enabled;
	};

	// Fetch initial placements and bidders.
	useEffect( () => {
		const init = async () => {
			await placementsApiFetch( { path: '/newspack-ads/v1/placements' } );
			try {
				const data = await apiFetch( { path: '/newspack-ads/v1/bidders' } );
				setBidders( data );
			} catch ( err ) {
				setBiddersError( err );
			}
			setInitialized( true );
		};
		init();
	}, [] );

	// Silently refetch placements data when exiting edit modal.
	useEffect( () => {
		if ( ! editingPlacement && initialized ) {
			placementsApiFetch( { path: '/newspack-ads/v1/placements' }, true );
		}
	}, [ editingPlacement ] );

	const placement = editingPlacement ? placements[ editingPlacement ] : null;

	return (
		<Fragment>
			<SectionHeader
				title={ __( 'Ad Placements', 'newspack' ) }
				description={ () => (
					<>
						{ __(
							'Define global advertising placements to serve ad units on your site',
							'newspack'
						) }
						<br />
						{ __(
							'Enable the individual pre-defined ad placements to select which ads to serve',
							'newspack'
						) }
					</>
				) }
			/>
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
							disabled={ inFlight }
							title={ placements[ key ].name }
							description={ placements[ key ].description }
							toggleOnChange={ handlePlacementToggle( key ) }
							toggleChecked={ isEnabled( key ) }
							hasGreyHeader={ ! isEnabled( key ) }
							actionText={
								isEnabled( key ) ? (
									<Button
										isQuaternary
										isSmall
										disabled={ inFlight }
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
							adUnits={ adUnits }
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
								<>
									<h2>{ hook.name }</h2>
									<PlacementControl
										key={ hookKey }
										adUnits={ adUnits }
										bidders={ bidders }
										value={ placement.data?.hooks ? placement.data.hooks[ hookKey ] : {} }
										disabled={ inFlight }
										onChange={ handlePlacementChange( editingPlacement, hookKey ) }
									/>
								</>
							);
						} ) }
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
