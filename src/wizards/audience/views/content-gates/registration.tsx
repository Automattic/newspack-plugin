/**
 * WordPress dependencies.
 */
import { CheckboxControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { ActionCard, Card } from '../../../../../packages/components/src';

import Metering from './metering';

interface RegistrationProps {
	registration: Registration;
	onChange: ( registration: Registration ) => void;
	cardProps?: Partial< React.ComponentPropsWithoutRef< typeof ActionCard > >;
}

export default function Registration( { registration, onChange, cardProps = {} }: RegistrationProps ) {
	return (
		<ActionCard
			title={ __( 'Registered Access', 'newspack-plugin' ) }
			description={ __( 'Readers must log in to view this content.', 'newspack-plugin' ) }
			toggleChecked={ registration.active }
			toggleOnChange={ ( active: boolean ) => onChange( { ...registration, active } ) }
			{ ...cardProps }
		>
			{ registration.active && (
				<Card noBorder>
					<CheckboxControl
						label={ __( 'Require readers to verify their email address.', 'newspack-plugin' ) }
						checked={ registration.require_verification }
						onChange={ () => onChange( { ...registration, require_verification: ! registration.require_verification } ) }
					/>
					<hr />
					<Metering metering={ registration.metering } onChange={ ( metering: Metering ) => onChange( { ...registration, metering } ) } />
				</Card>
			) }
		</ActionCard>
	);
}
