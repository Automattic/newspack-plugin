/**
 * Complete UI for Newspack handoff to an external plugin.
 */

/**
 * WordPress dependencies.
 */
import { Component, createElement, render } from '@wordpress/element';
import { Button } from '../../components/src';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies.
 */
import './style.scss';

class HandoffBanner extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			visibility: true,
		};
	}
	/**
	 * Render.
	 */
	render( props ) {
		const { bodyText, primaryButtonText, dismissButtonText, primaryButtonURL } = this.props;
		const { visibility } = this.state;
		return (
			visibility && (
				<div className="newspack-handoff-banner">
					<p>{ bodyText }</p>
					<Button isLink onClick={ () => this.setState( { visibility: false } ) }>
						{ dismissButtonText }
					</Button>
					<Button isPrimary href={ primaryButtonURL }>
						{ primaryButtonText }
					</Button>
				</div>
			)
		);
	}
}

HandoffBanner.defaultProps = {
	primaryButtonText: __( 'Back to Newspack' ),
	dismissButtonText: __( 'Dismiss' ),
	primaryButtonURL: '/wp-admin/admin.php?page=newspack',
	bodyText: __( 'Click to return to Newspack after completing configuration' ),
};

const el = document.getElementById( 'newspack-handoff-banner' );
const { primary_button_url: primaryButtonURL } = el.dataset;
render(
	createElement( HandoffBanner, {
		primaryButtonURL,
	} ),
	el
);
