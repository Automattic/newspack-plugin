/**
 * WordPress dependencies.
 */
import { CardBody } from '@wordpress/components';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Metering from './metering';
import AccessRules from './access-rules';

interface CustomAccessProps {
	customAccess: CustomAccess;
	onChange: ( customAccess: Partial< CustomAccess > ) => void;
}

export default function CustomAccess( { customAccess, onChange }: CustomAccessProps ) {
	// Get the first group of rules (UI currently only supports a single group).
	const currentRules = customAccess.access_rules[ 0 ] || [];

	const handleChange = useCallback(
		( value: Partial< CustomAccess > ) => {
			onChange( {
				active: customAccess.active,
				metering: customAccess.metering,
				access_rules: customAccess.access_rules,
				...value,
			} );
		},
		[ customAccess, onChange ]
	);

	const handleRulesChange = useCallback(
		( rules: GateAccessRule[] ) => {
			// Wrap rules in a single group to maintain grouped format.
			// If no rules, set empty array to avoid [ [] ] which would pass readiness checks.
			handleChange( { access_rules: rules.length ? [ rules ] : [] } );
		},
		[ handleChange ]
	);

	return (
		<>
			<AccessRules rules={ currentRules } onChange={ handleRulesChange } />
			<CardBody size="small">
				<Metering metering={ customAccess.metering } onChange={ ( metering: Metering ) => handleChange( { metering } ) } />
			</CardBody>
		</>
	);
}
