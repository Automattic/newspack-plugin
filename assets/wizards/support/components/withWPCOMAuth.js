/* global newspack_support_data */

/**
 * WordPress dependencies
 */
import { Fragment, Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Notice, Button } from '../../../components/src';
import { saveReturnPath } from '../utils';

const { WPCOM_ACCESS_TOKEN } = newspack_support_data;

const withWPCOMAuth = WrappedComponent => {
	return class WithWPCOMAuth extends Component {
		componentDidMount() {
			if ( ! WPCOM_ACCESS_TOKEN ) {
				saveReturnPath();
			}
		}
		render() {
			return (
				<Fragment>
					{ WPCOM_ACCESS_TOKEN ? (
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
					) }
				</Fragment>
			);
		}
	};
};

export default withWPCOMAuth;
