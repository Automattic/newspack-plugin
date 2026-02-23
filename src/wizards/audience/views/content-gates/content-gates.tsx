/**
 * Content Gate component.
 */

/**
 * WordPress dependencies.
 */
import apiFetch from '@wordpress/api-fetch';
import { CardBody, __experimentalVStack as VStack } from '@wordpress/components'; // eslint-disable-line @wordpress/no-unsafe-wp-apis
import { useDispatch } from '@wordpress/data';
import { useEffect, useRef, useState } from '@wordpress/element';
import { ENTER } from '@wordpress/keycodes';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Badge, Button, Card, Modal, Notice, Router, TextControl } from '../../../../../packages/components/src';
import { useWizardData } from '../../../../../packages/components/src/wizard/store/utils';
import { useWizardApiFetch } from '../../../hooks/use-wizard-api-fetch';
import { WIZARD_STORE_NAMESPACE } from '../../../../../packages/components/src/wizard/store';
import ContentGatesOnboarding from './content-gates-onboarding';
import ContentGateSettings from './content-gate-settings';
import { AUDIENCE_CONTENT_GATES_WIZARD_SLUG } from './consts';
import { getGateStatus, getGateStatusBadgeLevel } from './utils';
import './style.scss';

const { useHistory } = Router;

const ContentGates = ( { updateGatesData }: { updateGatesData: ( gates: Gate[] ) => void } ) => {
	const history = useHistory();
	const wizardData = useWizardData( AUDIENCE_CONTENT_GATES_WIZARD_SLUG ) as WizardData;
	const { wizardApiFetch, isFetching, error, errorMessage, resetError, setError } = useWizardApiFetch( AUDIENCE_CONTENT_GATES_WIZARD_SLUG );
	const { resetHeaderData, setHeaderData } = useDispatch( WIZARD_STORE_NAMESPACE );
	const [ showModal, setShowModal ] = useState( false );
	const [ newGateName, setNewGateName ] = useState( '' );
	const [ isInFlight, setIsInFlight ] = useState( false );
	const ref = useRef( null );

	const gates = ( wizardData?.gates || [] ) as Gate[];

	useEffect( () => {
		if ( isFetching ) {
			setIsInFlight( true );
		} else {
			setIsInFlight( false );
		}
	}, [ isFetching ] );

	useEffect( () => {
		if ( isInFlight ) {
			return;
		}
		if ( ! gates?.length ) {
			resetHeaderData();
			return;
		}
		setHeaderData( {
			sectionTitle: __( 'Access control', 'newspack-plugin' ),
			sectionDescription: __(
				'Set up gates to manage what content readers can access across your site. Start by selecting which content to restrict, then configure access through registered and/or paid options (including metered rules).',
				'newspack-plugin'
			),
			sectionPrimaryAction: {
				label: __( 'Add new content gate', 'newspack-plugin' ),
				href: '#/edit/new/all',
			},
			sectionSecondaryAction:
				gates.length > 1
					? {
							label: __( 'Gate priority', 'newspack-plugin' ),
							action: () => setShowModal( true ),
					  }
					: undefined,
		} );
	}, [ isInFlight, gates ] );

	const toggleStatus = ( id: number ) => {
		if ( isFetching ) {
			return;
		}
		resetError();
		const gate = gates.find( g => g.id === id );
		if ( ! gate ) {
			return;
		}
		const _gate = {
			...gate,
			status: gate.status === 'publish' ? 'draft' : 'publish',
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
				},
			}
		);
	};

	const handleDelete = ( id: number ) => {
		// eslint-disable-next-line no-alert
		if ( ! confirm( __( 'Are you sure you want to permanently delete this content gate?', 'newspack-plugin' ) ) ) {
			return;
		}
		resetError();
		wizardApiFetch(
			{
				path: `/newspack/v1/wizard/${ AUDIENCE_CONTENT_GATES_WIZARD_SLUG }/${ id }`,
				method: 'DELETE',
			},
			{
				onSuccess() {
					const newGates = gates.filter( g => g.id !== id );
					updateGatesData( newGates );
				},
			}
		);
	};

	const handleUpdateGatePriorities = ( updates: Gate[] ) => {
		if ( isInFlight ) {
			return;
		}
		const oldGates = [ ...gates ];
		updateGatesData( updates );
		setIsInFlight( true );
		resetError();
		apiFetch< Gate >( {
			path: `/newspack/v1/wizard/${ AUDIENCE_CONTENT_GATES_WIZARD_SLUG }/priority`,
			method: 'POST',
			data: {
				gates: updates.map( g => ( { id: g.id, priority: g.priority } ) ),
			},
		} )
			.catch( ( fetchError: WpFetchError ) => {
				setError( fetchError );
				updateGatesData( oldGates );
			} )
			.finally( () => setIsInFlight( false ) );
	};

	const handleSaveGate = ( gate: Gate ) => {
		if ( isInFlight ) {
			return;
		}
		const newGates = gates.map( g => ( g.id === gate.id ? gate : g ) );
		updateGatesData( newGates );
	};

	if ( ! gates?.length ) {
		return <ContentGatesOnboarding />;
	}

	return (
		<>
			{ error && <Notice isError noticeText={ errorMessage } /> }
			{ showModal && (
				<Modal isNarrow title={ __( 'Add Content Gate', 'newspack-plugin' ) } onRequestClose={ () => setShowModal( false ) }>
					<TextControl
						disabled={ isInFlight }
						label={ __( 'Name', 'newspack-plugin' ) }
						placeholder={ __( 'Enter a name for the content gate', 'newspack-plugin' ) }
						onChange={ ( value: string ) => setNewGateName( value ) }
						onKeyUp={ ( event: KeyboardEvent ) => {
							if ( ENTER === event.keyCode && '' !== newGateName ) {
								event.preventDefault();
							}
						} }
					/>
					<Card buttonsCard noBorder className="justify-end">
						<Button variant="primary" onClick={ () => {} } disabled={ isInFlight }>
							{ __( 'Add Content Gate', 'newspack-plugin' ) }
						</Button>
						<Button disabled={ isInFlight } isDestructive variant="secondary" onClick={ () => setShowModal( false ) }>
							{ __( 'Cancel', 'newspack-plugin' ) }
						</Button>
					</Card>
				</Modal>
			) }
			<VStack className="newspack-content-gates__gates" spacing="16px" ref={ ref }>
				{ gates.map( ( gate, index ) => {
					const reorderGates = ( targetIndex: number ) => {
						const sortedGates = [ ...gates ];

						sortedGates.splice( index, 1 );
						sortedGates.splice( targetIndex, 0, gate );

						// Reindex priorities to avoid gaps and dupes.
						sortedGates.forEach( ( g, i ) => ( g.priority = i ) );

						// Only trigger the API request if the order has changed.
						if ( JSON.stringify( sortedGates ) !== JSON.stringify( gates ) ) {
							handleUpdateGatePriorities( sortedGates );
						}
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
										label:
											gate.status !== 'publish' ? __( 'Activate', 'newspack-plugin' ) : __( 'Deactivate', 'newspack-plugin' ),
										action: () => toggleStatus( gate.id ),
										disabled: isFetching,
									},
									{
										label: __( 'Delete', 'newspack-plugin' ),
										action: () => handleDelete( gate.id ),
										disabled: isFetching,
										destructive: true,
									},
								],
							} }
						>
							<CardBody>
								<ContentGateSettings gate={ gate } onDelete={ handleDelete } onSave={ handleSaveGate } />
							</CardBody>
						</Card>
					);
				} ) }
			</VStack>
		</>
	);
};
export default ContentGates;
