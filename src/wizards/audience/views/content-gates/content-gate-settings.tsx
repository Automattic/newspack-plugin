/**
 * WordPress dependencies.
 */
import apiFetch from '@wordpress/api-fetch';
import { Fragment, useState, useCallback } from '@wordpress/element';
import { SelectControl, CheckboxControl, TextControl, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Grid, Card, SectionHeader } from '../../../../../packages/components/src';
import AccessRules from './access-rules';
import ContentRules from './content-rules';

const availableAccessRules = window.newspackAudienceContentGates.available_access_rules || {};
const availableContentRules = window.newspackAudienceContentGates.available_content_rules || {};

type ContentGateSettingsProps = {
	gate: Gate;
	onDelete: ( id: number ) => void;
};

export default function ContentGateSettings( { gate, onDelete }: ContentGateSettingsProps ) {
	const [ accessRules, setAccessRules ] = useState< GateAccessRule[] >( gate.access_rules );
	const [ contentRules, setContentRules ] = useState< GateContentRule[] >( gate.content_rules );
	const [ metering, setMetering ] = useState< Metering >( gate.metering );

	const handleToggleRule = useCallback( ( slug: string, type: 'access' | 'content' = 'access' ) => {
		if ( type === 'access' ) {
			setAccessRules( prevRules => [ ...prevRules, { slug, value: availableAccessRules[ slug ].default } ] );
		} else {
			setContentRules( prevRules => [ ...prevRules, { slug, value: availableContentRules[ slug ].default } ] );
		}
	}, [] );

	const handleSave = useCallback( () => {
		const _gate = {
			...gate,
			access_rules: accessRules,
			content_rules: contentRules,
			metering,
		};
		apiFetch< Gate >( {
			path: `/newspack/v1/content-gate/${ gate.id }`,
			method: 'POST',
			data: { gate: _gate },
		} ).catch( error => console.error( error ) ); // eslint-disable-line no-console
	}, [ gate.id, accessRules, contentRules, metering ] );

	const handleDelete = useCallback( () => onDelete( gate.id ), [ gate.id, onDelete ] );

	return (
		<Fragment>
			<AccessRules rules={ accessRules } onChange={ setAccessRules } onToggleRule={ slug => handleToggleRule( slug, 'access' ) } />
			<ContentRules rules={ contentRules } onChange={ setContentRules } onToggleRule={ slug => handleToggleRule( slug, 'content' ) } />
			<Card noBorder>
				<SectionHeader heading={ 3 } title={ __( 'Metering', 'newspack-plugin' ) } noMargin />
				<Card noBorder>
					<CheckboxControl
						label={ __( 'Meter content views for this gate', 'newspack-plugin' ) }
						checked={ metering.enabled }
						onChange={ () => setMetering( prevMetering => ( { ...prevMetering, enabled: ! prevMetering.enabled } ) ) }
					/>
				</Card>
				{ metering.enabled && (
					<Grid columns={ 3 } gutter={ 32 }>
						<TextControl
							type={ 'number' }
							label={ __( 'Article limit for anonymous viewers', 'newspack-plugin' ) }
							help={ __(
								'Number of times an anonymous reader can view gated content. If set to 0, anonymous readers will always render the gate.',
								'newspack-plugin'
							) }
							value={ metering.anonymous_count }
							onChange={ v => setMetering( prevMetering => ( { ...prevMetering, anonymous_count: parseInt( v ) } ) ) }
						/>
						<TextControl
							type={ 'number' }
							label={ __( 'Article limit for registered viewers', 'newspack-plugin' ) }
							help={ __(
								'Number of times a registered reader can view gated content. If set to 0, registered readers will always render the gate.',
								'newspack-plugin'
							) }
							value={ metering.registered_count }
							onChange={ v => setMetering( prevMetering => ( { ...prevMetering, registered_count: parseInt( v ) } ) ) }
						/>
						<SelectControl
							label={ __( 'Time period', 'newspack-plugin' ) }
							help={ __(
								'The time period during which the metering views will be counted. For example, if the metering period is set to "Weekly", the metering views will be reset every week.',
								'newspack-plugin'
							) }
							value={ metering.period }
							onChange={ v => setMetering( prevMetering => ( { ...prevMetering, period: v } ) ) }
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
				<Button isDestructive variant="secondary" onClick={ handleDelete }>
					{ __( 'Delete', 'newspack-plugin' ) }
				</Button>
			</div>
		</Fragment>
	);
}
