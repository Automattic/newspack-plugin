/**
 * Wizard pagination
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

class WizardPagination extends Component {

	/**
	 * Render.
	 */
	render() {
		const { routes, location } = this.props;
		const currentIndex = parseInt( routes.indexOf( location.pathname ) ) + 1;
		return ( currentIndex > 0 ) && (
			<div className="newspack-wizard-pagination">
				Page { currentIndex } of { routes.length }
			</div>
		);
	}
}

export default withRouter( WizardPagination );
