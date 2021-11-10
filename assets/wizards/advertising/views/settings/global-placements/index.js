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
import { SectionHeader, Notice, ActionCard, SelectControl } from '../../../../../components/src';
import './style.scss';

/**
 * Advertising management screen.
 */
class GlobalPlacements extends Component {
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

	handleToggle = placementKey => value => {
		this.setState( { inFlight: true } );
		apiFetch( {
			path: `/newspack-ads/v1/placements/${ placementKey }`,
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

	handleAdUnitChange = placementKey => value => {
		this.setState( { inFlight: true } );
		apiFetch( {
			path: `/newspack-ads/v1/placements/${ placementKey }`,
			method: 'POST',
			data: { ad_unit: value },
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
				value: null,
			},
			...Object.values( adUnits ).map( adUnit => {
				return {
					label: adUnit.name,
					value: adUnit.id,
				};
			} ),
		];
	};

	adUnitControl = placementKey => {
		const { inFlight, placements } = this.state;
		const placement = placements[ placementKey ];
		return (
			<SelectControl
				disabled={ inFlight }
				options={ this.adUnitsForSelect() }
				value={ placement?.ad_unit }
				onChange={ this.handleAdUnitChange( placementKey ) }
			/>
		);
	};

	render() {
		const { inFlight, placements, error } = this.state;
		return (
			<Fragment>
				<SectionHeader
					title={ __( 'Pre-defined ad placements', 'newspack' ) }
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
						'newspack-wizard-section__is-loading': inFlight && ! Object.keys( placements ).length,
					} ) }
				>
					{ Object.keys( placements ).map( placementKey => {
						const placement = placements[ placementKey ];
						return (
							<ActionCard
								key={ placementKey }
								disabled={ inFlight }
								title={ placement.name }
								description={ placement.description }
								actionContent={ placement.enabled && this.adUnitControl( placementKey ) }
								toggleOnChange={ this.handleToggle( placementKey ) }
								toggleChecked={ placement.enabled }
							/>
						);
					} ) }
				</div>
			</Fragment>
		);
	}
}

export default GlobalPlacements;
