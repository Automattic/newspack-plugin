/**
 * Ads Global Placements Settings.
 */

/**
 * External dependencies
 */
import classnames from 'classnames';
import set from 'lodash/set';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { Fragment, useState, useEffect } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { settings } from '@wordpress/icons';
import { ToggleControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import {
	ActionCard,
	Button,
	Card,
	Modal,
	Notice,
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
	useEffect( () => {
		const fetchData = async () => {
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
		};
		fetchData();
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
				<Notice
					isWarning
					noticeText={ __( 'There is no provider available.', 'newspack-plugin' ) }
				/>
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
										disabled={ inFlight || ! providers.length }
										onClick={ () => setEditingPlacement( key ) }
										icon={ settings }
										label={ __( 'Placement settings', 'newspack-plugin' ) }
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
						__( '%s placement settings', 'newspack-plugin' ),
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
										label={ hook.name + ' ' + __( 'Ad Unit', 'newspack-plugin' ) }
										providers={ providers }
										bidders={ bidders }
										value={ placement.data?.hooks ? placement.data.hooks[ hookKey ] : {} }
										disabled={ inFlight }
										onChange={ handlePlacementChange( editingPlacement, hookKey ) }
									/>
								</Card>
							);
						} ) }
					{ placement.supports?.indexOf( 'stick_to_top' ) > -1 && (
						<ToggleControl
							label={ __( 'Stick to Top', 'newspack-plugin' ) }
							checked={ !! placement.data?.stick_to_top }
							onChange={ value => {
								setPlacements(
									set( { ...placements }, [ editingPlacement, 'data', 'stick_to_top' ], value )
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
							{ __( 'Cancel', 'newspack-plugin' ) }
						</Button>
						<Button
							isPrimary
							disabled={ inFlight }
							onClick={ async () => {
								await updatePlacement( editingPlacement );
								setEditingPlacement( null );
							} }
						>
							{ __( 'Save', 'newspack-plugin' ) }
						</Button>
					</Card>
				</Modal>
			) }
		</Fragment>
	);
};

export default withWizardScreen( Placements );
