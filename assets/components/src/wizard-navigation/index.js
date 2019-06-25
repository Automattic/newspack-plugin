/**
 * Wizard Navigation
 */

/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';

/**
 * External dependencies
 */
import { withRouter } from 'react-router-dom';

/**
 * Internal dependencies
 */
import './style.scss';

class WizardNavigation extends Component {

	/**
	 * Render.
	 */
	render() {
		const { history } = this.props;
		return <a className="newspack-wizard-navigation" onClick={ () => history.goBack() }>Back</a>;
	}
}

export default withRouter( WizardNavigation );
