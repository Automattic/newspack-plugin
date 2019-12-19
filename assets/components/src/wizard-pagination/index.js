/**
 * Wizard Pagination
 */

/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
import { Component, Fragment } from '@wordpress/element';
import { SVG, Path } from '@wordpress/components';

/**
 * External dependencies.
 */
import { withRouter } from 'react-router-dom';

/**
 * Internal dependencies.
 */
import { Button } from '../';
import './style.scss';

class WizardPagination extends Component {
	/**
	 * Render.
	 */
	render() {
		const { history, location, routes } = this.props;
		const currentIndex = parseInt( routes.indexOf( location.pathname ) );
		const iconArrowBack = (
			<SVG xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
				<Path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
			</SVG>
		);
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
						{ iconArrowBack }
						{ __( 'Back' ) }
					</Button>
				</div>
			</Fragment>
		);
	}
}

export default withRouter( WizardPagination );
