/* eslint-disable @wordpress/i18n-translator-comments, no-bitwise */
/**
 * Flow C — Plan change.
 */

import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { __experimentalHStack as HStack, __experimentalVStack as VStack } from '@wordpress/components'; // eslint-disable-line @wordpress/no-unsafe-wp-apis
import { Button, Modal, Notice, SelectControl, Waiting } from '../../../../packages/components/src';
import { DIGITAL_PLANS, PRINT_PLANS } from '../data/mock-subscribers';

export default function PlanChangeFlow( { subscription, onClose, onComplete } ) {
	const pool = DIGITAL_PLANS.some( p => p.name === subscription.plan ) ? DIGITAL_PLANS : PRINT_PLANS;
	const options = pool.filter( p => p.name !== subscription.plan );
	const [ planName, setPlanName ] = useState( options[ 0 ]?.name || '' );
	const [ state, setState ] = useState( 'choose' );
	const plan = options.find( p => p.name === planName );

	const submit = () => {
		setState( 'loading' );
		setTimeout( () => {
			onComplete( {
				type: 'success',
				message: sprintf( __( 'Plan changed to %s.', 'newspack-plugin' ), plan.name ),
				mutate: s => ( {
					...s,
					subscriptions: s.subscriptions.map( sub =>
						sub.id === subscription.id
							? { ...sub, plan: plan.name, access: plan.access, cadence: plan.cadence, amount: plan.amount }
							: sub
					),
				} ),
			} );
		}, 700 );
	};

	if ( ! plan ) {
		return (
			<Modal title={ __( 'Change plan', 'newspack-plugin' ) } onRequestClose={ onClose }>
				<Notice noMargin isWarning noticeText={ __( 'No other plans available in this category.', 'newspack-plugin' ) } />
			</Modal>
		);
	}

	return (
		<Modal title={ __( 'Change plan', 'newspack-plugin' ) } onRequestClose={ onClose }>
			{ state === 'loading' ? (
				<Waiting />
			) : (
				<VStack spacing={ 4 }>
					<p>{ sprintf( __( 'Currently on %s.', 'newspack-plugin' ), subscription.plan ) }</p>
					<SelectControl
						label={ __( 'New plan', 'newspack-plugin' ) }
						value={ planName }
						options={ options.map( p => ( {
							label: `${ p.name } — $${ p.amount }/${ p.cadence === 'Monthly' ? 'mo' : 'yr' }`,
							value: p.name,
						} ) ) }
						onChange={ setPlanName }
					/>
					<Notice
						noMargin
						noticeText={ sprintf(
							__(
								'Change takes effect at the next billing cycle on %1$s. New charge: $%2$s. Proration will be applied to the first invoice.',
								'newspack-plugin'
							),
							subscription.nextBillingDate || __( 'next renewal', 'newspack-plugin' ),
							plan.amount.toFixed( 2 )
						) }
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
