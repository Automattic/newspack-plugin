/**
 * WordPress dependencies.
 */
import { __, sprintf } from '@wordpress/i18n';
import { CardBody } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { Badge, Button, Card, Grid, Router } from '../../../../../packages/components/src';
import { useWizardData } from '../../../../../packages/components/src/wizard/store/utils';
import { useWizardApiFetch } from '../../../hooks/use-wizard-api-fetch';
import { WIZARD_STORE_NAMESPACE } from '../../../../../packages/components/src/wizard/store';
import ContentRuleControl from './edit/content-rule-control';
import { getEditGateLayoutUrl, getGateStatus, getGateStatusBadgeLevel } from './utils';
import { AUDIENCE_CONTENT_GATES_WIZARD_SLUG } from './consts';

const availableAccessRules = window.newspackAudienceContentGates.available_access_rules || {};

const noOp = () => {};

const { useHistory } = Router;

export default function ContentGateSettings( { gate, updateGatesData }: { gate: Gate; updateGatesData: ( gates: Gate[] ) => void } ) {
	const history = useHistory();
	const { gates = null as unknown as Gate[] } = useWizardData( AUDIENCE_CONTENT_GATES_WIZARD_SLUG ) as WizardData;
	const { wizardApiFetch, isFetching, resetError } = useWizardApiFetch( AUDIENCE_CONTENT_GATES_WIZARD_SLUG );
	const { addNotice, resetNotices } = useDispatch( WIZARD_STORE_NAMESPACE );

	const handleStatusChange = ( status: GateStatus, showNotice = true ) => {
		if ( isFetching ) {
			return;
		}
		resetError();
		resetNotices();
		const _gate = {
			...gate,
			status,
		};
		wizardApiFetch< Gate >(
			{
				path: `/newspack/v1/wizard/${ AUDIENCE_CONTENT_GATES_WIZARD_SLUG }/${ gate.id }`,
				method: 'POST',
				data: { gate: _gate },
			},
			{
				onSuccess( data: Gate ) {
					updateGatesData( gates.map( g => ( g.id === data.id ? data : g ) ) );
					if ( showNotice ) {
						addNotice( {
							message: sprintf(
								// translators: 1: the gate title, or "Content" if we can't determine the gate title. 2: the gate status. __(
								'%1$s gate %2$s.',
								gate.title ? `“${ gate.title }”` : __( 'Content', 'newspack-plugin' ),
								gate.status === 'publish' ? __( 'disabled', 'newspack-plugin' ) : __( 'enabled', 'newspack-plugin' )
							),
							type: 'success',
							id: 'content-gate-updated',
							buttonLabel: __( 'Undo', 'newspack-plugin' ),
							onClick: () => handleStatusChange( gate.status, false ),
						} );
					}
				},
			}
		);
	};

	const handleDelete = () => {
		// eslint-disable-next-line no-alert
		if ( ! confirm( __( 'Are you sure you want to permanently delete this content gate?', 'newspack-plugin' ) ) ) {
			return;
		}
		resetError();
		resetNotices();
		wizardApiFetch(
			{
				path: `/newspack/v1/wizard/${ AUDIENCE_CONTENT_GATES_WIZARD_SLUG }/${ gate.id }`,
				method: 'DELETE',
			},
			{
				onSuccess() {
					const deletedGate = gates.find( g => g.id === gate.id );
					const newGates = gates.filter( g => g.id !== gate.id );
					updateGatesData( newGates );
					addNotice( {
						message: sprintf(
							// translators: %s is the gate title, or "Content" if we can't determine the deleted gate title.
							__( '%s gate deleted.', 'newspack-plugin' ),
							deletedGate?.title ? `“${ deletedGate.title }”` : __( 'Content', 'newspack-plugin' )
						),
						type: 'success',
						id: 'content-gate-deleted',
					} );
				},
			}
		);
	};

	return (
		<Card
			className="newspack-content-gates__gate"
			id={ gate.id }
			key={ gate.id }
			isSmall
			__experimentalCoreCard
			__experimentalCoreProps={ {
				noMargin: true,
				header: (
					<>
						<h3>
							{ gate.title }
							<Badge level={ getGateStatusBadgeLevel( gate.status ) } text={ getGateStatus( gate.status ) } />
						</h3>
					</>
				),
				actions: [
					{
						label: __( 'Edit', 'newspack-plugin' ),
						action: () => history.push( `/edit/${ gate.id }` ),
						disabled: isFetching,
					},
					{
						label: gate.status !== 'publish' ? __( 'Activate', 'newspack-plugin' ) : __( 'Deactivate', 'newspack-plugin' ),
						action: () => handleStatusChange( gate.status === 'publish' ? 'draft' : 'publish' ),
						disabled: isFetching,
					},
					{
						label: __( 'Delete', 'newspack-plugin' ),
						action: () => handleDelete(),
						disabled: isFetching,
						destructive: true,
					},
				],
			} }
		>
			<CardBody>
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
																availableAccessRules[ rule.slug ].options?.find( option => option.value === value )
																	?.label
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
						{ ( ! gate.custom_access?.active || gate.custom_access.access_rules?.length === 0 ) && (
							<p>{ __( 'N/A', 'newspack-plugin' ) }</p>
						) }
						{ gate.custom_access?.active && gate.custom_access.access_rules?.length > 0 && gate.custom_access.gate_layout_id && (
							<Button variant="secondary" href={ getEditGateLayoutUrl( gate.id, 'custom_access' ) }>
								{ __( 'Customize paid access layout', 'newspack-plugin' ) }
							</Button>
						) }
					</div>
				</Grid>
			</CardBody>
		</Card>
	);
}
