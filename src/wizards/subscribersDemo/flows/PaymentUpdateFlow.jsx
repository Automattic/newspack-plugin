/* eslint-disable @wordpress/i18n-translator-comments, no-bitwise */
/**
 * Flow D — Payment method update.
 */

import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { __experimentalHStack as HStack, __experimentalVStack as VStack } from '@wordpress/components'; // eslint-disable-line @wordpress/no-unsafe-wp-apis
import { Button, Grid, Modal, Notice, TextControl, Waiting } from '../../../../packages/components/src';

export default function PaymentUpdateFlow( { onClose, onComplete, paymentMethod } ) {
	const isEdit = !! paymentMethod;
	const expiryPlaceholder = `01/${ String( new Date().getFullYear() + 2 ).slice( -2 ) }`;
	const [ number, setNumber ] = useState( isEdit ? '•••• •••• •••• ' + paymentMethod.last4 : '' );
	const [ expiry, setExpiry ] = useState( isEdit ? paymentMethod.expiry : '' );
	const [ cvc, setCvc ] = useState( '' );
	const [ state, setState ] = useState( 'form' );

	const digits = number.replace( /\D/g, '' );
	const valid = digits.length >= 12 && /^\d{2}\/\d{2}$/.test( expiry ) && cvc.length >= 3;

	const submit = () => {
		if ( ! valid ) {
			return;
		}
		setState( 'loading' );
		setTimeout( () => {
			const last4 = digits.slice( -4 );
			const type = digits.startsWith( '4' ) ? 'Visa' : 'Mastercard';
			onComplete( {
				type: 'success',
				message: isEdit ? __( 'Payment method updated.', 'newspack-plugin' ) : __( 'Payment method added.', 'newspack-plugin' ),
				mutate: s => {
					if ( isEdit ) {
						return {
							...s,
							paymentMethods: s.paymentMethods.map( m => ( m.id === paymentMethod.id ? { ...m, type, last4, expiry } : m ) ),
						};
					}
					const next = { id: 'pm_' + Date.now(), type, last4, expiry, isDefault: s.paymentMethods.length === 0 };
					return { ...s, paymentMethods: [ ...s.paymentMethods, next ] };
				},
			} );
		}, 700 );
	};

	return (
		<Modal
			title={ isEdit ? __( 'Update payment method', 'newspack-plugin' ) : __( 'Add payment method', 'newspack-plugin' ) }
			onRequestClose={ onClose }
		>
			{ state === 'loading' ? (
				<Waiting />
			) : (
				<VStack spacing={ 4 }>
					<TextControl
						label={ __( 'Card number', 'newspack-plugin' ) }
						value={ number }
						onChange={ setNumber }
						placeholder="4242 4242 4242 4242"
						withMargin={ false }
					/>
					<Grid columns={ 2 } noMargin>
						<TextControl
							label={ __( 'Expiry (MM/YY)', 'newspack-plugin' ) }
							value={ expiry }
							onChange={ setExpiry }
							placeholder={ expiryPlaceholder }
						/>
						<TextControl label={ __( 'CVC', 'newspack-plugin' ) } value={ cvc } onChange={ setCvc } placeholder="123" />
					</Grid>
					{ ! valid && number.length > 0 && (
						<Notice noMargin isWarning noticeText={ __( 'Check the card details.', 'newspack-plugin' ) } />
					) }
					<HStack spacing={ 2 } justify="flex-end">
						<Button variant="secondary" size="compact" onClick={ onClose }>
							{ __( 'Cancel', 'newspack-plugin' ) }
						</Button>
						<Button variant="primary" size="compact" onClick={ submit } disabled={ ! valid }>
							{ __( 'Save', 'newspack-plugin' ) }
						</Button>
					</HStack>
				</VStack>
			) }
		</Modal>
	);
}
