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
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	SectionHeader,
	Notice,
	Grid,
	ActionCard,
	SelectControl,
} from '../../../../../components/src';
import './style.scss';

/**
 * Advertising management screen.
 */
class Placements extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			inFlight: false,
			error: null,
			placements: {},
		};
	}

	componentDidMount() {
		this.fetchPlacements();
	}

	fetchPlacements = () => {
		this.setState( { inFlight: true } );
		apiFetch( { path: '/newspack-ads/v1/placements' } )
			.then( placements => {
				this.setState( { placements, error: null } );
			} )
			.catch( error => {
				this.setState( { error } );
			} )
			.finally( () => {
				this.setState( { inFlight: false } );
			} );
	};

	handleToggle = placement => value => {
		this.setState( { inFlight: true } );
		apiFetch( {
			path: `/newspack-ads/v1/placements/${ placement }`,
			method: value ? 'POST' : 'DELETE',
		} )
			.then( placements => {
				this.setState( { placements, error: null } );
			} )
			.catch( error => {
				this.setState( { error } );
			} )
			.finally( () => {
				this.setState( { inFlight: false } );
			} );
	};

	handleAdUnitChange = ( placement, hook ) => value => {
		this.setState( { inFlight: true } );
		apiFetch( {
			path: `/newspack-ads/v1/placements/${ placement }`,
			method: 'POST',
			data: { ad_unit: value, hook },
		} )
			.then( placements => {
				this.setState( { placements, error: null } );
			} )
			.catch( error => {
				this.setState( { error } );
			} )
			.finally( () => {
				this.setState( { inFlight: false } );
			} );
	};

	adUnitsForSelect = () => {
		const { adUnits } = this.props;
		return [
			{
				label: __( 'Select an ad unit', 'newspack' ),
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

	adUnitControl = ( placementKey, hookKey = '' ) => {
		const placement = this.state.placements[ placementKey ];
		const controlProps = {
			disabled: this.state.inFlight,
			onChange: this.handleAdUnitChange( placementKey, hookKey ),
			value: placement?.ad_unit,
			options: this.adUnitsForSelect(),
		};
		if ( hookKey ) {
			const hook = placement.hooks[ hookKey ];
			controlProps.value = placement[ `ad_unit_${ hookKey }` ];
			controlProps.label = hook.name;
		}
		return <SelectControl { ...controlProps } />;
	};

	render() {
		const { inFlight, placements, error } = this.state;
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
									isSmall={ ! placement.enabled }
									disabled={ inFlight }
									title={ placement.name }
									description={ placement.description }
									actionContent={
										placement.enabled && placement.hook_name && this.adUnitControl( key )
									}
									toggleOnChange={ this.handleToggle( key ) }
									toggleChecked={ placement.enabled }
								>
									{ placement.hooks && (
										<Grid columns={ 2 } gutter={ 32 }>
											{ Object.keys( placement.hooks ).map( hookKey => {
												const hook = placement.hooks[ hookKey ];
												return (
													<Fragment key={ hook.name }>
														{ this.adUnitControl( key, hookKey ) }
													</Fragment>
												);
											} ) }
										</Grid>
									) }
								</ActionCard>
							);
						} ) }
					<Grid columns={ 3 } gutter={ 16 }>
						{ Object.keys( placements )
							.filter( key => ! placements[ key ].enabled )
							.map( key => {
								const placement = placements[ key ];
								return (
									<ActionCard
										key={ key }
										isSmall={ ! placement.enabled }
										disabled={ inFlight }
										title={ placement.name }
										description={ placement.description }
										toggleOnChange={ this.handleToggle( key ) }
										toggleChecked={ placement.enabled }
									/>
								);
							} ) }
					</Grid>
				</div>
			</Fragment>
		);
	}
}

export default Placements;
