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
import { Fragment, useState, useEffect, createPortal } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { __experimentalHStack as HStack, __experimentalVStack as VStack, Snackbar, ToggleControl } from '@wordpress/components'; // eslint-disable-line @wordpress/no-unsafe-wp-apis

/**
 * Internal dependencies
 */
import { Button, CardForm, Grid, Notice, withWizardScreen } from '../../../../../packages/components/src';
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
	const [ isEnabling, setIsEnabling ] = useState( false );
	const [ originalData, setOriginalData ] = useState( null );
	const [ placements, setPlacements ] = useState( {} );
	const [ bidders, setBidders ] = useState( {} );
	const [ biddersError, setBiddersError ] = useState( null );
	const [ notices, setNotices ] = useState( [] );

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
			setIsEnabling( true );
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
		let success = false;
		try {
			await apiFetch( {
				path: `/newspack-ads/v1/placements/${ placementKey }`,
				method: 'POST',
				data: placements[ placementKey ].data,
			} );
			success = true;
			setError( null );
		} catch ( err ) {
			setError( err );
		}
		setInFlight( false );
		return success;
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

	const cancelEditing = async () => {
		if ( isEnabling && editingPlacement ) {
			await handlePlacementToggle( editingPlacement )( false );
		}
		setIsEnabling( false );
		setOriginalData( null );
		setEditingPlacement( null );
	};

	// Silently refetch placements data when exiting edit panel.
	useEffect( () => {
		if ( ! editingPlacement && initialized ) {
			placementsApiFetch( { path: '/newspack-ads/v1/placements' } );
		}
	}, [ editingPlacement ] );

	return (
		<Fragment>
			{ ! inFlight && ! providers.length && <Notice isWarning noticeText={ __( 'There is no provider available.', 'newspack-plugin' ) } /> }
			<Grid columns={ 12 } noMargin gutter={ 0 }>
				<h1 style={ { gridColumn: 'span 4' } }>{ __( 'Placements', 'newspack-plugin' ) }</h1>
				<VStack
					spacing={ 4 }
					style={ { gridColumn: 'span 8' } }
					className={ classnames( {
						'newspack-wizard-ads-placements': true,
						'newspack-wizard-section__is-loading': inFlight && ! Object.keys( placements ).length,
					} ) }
				>
					{ Object.keys( placements ).map( key => {
						const placement = placements[ key ];
						const enabled = isEnabled( key );
						const isEditing = editingPlacement === key;
						const hasChanges = JSON.stringify( placement.data ) !== JSON.stringify( originalData );
						let hasAdUnit = true;
						if ( placement.hook_name ) {
							hasAdUnit = !! placement.data?.ad_unit;
						} else if ( placement.hooks ) {
							hasAdUnit = Object.keys( placement.hooks ).every( hookKey => !! placement.data?.hooks?.[ hookKey ]?.ad_unit );
						}

						return (
							<CardForm
								key={ key }
								title={ placement.name }
								description={ placement.description }
								badge={
									enabled && ! ( isEditing && isEnabling )
										? { level: 'success', text: __( 'Enabled', 'newspack-plugin' ) }
										: undefined
								}
								actions={
									enabled ? (
										<Button
											variant="tertiary"
											size="compact"
											disabled={ inFlight }
											onClick={ () => {
												if ( isEditing ) {
													cancelEditing();
												} else {
													setOriginalData( placement.data );
													setEditingPlacement( key );
												}
											} }
										>
											{ isEditing ? __( 'Cancel', 'newspack-plugin' ) : __( 'Edit', 'newspack-plugin' ) }
										</Button>
									) : (
										<Button
											variant="secondary"
											size="compact"
											isBusy={ inFlight }
											disabled={ inFlight || ! providers.length }
											onClick={ () => handlePlacementToggle( key )( true ) }
										>
											{ __( 'Enable', 'newspack-plugin' ) }
										</Button>
									)
								}
								isOpen={ isEditing }
								onRequestClose={ cancelEditing }
								className={ classnames( 'newspack-wizard-ads-placement', {
									'newspack-wizard-ads-placement--enabled': enabled,
								} ) }
							>
								<VStack spacing={ 4 }>
									{ error && <Notice isError noticeText={ error.message } /> }
									{ biddersError && <Notice isWarning noticeText={ biddersError.message } /> }
									{ ( enabled || isEnabling ) && placement.hook_name && (
										<PlacementControl
											providers={ providers }
											bidders={ bidders }
											value={ placement.data }
											disabled={ inFlight }
											onChange={ handlePlacementChange( key ) }
										/>
									) }
									{ placement.hooks &&
										Object.keys( placement.hooks ).map( hookKey => {
											const hook = {
												hookKey,
												...placement.hooks[ hookKey ],
											};
											return (
												<PlacementControl
													key={ hookKey }
													label={ hook.name + ' ' + __( 'Ad Unit', 'newspack-plugin' ) }
													providers={ providers }
													bidders={ bidders }
													value={ placement.data?.hooks ? placement.data.hooks[ hookKey ] : {} }
													disabled={ inFlight }
													onChange={ handlePlacementChange( key, hookKey ) }
												/>
											);
										} ) }
									{ placement.supports?.indexOf( 'stick_to_top' ) > -1 && (
										<ToggleControl
											label={ __( 'Stick to Top', 'newspack-plugin' ) }
											checked={ !! placement.data?.stick_to_top }
											onChange={ value => {
												setPlacements( {
													...placements,
													[ key ]: {
														...placements[ key ],
														data: {
															...placements[ key ].data,
															stick_to_top: value,
														},
													},
												} );
											} }
										/>
									) }
									<HStack justify="flex-start" spacing={ 2 }>
										<Button
											variant="primary"
											size="compact"
											isBusy={ inFlight }
											disabled={ inFlight || ( isEnabling ? ! hasAdUnit : ! hasChanges ) }
											onClick={ async () => {
												const success = await updatePlacement( key );
												if ( ! success ) {
													return;
												}
												const name = placement.name;
												setIsEnabling( false );
												setOriginalData( null );
												setEditingPlacement( null );
												// translators: %s: placement name.
												const enabledContent = sprintf( __( '%s enabled.', 'newspack-plugin' ), name );
												// translators: %s: placement name.
												const updatedContent = sprintf( __( '%s updated.', 'newspack-plugin' ), name );
												const savedContent = isEnabling ? enabledContent : updatedContent;
												setNotices( [
													{
														id: 'placement-saved',
														content: savedContent,
													},
												] );
											} }
										>
											{ isEnabling ? __( 'Enable', 'newspack-plugin' ) : __( 'Update', 'newspack-plugin' ) }
										</Button>
										{ ! isEnabling && (
											<Button
												variant="tertiary"
												size="compact"
												isBusy={ inFlight }
												isDestructive
												disabled={ inFlight }
												onClick={ async () => {
													const name = placement.name;
													await handlePlacementToggle( key )( false );
													setEditingPlacement( null );
													// translators: %s: placement name.
													const disabledContent = sprintf( __( '%s disabled.', 'newspack-plugin' ), name );
													setNotices( [
														{
															id: 'placement-disabled',
															content: disabledContent,
														},
													] );
												} }
											>
												{ __( 'Disable', 'newspack-plugin' ) }
											</Button>
										) }
									</HStack>
								</VStack>
							</CardForm>
						);
					} ) }
				</VStack>
			</Grid>
			{ notices.length > 0 &&
				createPortal(
					<div className="newspack-wizard-ads-placements__snackbar">
						{ notices.map( notice => (
							<Snackbar key={ notice.id } onRemove={ () => setNotices( prev => prev.filter( n => n.id !== notice.id ) ) }>
								{ notice.content }
							</Snackbar>
						) ) }
					</div>,
					document.getElementById( 'wpbody' ) ?? document.body
				) }
		</Fragment>
	);
};

export default withWizardScreen( Placements );
