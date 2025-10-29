/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
import { DropdownMenu } from '@wordpress/components';
import { shield } from '@wordpress/icons';
import { useCallback, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { ActionCard, Grid } from '../../../../../packages/components/src';
import RulesChoices from './rules-choices';
import AccessRuleControl from './access-rule-control';

const availableAccessRules = window.newspackAudienceContentGates.available_access_rules || {};

export default function AccessRules( {
	rules,
	onChange,
	onToggleRule,
}: {
	rules: GateAccessRule[];
	onChange: ( rules: GateAccessRule[] ) => void;
	onToggleRule: ( slug: string ) => void;
} ) {
	const isRuleDisabled = useCallback(
		( slug: string ): boolean => {
			const conflicts = availableAccessRules[ slug ].conflicts;
			// Check whether any conflicting rule is enabled.
			if ( conflicts?.some( conflict => rules.find( r => r.slug === conflict ) ) ) {
				return true;
			}
			return false;
		},
		[ rules ]
	);

	const choices = useMemo( () => {
		return Object.keys( availableAccessRules ).map( slug => {
			const rule = availableAccessRules[ slug ];
			return {
				label: rule.name,
				value: slug,
				disabled: isRuleDisabled( slug ),
				info: rule.description,
			};
		} );
	}, [ rules, isRuleDisabled ] );

	const handleChange = useCallback(
		( slug: string ) => ( v: GateAccessRuleValue ) => {
			onChange( rules.map( r => ( r.slug === slug ? { ...r, value: v } : r ) ) );
		},
		[ onChange, rules ]
	);

	return (
		<ActionCard
			title={ __( 'Access Rules', 'newspack-plugin' ) }
			description={ __( 'Configure how readers can bypass this content gate.', 'newspack-plugin' ) }
			hasWhiteHeader={ true }
			noBorder={ true }
			noMargin={ true }
			actionContent={
				<DropdownMenu icon={ shield } text={ __( 'Manage Rules', 'newspack-plugin' ) } label={ __( 'Manage Rules', 'newspack-plugin' ) }>
					{ () => <RulesChoices choices={ choices } onSelect={ onToggleRule } value={ rules.map( r => r.slug ) } /> }
				</DropdownMenu>
			}
		>
			<Grid columns={ Math.min( 3, rules.length ) } gutter={ 32 }>
				{ rules.map( ( rule: GateAccessRule ) => (
					<AccessRuleControl key={ rule.slug } slug={ rule.slug } value={ rule.value } onChange={ handleChange( rule.slug ) } />
				) ) }
			</Grid>
		</ActionCard>
	);
}
