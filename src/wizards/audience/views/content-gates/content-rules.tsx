/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
import { DropdownMenu } from '@wordpress/components';
import { shield } from '@wordpress/icons';
import { useMemo, useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { ActionCard, Grid } from '../../../../../packages/components/src';
import RulesChoices from './rules-choices';
import ContentRuleControl from './content-rule-control';

const availableContentRules = window.newspackAudienceContentGates.available_content_rules || {};

export default function ContentRules( {
	rules,
	onChange,
	onToggleRule,
}: {
	rules: GateContentRule[];
	onChange: ( rules: GateContentRule[] ) => void;
	onToggleRule: ( slug: string ) => void;
} ) {
	const choices = useMemo( () => {
		return Object.keys( availableContentRules ).map( slug => {
			const rule = availableContentRules[ slug ];
			return {
				label: rule.name,
				value: slug,
				info: rule.description || '',
			};
		} );
	}, [] );

	const handleChange = useCallback(
		( slug: string ) => ( v: GateContentRuleValue ) => {
			onChange( rules.map( r => ( r.slug === slug ? { ...r, value: v } : r ) ) );
		},
		[ onChange, rules ]
	);

	return (
		<ActionCard
			title={ __( 'Content Rules', 'newspack-plugin' ) }
			description={ __( 'Configure which content is restricted by this content gate.', 'newspack-plugin' ) }
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
				{ rules.map( ( rule: GateContentRule ) => (
					<ContentRuleControl key={ rule.slug } slug={ rule.slug } value={ rule.value } onChange={ handleChange( rule.slug ) } />
				) ) }
			</Grid>
		</ActionCard>
	);
}
