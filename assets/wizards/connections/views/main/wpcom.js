/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
import withWPCOMAuth from '../../../support/components/withWPCOMAuth';

/**
 * Internal dependencies.
 */
import { Button, ActionCard } from '../../../../components/src';

const WPCOMAuth = ( { shouldAuthenticate, isInFlight, disconnectURL, authURL } ) => (
	<ActionCard
		title={ __( 'WordPress.com', 'newspack' ) }
		description={
			// eslint-disable-next-line no-nested-ternary
			isInFlight
				? __( 'Loading…', 'newspack' )
				: shouldAuthenticate
				? __( 'Not connected', 'newspack' )
				: __( 'Connected', 'newspack' )
		}
		checkbox={ shouldAuthenticate ? 'unchecked' : 'checked' }
		actionText={
			<Button
				isLink
				isDestructive={ ! isInFlight && ! shouldAuthenticate }
				href={ shouldAuthenticate ? authURL : disconnectURL }
				disabled={ isInFlight }
			>
				{ shouldAuthenticate ? __( 'Connect', 'newspack' ) : __( 'Disconnect', 'newspack' ) }
			</Button>
		}
		isMedium
	/>
);

export default withWPCOMAuth( null, WPCOMAuth );
