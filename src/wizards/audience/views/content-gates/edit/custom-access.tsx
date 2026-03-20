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
	// Flatten grouped rules for display (each group has one rule in OR mode).
	const currentRules = customAccess.access_rules.map( group => group[ 0 ] ).filter( Boolean );

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
			// Each rule is its own group for OR logic: [ [rule1], [rule2] ].
			handleChange( { access_rules: rules.map( rule => [ rule ] ) } );
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
