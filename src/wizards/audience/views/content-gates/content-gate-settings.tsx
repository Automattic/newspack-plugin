/**
 * WordPress dependencies.
 */
import apiFetch from '@wordpress/api-fetch';
import { Fragment, useState, useEffect, useMemo, useCallback } from '@wordpress/element';
import { DropdownMenu, SelectControl, CheckboxControl, TextControl, Button } from '@wordpress/components';
import { shield } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { ActionCard, Grid, Card, SectionHeader } from '../../../../../packages/components/src';
import RulesChoices from './rules-choices';
import AccessRuleControl from './access-rule-control';
import ContentRuleControl from './content-rule-control';

const availableAccessRules = window.newspackAudienceContentGates.available_access_rules || {};
const availableContentRules = window.newspackAudienceContentGates.available_content_rules || {};

type ContentGateSettingsProps = {
	value: Gate;
};

export default function ContentGateSettings( { value }: ContentGateSettingsProps ) {
	const [ gate, setGate ] = useState< Gate >( value );

	useEffect( () => {
		setGate( value );
	}, [ value ] );

	const handleToggleRule = useCallback( ( slug: string, type: 'access' | 'content' = 'access' ) => {
		const rule = type === 'access' ? availableAccessRules[ slug ] : availableContentRules[ slug ];
		if ( ! rule ) {
			return;
		}
		const key = type === 'access' ? 'access_rules' : 'content_rules';
		setGate( prevGate => {
			const hasExistingRule = !! prevGate[ key ].find( r => r.slug === slug );
			if ( hasExistingRule ) {
				return {
					...prevGate,
					[ key ]: [ ...prevGate[ key ].filter( r => r.slug !== slug ) ],
				};
			}
			return {
				...prevGate,
				[ key ]: [ ...prevGate[ key ], { slug, value: rule.default } ],
			};
		} );
	}, [] );

	const handleUpdateRule = useCallback(
		( slug: string, type: 'access' | 'content' = 'access' ) =>
			( v: string | string[] | boolean ) => {
				const key = type === 'access' ? 'access_rules' : 'content_rules';
				setGate( prevGate => ( {
					...prevGate,
					[ key ]: prevGate[ key ].map( r => ( r.slug === slug ? { ...r, value: v } : r ) ),
				} ) );
			},
		[]
	);

	const isRuleDisabled = useCallback(
		( slug: string ): boolean => {
			const conflicts = availableAccessRules[ slug ].conflicts;
			// Check whether any conflicting rule is enabled.
			if ( conflicts?.some( conflict => gate.access_rules.find( r => r.slug === conflict ) ) ) {
				return true;
			}
			return false;
		},
		[ gate.access_rules ]
	);

	const accessRulesChoices = useMemo( () => {
		return Object.keys( availableAccessRules ).map( slug => {
			const rule = availableAccessRules[ slug ];
			return {
				label: rule.name,
				value: slug,
				disabled: isRuleDisabled( slug ),
				info: rule.description,
			};
		} );
	}, [ gate.access_rules, isRuleDisabled ] );

	const contentRulesChoices = useMemo( () => {
		return Object.keys( availableContentRules ).map( slug => {
			const rule = availableContentRules[ slug ];
			return {
				label: rule.name,
				value: slug,
				info: rule.description || '',
			};
		} );
	}, [] );

	const handleSave = useCallback( () => {
		apiFetch< Gate >( {
			path: `/newspack/v1/content-gate/${ gate.id }`,
			method: 'POST',
			data: { gate },
		} )
			.then( data => {
				setGate( data );
			} )
			.catch( error => console.error( error ) ); // eslint-disable-line no-console
	}, [ gate.id, gate ] );

	return (
		<Fragment>
			<ActionCard
				title={ __( 'Access Rules', 'newspack-plugin' ) }
				description={ __( 'Configure how readers can bypass this content gate.', 'newspack-plugin' ) }
				hasWhiteHeader={ true }
				noBorder={ true }
				noMargin={ true }
				actionContent={
					<DropdownMenu icon={ shield } text={ __( 'Manage Rules', 'newspack-plugin' ) } label={ __( 'Manage Rules', 'newspack-plugin' ) }>
						{ () => (
							<RulesChoices
								choices={ accessRulesChoices }
								onSelect={ handleToggleRule }
								value={ gate.access_rules.map( r => r.slug ) }
							/>
						) }
					</DropdownMenu>
				}
			>
				{ gate.access_rules.length > 0 && (
					<Grid columns={ Math.min( 3, gate.access_rules.length ) } gutter={ 32 }>
						{ gate.access_rules.map( ( rule: GateAccessRule ) => (
							<AccessRuleControl key={ rule.slug } slug={ rule.slug } value={ rule.value } onChange={ handleUpdateRule( rule.slug ) } />
						) ) }
					</Grid>
				) }
			</ActionCard>
			<ActionCard
				title={ __( 'Content Rules', 'newspack-plugin' ) }
				description={ __( 'Configure which content is restricted by this content gate.', 'newspack-plugin' ) }
				hasWhiteHeader={ true }
				noBorder={ true }
				noMargin={ true }
				actionContent={
					<DropdownMenu icon={ shield } text={ __( 'Manage Rules', 'newspack-plugin' ) } label={ __( 'Manage Rules', 'newspack-plugin' ) }>
						{ () => (
							<RulesChoices
								choices={ contentRulesChoices }
								onSelect={ ( slug: string ) => handleToggleRule( slug, 'content' ) }
								value={ gate.content_rules.map( r => r.slug ) }
							/>
						) }
					</DropdownMenu>
				}
			>
				{ gate.content_rules.length > 0 && (
					<Grid columns={ 3 } gutter={ 32 }>
						{ gate.content_rules.map( ( rule: GateContentRule ) => (
							<ContentRuleControl
								key={ rule.slug }
								slug={ rule.slug }
								value={ rule.value }
								onChange={ handleUpdateRule( rule.slug, 'content' ) }
							/>
						) ) }
					</Grid>
				) }
			</ActionCard>
			<Card noBorder>
				<SectionHeader heading={ 3 } title={ __( 'Metering', 'newspack-plugin' ) } noMargin />
				<Card noBorder>
					<CheckboxControl
						label={ __( 'Meter content views for this gate', 'newspack-plugin' ) }
						checked={ gate.metering.enabled }
						onChange={ () => setGate( { ...gate, metering: { ...gate.metering, enabled: ! gate.metering.enabled } } ) }
					/>
				</Card>
				{ gate.metering.enabled && (
					<Grid columns={ 3 } gutter={ 32 }>
						<TextControl
							type={ 'number' }
							label={ __( 'Article limit for anonymous viewers', 'newspack-plugin' ) }
							help={ __(
								'Number of times an anonymous reader can view gated content. If set to 0, anonymous readers will always render the gate.',
								'newspack-plugin'
							) }
							value={ gate.metering.anonymous_count }
							onChange={ v => setGate( { ...gate, metering: { ...gate.metering, anonymous_count: parseInt( v ) } } ) }
						/>
						<TextControl
							type={ 'number' }
							label={ __( 'Article limit for registered viewers', 'newspack-plugin' ) }
							help={ __(
								'Number of times a registered reader can view gated content. If set to 0, registered readers will always render the gate.',
								'newspack-plugin'
							) }
							value={ gate.metering.registered_count }
							onChange={ v => setGate( { ...gate, metering: { ...gate.metering, registered_count: parseInt( v ) } } ) }
						/>
						<SelectControl
							label={ __( 'Time period', 'newspack-plugin' ) }
							help={ __(
								'The time period during which the metering views will be counted. For example, if the metering period is set to "Weekly", the metering views will be reset every week.',
								'newspack-plugin'
							) }
							value={ gate.metering.period }
							onChange={ v => setGate( { ...gate, metering: { ...gate.metering, period: v } } ) }
							options={ [
								{
									value: 'week',
									label: __( 'Weekly', 'newspack-plugin' ),
								},
								{
									value: 'month',
									label: __( 'Monthly', 'newspack-plugin' ),
								},
							] }
						/>
					</Grid>
				) }
			</Card>
			<div className="newspack-buttons-card">
				<Button variant="primary" onClick={ handleSave }>
					{ __( 'Save Settings', 'newspack-plugin' ) }
				</Button>
			</div>
		</Fragment>
	);
}
