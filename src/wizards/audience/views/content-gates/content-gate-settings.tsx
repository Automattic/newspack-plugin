/**
 * WordPress dependencies.
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Button, Grid } from '../../../../../packages/components/src';
import ContentRuleControl from './edit/content-rule-control';
import { getEditGateLayoutUrl } from './utils';

type ContentGateSettingsProps = {
	gate: Gate;
};

const availableAccessRules = window.newspackAudienceContentGates.available_access_rules || {};

const noOp = () => {};

export default function ContentGateSettings( { gate }: ContentGateSettingsProps ) {
	return (
		<Grid className="newspack-content-gates__gate__settings" columns={ 3 } gutter={ 16 } borders noMargin>
			<div>
				<h4>{ __( 'Content rules', 'newspack-plugin' ) }</h4>
				{ gate.content_rules.length > 0 ? (
					gate.content_rules.map( rule => (
						<ContentRuleControl
							key={ rule.slug }
							slug={ rule.slug }
							value={ rule.value }
							exclusion={ rule.exclusion }
							onChange={ noOp }
							onChangeExclusion={ noOp }
							isStatic
						/>
					) )
				) : (
					<p>{ __( 'N/A', 'newspack-plugin' ) }</p>
				) }
			</div>
			<div>
				<h4>{ __( 'Registered access', 'newspack-plugin' ) }</h4>
				{ gate.registration?.active && (
					<p>
						<strong>{ __( 'Require verification:', 'newspack-plugin' ) } </strong>{ ' ' }
						{ gate.registration.require_verification ? __( 'Yes', 'newspack-plugin' ) : __( 'No', 'newspack-plugin' ) }
					</p>
				) }
				{ gate.registration?.active && gate.registration.metering.enabled && (
					<p>
						<strong>{ __( 'Metered:', 'newspack-plugin' ) } </strong>{ ' ' }
						{ sprintf(
							// translators: 1: metering count, 2: metering period
							__( '%1$d free views per %2$s', 'newspack-plugin' ),
							gate.registration.metering.count,
							gate.registration.metering.period
						) }
					</p>
				) }
				{ ! gate.registration?.active && <p>{ __( 'N/A', 'newspack-plugin' ) }</p> }
				{ gate.registration?.active && gate.registration.gate_layout_id && (
					<Button variant="secondary" href={ getEditGateLayoutUrl( gate.id, 'registration' ) }>
						{ __( 'Customize registered access layout', 'newspack-plugin' ) }
					</Button>
				) }
			</div>
			<div>
				<h4>{ __( 'Paid access', 'newspack-plugin' ) }</h4>
				{ gate.custom_access?.active &&
					gate.custom_access.access_rules.length > 0 &&
					gate.custom_access.access_rules.map( ruleGroup =>
						ruleGroup.map( rule =>
							availableAccessRules[ rule.slug ]?.name ? (
								<p key={ rule.slug }>
									<strong>{ availableAccessRules[ rule.slug ].name }:</strong>{ ' ' }
									{ Array.isArray( rule.value ) && availableAccessRules[ rule.slug ]?.options
										? rule.value
												.map(
													value =>
														availableAccessRules[ rule.slug ].options?.find( option => option.value === value )?.label
												)
												.join( ', ' )
										: rule.value }
								</p>
							) : null
						)
					) }
				{ gate.custom_access?.active && gate.custom_access.metering.enabled && (
					<p>
						<strong>{ __( 'Metered:', 'newspack-plugin' ) } </strong>{ ' ' }
						{ sprintf(
							// translators: 1: metering count, 2: metering period
							__( '%1$d free views per %2$s', 'newspack-plugin' ),
							gate.custom_access.metering.count,
							gate.custom_access.metering.period
						) }
					</p>
				) }
				{ ( ! gate.custom_access?.active || gate.custom_access.access_rules?.length === 0 ) && <p>{ __( 'N/A', 'newspack-plugin' ) }</p> }
				{ gate.custom_access?.active && gate.custom_access.access_rules?.length > 0 && gate.custom_access.gate_layout_id && (
					<Button variant="secondary" href={ getEditGateLayoutUrl( gate.id, 'custom_access' ) }>
						{ __( 'Customize paid access layout', 'newspack-plugin' ) }
					</Button>
				) }
			</div>
		</Grid>
	);
}
