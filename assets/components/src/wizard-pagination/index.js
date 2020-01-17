/**
 * Wizard Pagination
 */

/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
import { Component, Fragment } from '@wordpress/element';

/**
 * Material UI dependencies.
 */
import ArrowBackIcon from '@material-ui/icons/ArrowBack';

/**
 * Internal dependencies.
 */
import { Button, Router } from '../';
import './style.scss';

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
		if ( 0 === currentIndex ) {
			return <Fragment />;
		}
		return (
			<Fragment>
				<div className="newspack-wizard-pagination">
					<div className="newspack-wizard-pagination__pagination">
						{ __( 'Step' ) } { currentIndex } { __( 'of' ) } { routes.length - 1 }{' '}
					</div>
					<Button isLink className="newspack-wizard-pagination__navigation" onClick={ () => history.goBack() }>
						<ArrowBackIcon />
						{ __( 'Back' ) }
					</Button>
				</div>
			</Fragment>
		);
	}
}

export default Router.withRouter( WizardPagination );
