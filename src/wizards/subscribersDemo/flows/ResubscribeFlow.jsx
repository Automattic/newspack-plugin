/* eslint-disable @wordpress/i18n-translator-comments, no-bitwise */
/**
 * Flow B — Resubscribe.
 *
 * If a payment method is already on file, go straight to the plan picker.
 * Otherwise, branch: send a self-serve link, enter card on behalf of the
 * subscriber, or comp a free subscription.
 */

import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Notice, __experimentalHStack as HStack, __experimentalVStack as VStack } from '@wordpress/components'; // eslint-disable-line @wordpress/no-unsafe-wp-apis
import { Button, Modal, SelectControl, Waiting } from '../../../../packages/components/src';
import { DIGITAL_PLANS } from '../data/mock-subscribers';

function PlanPicker( { subscriber, onComplete, onCancel, comped = false } ) {
	const [ planName, setPlanName ] = useState( DIGITAL_PLANS[ 0 ].name );
	const [ loading, setLoading ] = useState( false );
	const plan = DIGITAL_PLANS.find( p => p.name === planName );

	const submit = () => {
		setLoading( true );
		setTimeout( () => {
			onComplete( {
				type: 'success',
				message: comped
					? sprintf( __( 'Granted %1$s free access to %2$s.', 'newspack-plugin' ), subscriber.name, planName )
					: sprintf( __( 'Resubscribed %1$s to %2$s.', 'newspack-plugin' ), subscriber.name, planName ),
				mutate: s => ( {
					...s,
					status: 'active',
					subscriptions: [
						{
							id: 'sub_new_' + Date.now(),
							plan: plan.name,
							status: 'active',
							access: plan.access,
							cadence: plan.cadence,
							nextBillingDate: new Date( Date.now() + 30 * 86400000 ).toISOString().slice( 0, 10 ),
							amount: comped ? 0 : plan.amount,
						},
					],
				} ),
			} );
		}, 700 );
	};

	if ( loading ) {
		return <Waiting />;
	}

	return (
		<VStack spacing={ 4 }>
			<SelectControl
				label={ __( 'Choose a plan', 'newspack-plugin' ) }
				value={ planName }
				options={ DIGITAL_PLANS.map( p => ( {
					label: `${ p.name } — $${ p.amount }/${ p.cadence === 'Monthly' ? 'mo' : 'yr' }`,
					value: p.name,
				} ) ) }
				onChange={ setPlanName }
			/>
			{ comped ? (
				<Notice status="warning" isDismissible={ false }>
					{ sprintf( __( 'This will grant %s free access with no billing. Use sparingly.', 'newspack-plugin' ), plan.name ) }
				</Notice>
			) : (
				<p>
					{ sprintf(
						__( 'Billing will start today. First charge: $%1$s. Next renewal in %2$s.', 'newspack-plugin' ),
						plan.amount.toFixed( 2 ),
						plan.cadence === 'Monthly' ? '30 days' : '1 year'
					) }
				</p>
			) }
			<HStack spacing={ 2 } justify="flex-end">
				<Button variant="secondary" size="compact" onClick={ onCancel }>
					{ __( 'Cancel', 'newspack-plugin' ) }
				</Button>
				<Button variant="primary" size="compact" onClick={ submit }>
					{ comped ? __( 'Grant free access', 'newspack-plugin' ) : __( 'Confirm', 'newspack-plugin' ) }
				</Button>
			</HStack>
		</VStack>
	);
}

export default function ResubscribeFlow( { subscriber, onClose, onComplete } ) {
	const hasPaymentMethod = subscriber.paymentMethods && subscriber.paymentMethods.length > 0;
	const [ step, setStep ] = useState( hasPaymentMethod ? 'plan' : 'choose' );
	const [ loading, setLoading ] = useState( false );

	const sendLink = () => {
		setLoading( true );
		setTimeout( () => {
			onComplete( {
				type: 'success',
				message: sprintf( __( 'Resubscribe link sent to %s.', 'newspack-plugin' ), subscriber.email ),
			} );
		}, 700 );
	};

	let body;
	if ( loading ) {
		body = <Waiting />;
	} else if ( step === 'choose' ) {
		body = (
			<VStack spacing={ 4 }>
				<p>{ __( 'No payment method on file. Choose how to collect payment before resubscribing.', 'newspack-plugin' ) }</p>
				<HStack spacing={ 2 } justify="flex-end">
					<Button variant="tertiary" size="compact" onClick={ () => setStep( 'comp' ) }>
						{ __( 'Grant free access', 'newspack-plugin' ) }
					</Button>
					<Button variant="secondary" size="compact" onClick={ () => setStep( 'plan' ) }>
						{ __( 'Enter card details', 'newspack-plugin' ) }
					</Button>
					<Button variant="primary" size="compact" onClick={ sendLink }>
						{ __( 'Send resubscribe link', 'newspack-plugin' ) }
					</Button>
				</HStack>
			</VStack>
		);
	} else if ( step === 'plan' ) {
		body = <PlanPicker subscriber={ subscriber } onComplete={ onComplete } onCancel={ hasPaymentMethod ? onClose : () => setStep( 'choose' ) } />;
	} else if ( step === 'comp' ) {
		body = <PlanPicker subscriber={ subscriber } onComplete={ onComplete } onCancel={ () => setStep( 'choose' ) } comped />;
	}

	return (
		<Modal title={ __( 'Resubscribe', 'newspack-plugin' ) } onRequestClose={ onClose }>
			{ body }
		</Modal>
	);
}
