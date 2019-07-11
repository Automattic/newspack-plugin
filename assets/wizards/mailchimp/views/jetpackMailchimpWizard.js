/**
 * Hands off to WPCOM for Mailchimp setup.
 */

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Dashicon } from '@wordpress/components';

/**
 * Internal dependencies
 */
import {
	Card,
	Button,
	withWizardScreen,
} from '../../../components/src';

/**
 * Jetpack-based Mailchimp setup.
 */
class JetpackMailchimpWizard extends Component {

	/**
	 * Render.
	 */
	render() {
		const { connected, connectURL } = this.props;

		return (
			<Fragment>
				<Card className='newspack-mailchimp-wizard__jetpack-info'>
					<p>
						{ __( 'The Mailchimp connection to your site is managed through Jetpack and WordPress.com.' ) }
					</p>
					<p>
						{ __( 'Click the link below to go set up your Mailchimp connection on WordPress.com.' ) }
					</p>
				</Card>
				{ !! connected && (
					<Card noBackground className='newspack-mailchimp-wizard__jetpack-success'>
						<Dashicon icon="yes-alt" />
						<h4>{ __( 'Mailchimp is set up' ) }</h4>
					</Card>
				) }
				<Button 
					className='is-centered newspack-mailchimp-wizard__jetpack-handoff' 
					href={ connectURL } 
					target='_blank'
					isPrimary={ ! connected }
					isDefault={ !! connected }
				>
					{ ! connected ? __( 'Set up Mailchimp on WordPress.com' ) : __( 'Manage your Mailchimp connection' ) }
					<Dashicon icon='external' />
				</Button>
			</Fragment>
		);
	}
}

export default withWizardScreen( JetpackMailchimpWizard );
