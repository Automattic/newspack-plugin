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
	ActionCard,
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
					<ActionCard
						title="WordAds from WordPress.com"
						description="The Bestest ad network thingy ever."
						actionText="Set Up"
						image="http://placehold.it/16x16"
						onClick={ ad_network => this.setState( { editing: true, ad_network: "wordads" } ) }
					/>
					<ActionCard
						title="Google AdSense"
						description="The Bestest ad network thingy ever."
						actionText="Set Up"
						image="http://placehold.it/16x16"
						onClick={ ad_network => this.setState( { editing: true, ad_network: "gadsense" } ) }
					/>
					<ActionCard
						title="Google Ad Manager"
						description="The Bestest ad network thingy ever."
						actionText="Set Up"
						image="http://placehold.it/16x16"
						onClick={ ad_network => this.setState( { editing: true, ad_network: "gadmanager" } ) }
					/>
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
