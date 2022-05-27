/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
import { useState, Fragment } from '@wordpress/element';

/**
 * Internal dependencies.
 */
import { Card } from '../../../../components/src';
import GoogleOAuth from '../../../connections/views/main/google';
import ServiceAccountConnection from '../ad-units/service-account-connection';

export default function AdsOnboarding() {
	const [ useOAuth, setUseOAuth ] = useState( null );
	return (
		<Card noBorder>
			<div className="ads-onboarding">
				{ ( true === useOAuth || null === useOAuth ) && (
					<Fragment>
						{ useOAuth && (
							<p>
								{ __(
									'Authenticate with Google in order to connect your Google Ad Manager account:',
									'newspack'
								) }
							</p>
						) }
						<GoogleOAuth onInit={ err => setUseOAuth( ! err ) } />
					</Fragment>
				) }
				{ false === useOAuth && (
					<Fragment>
						<p>
							{ __(
								'Upload a service account credential file or enter your GAM network code:',
								'newspack'
							) }
						</p>
						<ServiceAccountConnection />
					</Fragment>
				) }
			</div>
		</Card>
	);
}
