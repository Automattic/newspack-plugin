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
import WordAds from './views/wordAds';
import GoogleAdSense from './views/gAdSense';
import GoogleAdManager from './views/gAdManager';
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
	 * Constructor.
	 */
	constructor() {
		super( ...arguments );
		this.state = {
			editing: false,
			ad_network: false,
		};
	}

	/**
	 * Render the example stub.
	 */
	render() {
		const { editing, ad_network } = this.state;

		if ( ! editing ) {
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
							<Button isTertiary onClick={ ad_network => this.setState( { editing: true, ad_network: "wordads" } ) }>Set Up</Button>
						</div>
					</Card>
					<Card className="newspack-manage-advertising-screen__advertising-card">
						<img src="http://placehold.it/16x16" />
						<div className="newspack-manage-advertising-screen__advertising-card__product-info">
							<div className="product-name">Google AdWords</div>
							<div className="product-price">The Bestest ad network thingy ever.</div>
						</div>
						<Button isTertiary onClick={ ad_network => this.setState( { editing: true, ad_network: "gadsense" } ) }>Set Up</Button>
					</Card>
					<Card className="newspack-manage-advertising-screen__advertising-card">
						<img src="http://placehold.it/16x16" />
						<div className="newspack-manage-advertising-screen__advertising-card__product-info">
							<div className="product-name">Google AdManager</div>
							<div className="product-price">The Bestest ad network thingy ever.</div>
						</div>
						<Button isTertiary onClick={ ad_network => this.setState( { editing: true, ad_network: "gadmanager" } ) }>Set Up</Button>
					</Card>
				</Fragment>
			);
		} else {
			if ( ad_network == "wordads" ) {
				return (
					<WordAds />
				);
			} else if ( ad_network == "gadsense" ) {
				return (
					<GoogleAdSense />
				);
			} else if ( ad_network == "gadmanager" ) {
				return (
					<GoogleAdManager />
				);
			} else {
				return null
			}
		}
	}
}

render( <AdvertisingWizard />, document.getElementById( 'newspack-advertising-wizard' ) );
