/* global newspack_support_data */

/**
 * External dependencies
 */
import Happychat from 'happychat-client';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { Fragment, Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { withWizardScreen, Notice, Button, Waiting } from '../../../../components/src';
import './style.scss';

/**
 * Chat Support screen.
 */
class Chat extends Component {
	state = {
		isInFlight: false,
		hasToAuthenticate: false,
	};

	closeHappychat = null;

	renderChat = () => {
		const { WPCOM_ACCESS_TOKEN } = newspack_support_data;
		if ( WPCOM_ACCESS_TOKEN ) {
			this.closeHappychat = Happychat.open( {
				nodeId: 'newspack-happychat',
				authentication: {
					type: 'wpcom-oauth-by-token',
					options: { token: WPCOM_ACCESS_TOKEN },
				},
				entry: 'ENTRY_CHAT',
				// BUG in happychat-client - no default defaultValues
				entryOptions: {
					defaultValues: {},
				},
			} );
		}
	};

	componentDidMount() {
		const { WPCOM_ACCESS_TOKEN } = newspack_support_data;
		if ( WPCOM_ACCESS_TOKEN ) {
			this.setState( { isInFlight: true } );
			apiFetch( {
				path: `/newspack/v1/wizard/newspack-support-wizard/validate-access-token`,
			} )
				.then( () => {
					this.renderChat();

					let didSendInitialInfo;
					Happychat.on( 'availability', availability => {
						if ( ! didSendInitialInfo && availability ) {
							didSendInitialInfo = true;
							Happychat.sendUserInfo( {
								site: {
									ID: '0',
									URL: `${ window.location.protocol }//${ window.location.hostname }`,
								},
								// just to bust the default 'gettingStarted'
								howCanWeHelp: 'newspack',
							} );

							Happychat.sendEvent(
								__(
									'[ Newspack customer (fieldguide.automattic.com/supporting-newspack-customers) ]',
									'newspack'
								)
							);
						}
					} );
					this.setState( { isInFlight: false } );
				} )
				.catch( () => {
					this.setState( { isInFlight: false } );
					this.setState( { hasToAuthenticate: true } );
				} );
		} else {
			this.setState( { hasToAuthenticate: true } );
		}
	}

	componentWillUnmount() {
		if ( this.closeHappychat ) {
			this.closeHappychat();
		}
	}

	render() {
		return (
			<Fragment>
				{ this.state.isInFlight && (
					<div className="newspack_support_loading">
						<Waiting isLeft />
						{ __( 'Loading...', 'newspack' ) }
					</div>
				) }
				{ this.state.hasToAuthenticate ? (
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
				) : (
					<div id="newspack-happychat" />
				) }
			</Fragment>
		);
	}
}

export default withWizardScreen( Chat );
