/**
 * WordPress dependencies.
 */
import { useEffect, useState, useCallback } from '@wordpress/element';
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
	const [ status, setStatus ] = useState< GateStatus >( gate.status );
	const [ isRestoring, setIsRestoring ] = useState( false );

	const handleSave = useCallback( () => {
		const _gate = {
			...gate,
			access_rules: accessRules,
			content_rules: contentRules,
			metering,
			status,
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
				onFinally() {
					setIsRestoring( false );
				},
			}
		);
	}, [ gate, accessRules, contentRules, metering, status, wizardApiFetch, onSave ] );

	useEffect( () => {
		if ( ! isRestoring ) {
			return;
		}
		if ( status === 'draft' ) {
			handleSave();
		}
	}, [ isRestoring, status, handleSave ] );

	const handleDelete = useCallback( () => onDelete( gate.id ), [ gate.id, onDelete ] );
	const handleRestore = useCallback( () => {
		setIsRestoring( true );
		setStatus( 'draft' );
	}, [] );

	return (
		<>
			<ContentRules rules={ contentRules } onChange={ setContentRules } />
			<AccessRules rules={ accessRules } onChange={ setAccessRules } />
			<Metering metering={ metering } onChange={ setMetering } />
			<div className="newspack-buttons-card">
				{ 'trash' !== gate.status && (
					<Button variant="primary" onClick={ handleSave }>
						{ __( 'Save Settings', 'newspack-plugin' ) }
					</Button>
				) }
				<Button isDestructive variant="secondary" onClick={ handleDelete }>
					{ 'trash' === gate.status ? __( 'Permanently Delete', 'newspack-plugin' ) : __( 'Delete', 'newspack-plugin' ) }
				</Button>
				{ 'trash' === gate.status && (
					<Button variant="secondary" onClick={ handleRestore }>
						{ __( 'Restore', 'newspack-plugin' ) }
					</Button>
				) }
			</div>
		</>
	);
}
