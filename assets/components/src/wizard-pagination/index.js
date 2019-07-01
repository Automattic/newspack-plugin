/**
 * Wizard pagination
 */

/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
import { Component, Fragment } from '@wordpress/element';

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
		const { history, location, routes } = this.props;
		const currentIndex = parseInt( routes.indexOf( location.pathname ) ) + 1;
		if ( ! routes || ! history || ! location ) {
			return;
		}
		return (
			<Fragment>
				<a className="newspack-wizard-pagination__navigation" onClick={ () => history.goBack() }>
					<span class="dashicons dashicons-arrow-left-alt" /> { __( 'Back' ) }
				</a>
				{ currentIndex > 0 && (
					<div className="newspack-wizard-pagination__pagination">
						{ __( 'Page' ) } { currentIndex } { __( 'of' ) } { routes.length }{' '}
						<span class="dashicons dashicons-arrow-right-alt" />
					</div>
				) }
			</Fragment>
		);
	}
}

export default withRouter( WizardPagination );
