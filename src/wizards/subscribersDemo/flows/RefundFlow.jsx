/* eslint-disable @wordpress/i18n-translator-comments, no-bitwise */
/**
 * Flow A — Refund / Cancel.
 */

import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { RadioControl, __experimentalHStack as HStack, __experimentalVStack as VStack } from '@wordpress/components'; // eslint-disable-line @wordpress/no-unsafe-wp-apis
import { Button, Modal, Notice, Waiting } from '../../../../packages/components/src';

export default function RefundFlow( { subscription, onClose, onComplete } ) {
	const [ choice, setChoice ] = useState( 'refund-only' );
	const [ state, setState ] = useState( 'choose' ); // choose | loading | error
	const amount = subscription.amount.toFixed( 2 );

	const submit = () => {
		setState( 'loading' );
		setTimeout( () => {
			// Fake failure on a deterministic case so the error state is visible.
			const fail = false;
			if ( fail ) {
				setState( 'error' );
			} else {
				onComplete( {
					type: 'success',
					message:
						choice === 'refund-only'
							? sprintf( __( 'Refund of $%s processed.', 'newspack-plugin' ), amount )
							: sprintf( __( 'Refund of $%s processed and subscription cancelled.', 'newspack-plugin' ), amount ),
					mutate: subscriber => {
						if ( choice !== 'refund-only' ) {
							const subscriptions = subscriber.subscriptions.map( s =>
								s.id === subscription.id ? { ...s, status: 'cancelled', nextBillingDate: null } : s
							);
							const hasActive = subscriptions.some( s => s.status === 'active' );
							return {
								...subscriber,
								status: hasActive ? subscriber.status : 'cancelled',
								subscriptions,
							};
						}
						return subscriber;
					},
				} );
			}
		}, 700 );
	};

	return (
		<Modal title={ __( 'Refund or cancel', 'newspack-plugin' ) } onRequestClose={ onClose }>
			{ state === 'loading' && <Waiting /> }
			{ state === 'error' && <Notice noMargin isError noticeText={ __( 'Refund failed. Please try again.', 'newspack-plugin' ) } /> }
			{ state === 'choose' && (
				<VStack spacing={ 4 }>
					<p>{ sprintf( __( '%1$s — $%2$s %3$s', 'newspack-plugin' ), subscription.plan, amount, subscription.cadence.toLowerCase() ) }</p>
					<RadioControl
						label={ __( 'What would you like to do?', 'newspack-plugin' ) }
						selected={ choice }
						options={ [
							{ label: __( 'Refund only (keep subscription active)', 'newspack-plugin' ), value: 'refund-only' },
							{ label: __( 'Refund and cancel subscription', 'newspack-plugin' ), value: 'refund-cancel' },
						] }
						onChange={ setChoice }
					/>
					<Notice
						noMargin
						noticeText={
							choice === 'refund-only'
								? sprintf(
										__(
											"The subscriber will be refunded $%s. Their access will continue and they'll renew normally.",
											'newspack-plugin'
										),
										amount
								  )
								: sprintf(
										__( 'The subscriber will be refunded $%s. Their access will end immediately.', 'newspack-plugin' ),
										amount
								  )
						}
					/>
					<HStack spacing={ 2 } justify="flex-end">
						<Button variant="secondary" size="compact" onClick={ onClose }>
							{ __( 'Cancel', 'newspack-plugin' ) }
						</Button>
						<Button variant="primary" size="compact" onClick={ submit }>
							{ __( 'Confirm', 'newspack-plugin' ) }
						</Button>
					</HStack>
				</VStack>
			) }
		</Modal>
	);
}
