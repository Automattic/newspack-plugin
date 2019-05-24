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
class Advertising extends Component {
	/**
	 * constructor. Demo of how the parent interacts with the components, and controls their values.
	 */
	constructor() {
		super( ...arguments );
		this.state = {
			wordads: 0,
			adsense: 0,
			admanager: 0,
		};
	}

	/**
	 * Render the example stub.
	 */
	render() {
		const {
			wordads,
			adsense,
			admanager,
		} = this.state;

		return (
			<Fragment>
				<FormattedHeader
					headerText={ __( 'Advertising' ) }
					subHeaderText={ __( 'Enhance your Newspack site with advertising. Choose from any combination of the products below.' ) }
				/>
				<Card className="newspack-manage-advertising-screen__advertising-card">
					<ToggleControl
						checked={ wordads }
						onChange={ () => this.setState( ( state ) => ( { wordads: ! state.wordads } ) ) }
					/>
					<div className="newspack-manage-advertising-screen__advertising-card__product-info">
						<div className="product-name">WordAds from WordPress.com</div>
						<div className="product-price">The Bestest ad network thingy ever.</div>
					</div>
					{ wordads && (
						<div className="newspack-manage-advertising-screen__advertising-card__product-actions">
							<Button isPrimary>Configure</Button>
						</div>
					) }
				</Card>
				<Card className="newspack-manage-advertising-screen__advertising-card">
					<ToggleControl
						checked={ adsense }
						onChange={ () => this.setState( ( state ) => ( { adsense: ! state.adsense } ) ) }
					/>
					<div className="newspack-manage-advertising-screen__advertising-card__product-info">
						<div className="product-name">Google AdWords</div>
						<div className="product-price">The Bestest ad network thingy ever.</div>
					</div>
					{ adsense && (
						<div className="newspack-manage-advertising-screen__advertising-card__product-actions">
							<Button isPrimary>Configure</Button>
						</div>
					) }
				</Card>
				<Card className="newspack-manage-advertising-screen__advertising-card">
					<ToggleControl
						checked={ admanager }
						onChange={ () => this.setState( ( state ) => ( { admanager: ! state.admanager } ) ) }
					/>
					<div className="newspack-manage-advertising-screen__advertising-card__product-info">
						<div className="product-name">Google AdManager</div>
						<div className="product-price">The Bestest ad network thingy ever.</div>
					</div>
					{ admanager && (
						<div className="newspack-manage-advertising-screen__advertising-card__product-actions">
							<Button isPrimary>Configure</Button>
						</div>
					) }
				</Card>
			</Fragment>
		);
	}
}

render( <Advertising />, document.getElementById( 'newspack-advertising' ) );
