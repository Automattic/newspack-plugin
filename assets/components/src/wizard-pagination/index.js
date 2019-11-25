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
import { Button, Card, FormattedHeader, Handoff, Grid, SecondaryNavigation, TabbedNavigation } from '../';

class WizardPagination extends Component {
	/**
	 * Render.
	 */
	render() {
		const { history, location, routes } = this.props;
		const currentIndex = parseInt( routes.indexOf( location.pathname ) );
		if ( ! routes || ! history || ! location ) {
			return;
		}
		return (
			<Fragment>
				<div className="newspack-wizard-pagination">
					{ currentIndex > 0 && (
						<div className="newspack-wizard-pagination__pagination">
							{ __( 'Step' ) } { currentIndex } { __( 'of' ) } { routes.length - 1 }{' '}
						</div>
					) }
					<Button isLink className="newspack-wizard-pagination__navigation" onClick={ () => history.goBack() }>
						{ __( 'Back' ) }
					</Button>
				</div>
			</Fragment>
		);
	}
}

export default withRouter( WizardPagination );
