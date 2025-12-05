/**
 * WordPress dependencies.
 */
import { useState, useCallback } from '@wordpress/element';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import AccessRules from './access-rules';
import ContentRules from './content-rules';
import Metering from './metering';
import { AUDIENCE_CONTENT_GATES_WIZARD_SLUG } from './consts';
import { useWizardApiFetch } from '../../../hooks/use-wizard-api-fetch';

type ContentGateSettingsProps = {
	gate: Gate;
	onDelete: ( id: number ) => void;
	onSave: ( gate: Gate ) => void;
};

export default function ContentGateSettings( { gate, onDelete, onSave }: ContentGateSettingsProps ) {
	const { wizardApiFetch } = useWizardApiFetch( AUDIENCE_CONTENT_GATES_WIZARD_SLUG );
	const [ accessRules, setAccessRules ] = useState< GateAccessRule[] >( gate.access_rules );
	const [ contentRules, setContentRules ] = useState< GateContentRule[] >( gate.content_rules );
	const [ metering, setMetering ] = useState< Metering >( gate.metering );

	const handleSave = useCallback( () => {
		const _gate = {
			...gate,
			access_rules: accessRules,
			content_rules: contentRules,
			metering,
		};
		wizardApiFetch< Gate >(
			{
				path: `/newspack/v1/wizard/${ AUDIENCE_CONTENT_GATES_WIZARD_SLUG }/${ gate.id }`,
				method: 'POST',
				data: { gate: _gate },
			},
			{
				onSuccess( data ) {
					onSave( data );
				},
				onError( error ) {
					console.error( error ); // eslint-disable-line no-console
				},
			}
		);
	}, [ gate, accessRules, contentRules, metering, wizardApiFetch, onSave ] );

	const handleDelete = useCallback( () => onDelete( gate.id ), [ gate.id, onDelete ] );

	return (
		<>
			<ContentRules rules={ contentRules } onChange={ setContentRules } />
			<AccessRules rules={ accessRules } onChange={ setAccessRules } />
			<Metering metering={ metering } setMetering={ setMetering } />
			<div className="newspack-buttons-card">
				<Button variant="primary" onClick={ handleSave }>
					{ __( 'Save Settings', 'newspack-plugin' ) }
				</Button>
				<Button isDestructive variant="secondary" onClick={ handleDelete }>
					{ __( 'Delete', 'newspack-plugin' ) }
				</Button>
			</div>
		</>
	);
}
