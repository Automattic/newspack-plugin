/**
 * "Components Demo" Wizard.
 */

/**
 * WordPress dependencies
 */
import { Component, Fragment, render } from '@wordpress/element';
import { ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';


/**
 * Internal dependencies
 */
import {
	Card,
	FormattedHeader,
	Button,
} from '../../components';
import './style.scss';

/**
 * Components demo for example purposes.
 */
class AdvertisingWizard extends Component {
	/**
	 * Render the example stub.
	 */
	render() {
		return (
			<Fragment>
				<FormattedHeader
					headerText={ __( 'Which Ad Service would you like to use?' ) }
					subHeaderText={ __( 'Enhance your Newspack site with advertising. Choose from any combination of the products below.' ) }
				/>
				<Card className="newspack-manage-advertising-screen__advertising-card">
					<img src="http://placehold.it/16x16" />
					<div className="newspack-manage-advertising-screen__advertising-card__product-info">
						<div className="product-name">WordAds from WordPress.com</div>
						<div className="product-price">The Bestest ad network thingy ever.</div>
					</div>
					<div className="newspack-manage-advertising-screen__advertising-card__product-actions">
						<Button isTertiary>Set Up</Button>
					</div>
				</Card>
				<Card className="newspack-manage-advertising-screen__advertising-card">
					<img src="http://placehold.it/16x16" />
					<div className="newspack-manage-advertising-screen__advertising-card__product-info">
						<div className="product-name">Google AdWords</div>
						<div className="product-price">The Bestest ad network thingy ever.</div>
					</div>
					<Button isTertiary>Set Up</Button>
				</Card>
				<Card className="newspack-manage-advertising-screen__advertising-card">
					<img src="http://placehold.it/16x16" />
					<div className="newspack-manage-advertising-screen__advertising-card__product-info">
						<div className="product-name">Google AdManager</div>
						<div className="product-price">The Bestest ad network thingy ever.</div>
					</div>
					<Button isTertiary>Set Up</Button>
				</Card>
			</Fragment>
		);
	}
}

render( <AdvertisingWizard />, document.getElementById( 'newspack-advertising-wizard' ) );
