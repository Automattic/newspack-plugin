/**
 * Onboarding Wizard.
 */

/**
 * WordPress dependencies
 */
import { Component, render } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import LocationSetup from './views/locationSetup';
import './style.scss';

/**
 * Subscriptions wizard for managing and setting up subscriptions.
 */
class OnboardingWizard extends Component {
	/**
	 * Constructor.
	 */
	constructor() {
		super( ...arguments );
		this.state = {
			location: {
				countrystate: '',
				address1: '',
				address2: '',
				city: '',
				postcode: '',
				currency: '',
			},
		};
	}

	componentDidMount() {
		this.refreshLocationInfo();
	}

	refreshLocationInfo() {
		apiFetch( { path: '/newspack/v1/wizard/location' } ).then( location => {
			this.setState( {
				location,
			} );
		} );
	}

	saveLocation() {
		apiFetch( {
			path: '/newspack/v1/wizard/location',
			method: 'post',
			data: {
				...this.state.location,
			},
		} ).then( response => {
			console.log( response );
			// go to next step of wizard
		} );
	}

	render() {
		const { location } = this.state;
		return (
			<LocationSetup
				location={ location }
				onChange={ location => this.setState( { location } ) }
				onClickContinue={ () => this.saveLocation() }
			/>
		);
	}
}
render( <OnboardingWizard />, document.getElementById( 'newspack-onboarding-wizard' ) );
