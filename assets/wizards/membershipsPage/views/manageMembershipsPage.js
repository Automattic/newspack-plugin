/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Dashicon } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { withWizardScreen, Handoff, Button } from '../../../components/src';


class ManageMembershipsPage extends Component {

	render() {
		const { page, onClickCreate } = this.props;

		return(
			<Fragment>
				{ ! page && (
					<Button isPrimary className="is-centered" onClick={ () => onClickCreate() } >
						{ __( 'Create Memberships Page' ) }
					</Button>
				) }
				{ page && (
					<Fragment>
						{ 'publish' !== page.status && (
							<div className='newspack-memberships-page-wizard-wizard__notice setup-error'>
								<Dashicon icon="no-alt" />
								<h4>{ __( 'Your memberships landing page is not published yet. You should edit and publish it.' ) }</h4>
							</div>
						) }
						{ 'publish' === page.status && (
							<div className='newspack-memberships-page-wizard-wizard__notice setup-success'>
								<Dashicon icon="yes-alt" />
								<h4>{ __( 'Your memberships landing page is set up and live.' ) }</h4>
							</div>
						) }
						<Handoff
							plugin='woocommerce'
							editLink={ page.editUrl }
							className='is-centered'
							isDefault
						>{ __( 'Edit Memberships Page' ) }
						</Handoff>
					</Fragment>
				) }
			</Fragment>
		);
	}
}

export default withWizardScreen( ManageMembershipsPage );
