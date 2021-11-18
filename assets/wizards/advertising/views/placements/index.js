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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	ActionCard,
	Grid,
	Notice,
	SectionHeader,
	SelectControl,
	withWizardScreen,
} from '../../../../components/src';

/**
 * Get select options from object of ad units.
 *
 * @param {Object} adUnits Object containing ad untis.
 * @return {Array} Ad unit options for select control.
 */
const getAdUnitsForSelect = adUnits => {
	return [
		{
			label: __( 'Select an Ad Unit', 'newspack' ),
			value: '',
		},
		...Object.values( adUnits ).map( adUnit => {
			return {
				label: adUnit.name,
				value: adUnit.id,
			};
		} ),
	];
};

/**
 * Advertising Placements management screen.
 */
const Placements = ( { adUnits } ) => {
	const [ inFlight, setInFlight ] = useState( false );
	const [ error, setError ] = useState( null );
	const [ placements, setPlacements ] = useState( {} );
	const placementsApiFetch = options => {
		setInFlight( true );
		apiFetch( options )
			.then( data => {
				setPlacements( data );
				setError( null );
			} )
			.catch( err => {
				setError( err );
			} )
			.finally( () => {
				setInFlight( false );
			} );
	};
	const fetchPlacements = () => {
		placementsApiFetch( { path: '/newspack-ads/v1/placements' } );
	};
	const handleToggle = placement => value => {
		placementsApiFetch( {
			path: `/newspack-ads/v1/placements/${ placement }`,
			method: value ? 'POST' : 'DELETE',
		} );
	};
	const handleAdUnitChange = ( placement, hook ) => value => {
		placementsApiFetch( {
			path: `/newspack-ads/v1/placements/${ placement }`,
			method: 'POST',
			data: { ad_unit: value, hook },
		} );
	};
	const adUnitControl = ( placementKey, hookKey = '' ) => {
		const placement = placements[ placementKey ];
		const controlProps = {
			disabled: inFlight,
			onChange: handleAdUnitChange( placementKey, hookKey ),
			value: placement?.ad_unit,
			options: getAdUnitsForSelect( adUnits ),
			label: __( 'Ad Unit', 'newspack' ),
		};
		if ( hookKey ) {
			const hook = placement.hooks[ hookKey ];
			controlProps.value = placement[ `ad_unit_${ hookKey }` ];
			controlProps.label = __( 'Ad Unit', 'newspack' ) + ' - ' + hook.name;
		}
		return <SelectControl { ...controlProps } />;
	};
	useEffect( () => {
		fetchPlacements();
	}, [] );
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
			{ error && <Notice isError noticeText={ error.message } /> }
			<div
				className={ classnames( {
					'newspack-wizard-ads-placements': true,
					'newspack-wizard-section__is-loading': inFlight && ! Object.keys( placements ).length,
				} ) }
			>
				{ Object.keys( placements )
					.filter( key => !! placements[ key ].enabled )
					.map( key => {
						const placement = placements[ key ];
						return (
							<ActionCard
								key={ key }
								isMedium
								disabled={ inFlight }
								title={ placement.name }
								description={ placement.description }
								toggleOnChange={ handleToggle( key ) }
								toggleChecked={ placement.enabled }
								hasGreyHeader={ placement.enabled }
							>
								<Grid columns={ 2 } gutter={ 32 }>
									{ placement.enabled && placement.hook_name && (
										<>
											{ adUnitControl( key ) }
											<div />
										</>
									) }
									{ placement.hooks && (
										<>
											{ Object.keys( placement.hooks ).map( hookKey => {
												const hook = placement.hooks[ hookKey ];
												return (
													<Fragment key={ hook.name }>{ adUnitControl( key, hookKey ) }</Fragment>
												);
											} ) }
										</>
									) }
								</Grid>
							</ActionCard>
						);
					} ) }
				{ Object.keys( placements )
					.filter( key => ! placements[ key ].enabled )
					.map( key => {
						const placement = placements[ key ];
						return (
							<ActionCard
								key={ key }
								isSmall
								disabled={ inFlight }
								title={ placement.name }
								toggleOnChange={ handleToggle( key ) }
							/>
						);
					} ) }
			</div>
		</Fragment>
	);
};

export default withWizardScreen( Placements );
