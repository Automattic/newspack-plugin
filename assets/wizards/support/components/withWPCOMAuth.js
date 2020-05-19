/* global newspack_support_data */

/**
 * WordPress dependencies
 */
import { Fragment, Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { Notice, Button, Waiting } from '../../../components/src';
import { saveReturnPath } from '../utils';

const { WPCOM_ACCESS_TOKEN } = newspack_support_data;

const withWPCOMAuth = WrappedComponent => {
	return class WithWPCOMAuth extends Component {
		state = {
			isInFlight: false,
		};
		componentDidMount() {
			if ( ! WPCOM_ACCESS_TOKEN ) {
				saveReturnPath();
			}

			this.setState( { isInFlight: true } );
			apiFetch( {
				path: `/newspack/v1/wizard/newspack-support-wizard/validate-access-token`,
			} )
				.then( () => {
					this.setState( { isInFlight: false } );
				} )
				.catch( () => {
					this.setState( { isInFlight: false } );
				} );
		}
		renderContent = () =>
			WPCOM_ACCESS_TOKEN ? (
				<WrappedComponent token={ WPCOM_ACCESS_TOKEN } { ...this.props } />
			) : (
				<Fragment>
					<Notice
						noticeText={ __(
							'Click the button below to authenticate using a WordPress.com account.',
							'newspack'
						) }
					/>
					<div className="newspack-buttons-card">
						<Button href={ newspack_support_data.WPCOM_AUTH_URL } isPrimary>
							{ __( 'Authenticate', 'newspack' ) }
						</Button>
					</div>
				</Fragment>
			);
		render() {
			return (
				<Fragment>
					{ this.state.isInFlight ? (
						<div className="newspack_support_loading">
							<Waiting isLeft />
							{ __( 'Loading...', 'newspack' ) }
						</div>
					) : (
						this.renderContent()
					) }
				</Fragment>
			);
		}
	};
};

export default withWPCOMAuth;
