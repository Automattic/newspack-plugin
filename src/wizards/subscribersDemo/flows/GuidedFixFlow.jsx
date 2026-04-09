/* eslint-disable @wordpress/i18n-translator-comments, no-bitwise */
/**
 * Flow E — Guided fix for an alert.
 */

import { useState, createRoot } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Notice, Snackbar, __experimentalHStack as HStack, __experimentalVStack as VStack } from '@wordpress/components'; // eslint-disable-line @wordpress/no-unsafe-wp-apis
import { Button, Modal, Waiting } from '../../../../packages/components/src';

function showSnackbar( message ) {
	const target = document.getElementById( 'wpbody' ) || document.body;
	const wrap = document.createElement( 'div' );
	wrap.className = 'components-snackbar-list newspack-subscribers-demo__snackbar';
	target.appendChild( wrap );
	const root = createRoot( wrap );
	const dismiss = () => {
		root.unmount();
		wrap.remove();
	};
	root.render( <Snackbar onRemove={ dismiss }>{ message }</Snackbar> );
	setTimeout( dismiss, 4000 );
}

export default function GuidedFixFlow( { alert, onClose, onOpenPaymentUpdate } ) {
	const [ state, setState ] = useState( 'choose' );

	const sendLink = () => {
		setState( 'loading' );
		setTimeout( () => {
			showSnackbar( __( 'Payment link sent to the subscriber.', 'newspack-plugin' ) );
			onClose();
		}, 700 );
	};

	return (
		<Modal title={ alert.title } onRequestClose={ onClose }>
			{ state === 'loading' ? (
				<Waiting />
			) : (
				<VStack spacing={ 4 }>
					<Notice status={ alert.level === 'error' ? 'error' : 'warning' } isDismissible={ false }>
						{ alert.message }
					</Notice>
					<span>
						{ __(
							'Choose how to resolve this. Sending a payment link lets the subscriber update their own card. You can also update the card on their behalf.',
							'newspack-plugin'
						) }
					</span>
					<HStack spacing={ 2 } justify="flex-end">
						<Button
							variant="secondary"
							size="compact"
							onClick={ () => {
								onClose();
								onOpenPaymentUpdate();
							} }
						>
							{ __( 'Update payment method', 'newspack-plugin' ) }
						</Button>
						<Button variant="primary" size="compact" onClick={ sendLink }>
							{ __( 'Send payment link', 'newspack-plugin' ) }
						</Button>
					</HStack>
				</VStack>
			) }
		</Modal>
	);
}
