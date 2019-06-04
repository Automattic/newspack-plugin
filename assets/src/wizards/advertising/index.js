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
	FormattedHeader,
	Card,
	SelectControl,
	Button,
	ActionCard,
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
			adNetwork: '',
			frontPage: false,
			posts: false,
			pages: false,
			archives: false,
			topOfPage: false,
			secondBelowPost: false,
		};
	}

	/**
	 * Render the example stub.
	 */
	render() {
		const {
			editing,
			adNetwork,
			frontPage,
			posts,
			pages,
			archives,
			topOfPage,
			secondBelowPost,
		} = this.state;

		return (
			<Fragment>
				<FormattedHeader
					headerText={ __( 'Which Ad Service would you like to use?' ) }
					subHeaderText={ __( 'Enhance your Newspack site with advertising. Choose from any combination of the products below.' ) }
				/>
				{ ! editing && (
					<Fragment>
						<Card>
		 					<div className="newspack-card-header">
		 						<h1>{ __( 'Ad Provider' ) }</h1>
		 						<h2>{ __( 'Choose your preferred ad provider' ) }</h2>
		 					</div>
		 					<SelectControl
		 						label="Select Ad Provider"
		 						value={ adNetwork }
		 						options={ [
		 							{ value: null, label: 'Select Ad Provider' },
		 							{ value: 'wordads', label: 'WordAds from WordPress.com' },
		 							{ value: 'gadsense', label: 'Google AdSense' },
		 							{ value: 'gadmanager', label: 'Google Ad Manager' },
		 						] }
		 						onChange={ value => this.setState( { editing: true, adNetwork: value } ) }
		 					/>
		 				</Card>
					</Fragment>
				) }
				{ ( editing && adNetwork != 'gadsense' ) && (
					<Fragment>
						<Card>
							<div className="newspack-card-header">
								<h1>{ __( 'Ad Placements' ) }</h1>
								<h2>{ __( 'Display ads below posts on' ) }</h2>
							</div>
							<ToggleControl
								label="Front Page"
								checked={ frontPage }
								onChange={ () => this.setState( { frontPage: ! frontPage } ) }
							/>
							<ToggleControl
								label="Posts"
								checked={ posts }
								onChange={ () => this.setState( { posts: ! posts } ) }
							/>
							<ToggleControl
								label="Pages"
								checked={ pages }
								onChange={ () => this.setState( { pages: ! pages } ) }
							/>
							<ToggleControl
								label="Archives"
								checked={ archives }
								onChange={ () => this.setState( { archives: ! archives } ) }
							/>
						</Card>
						<Card>
							<div className="newspack-card-header">
								<h1>{ __( 'Additional Ad Placements' ) }</h1>
							</div>
							<ToggleControl
								label="Top of each page"
								checked={ topOfPage }
								onChange={ () => this.setState( { topOfPage: ! topOfPage } ) }
							/>
							<ToggleControl
								label="Second ad below post"
								checked={ secondBelowPost }
								onChange={ () => this.setState( { secondBelowPost: ! secondBelowPost } ) }
							/>
						</Card>
						<Card>
							<Button
								isPrimary
								className="is-centered"
								onClick={ () => this.setState( { editing: false } ) }
							>{  __( 'Save' ) }</Button>
							<Button
								isTertiary
								className="is-centered"
								onClick={ () => this.setState( { editing: false } ) }
							>{  __( 'Cancel' ) }</Button>
						</Card>
					</Fragment>
				) }
				{ ( editing && adNetwork == 'gadsense' ) && (
					<Fragment>
						<ActionCard
							title="Google AdSense"
							description="AdSense is configured via Google SiteKit."
							actionText="Activate"
						/>
						<Button
							isTertiary
							className="is-centered"
							onClick={ () => this.setState( { editing: false } ) }
						>{  __( 'Cancel' ) }</Button>
					</Fragment>
				) }
			</Fragment>
		);
	}
}

render( <AdvertisingWizard />, document.getElementById( 'newspack-advertising-wizard' ) );
