/**
 * Location setup Screen.
 */

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { NewspackLogo, withWizardScreen } from '../../../../components/src';

/**
 * Location Setup Screen.
 */
class Welcome extends Component {
	componentDidMount() {
		document.body.classList.add( 'newspack_page_newspack-setup-wizard__welcome' );
	}

	componentWillUnmount() {
		document.body.classList.remove( 'newspack_page_newspack-setup-wizard__welcome' );
	}

	/**
	 * Render.
	 */
	render() {
		return (
			<>
				<div className="newspack-logo__wrapper welcome">
					<NewspackLogo centered />
				</div>
				<div className="newspack-setup-wizard__welcome">
					<h2>{ __( 'Welcome to WordPress for your Newsroom!' ) }</h2>
					<p>
						{ __(
							'We’ll help you get set up by installing the most relevant Newspack plugins in the background.'
						) }
					</p>
				</div>
			</>
		);
	}
}

export default withWizardScreen( Welcome );
