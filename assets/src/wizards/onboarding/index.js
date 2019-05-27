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
		};
	}

	render() {
		return (
			<LocationSetup />
		);
	}
}
render( <OnboardingWizard />, document.getElementById( 'newspack-onboarding-wizard' ) );
