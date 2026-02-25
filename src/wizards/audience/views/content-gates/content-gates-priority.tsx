/**
 * Content Gate component.
 */

/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
import { useMemo, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Button, Card, CardSortableList, Modal } from '../../../../../packages/components/src';
import { useWizardData } from '../../../../../packages/components/src/wizard/store/utils';
import { useWizardApiFetch } from '../../../hooks/use-wizard-api-fetch';
import { getGateStatus, getGateStatusBadgeLevel } from './utils';
import { AUDIENCE_CONTENT_GATES_WIZARD_SLUG } from './consts';

const ContentGatesPriority = ( { closeModal, updateGatesData }: { closeModal: () => void; updateGatesData: ( gates: Gate[] ) => void } ) => {
	const { gates = [] as Gate[] } = useWizardData( AUDIENCE_CONTENT_GATES_WIZARD_SLUG ) as WizardData;
	const { wizardApiFetch, isFetching, setError } = useWizardApiFetch( AUDIENCE_CONTENT_GATES_WIZARD_SLUG );
	const [ sortedGates, setSortedGates ] = useState< Gate[] >( gates );
	const gateItems = useMemo(
		() =>
			sortedGates.map( gate => ( {
				title: gate.title,
				badgeLevel: getGateStatusBadgeLevel( gate.status ) as 'success' | 'info' | 'warning' | 'error',
				badgeText: getGateStatus( gate.status ) as string,
			} ) ),
		[ sortedGates ]
	);

	const handleUpdateGatePriorities = ( updates: Gate[] ) => {
		if ( isFetching ) {
			return;
		}
		const oldGates = [ ...gates ];
		wizardApiFetch< Gate >(
			{
				path: `/newspack/v1/wizard/${ AUDIENCE_CONTENT_GATES_WIZARD_SLUG }/priority`,
				method: 'POST',
				data: {
					gates: updates.map( g => ( { id: g.id, priority: g.priority } ) ),
				},
			},
			{
				onSuccess: () => {
					updateGatesData( updates );
					closeModal();
				},
				onError: ( fetchError: WpFetchError ) => {
					setError( fetchError );
					updateGatesData( oldGates );
				},
			}
		);
	};

	const sortGates = ( index: number, targetIndex: number ) => {
		if ( isFetching ) {
			return;
		}

		const gate = sortedGates[ index as keyof typeof gates ];
		const _sortedGates = [ ...sortedGates ];

		// Remove the gate and drop it back into the array at the target index.
		_sortedGates.splice( index, 1 );
		_sortedGates.splice( targetIndex, 0, gate );

		// Reindex priorities to avoid gaps and dupes.
		_sortedGates.forEach( ( _gate, _index ) => ( _gate.priority = _index ) );
		setSortedGates( _sortedGates );
	};

	return (
		<Modal isMedium title={ __( 'Gate priority', 'newspack-plugin' ) } onRequestClose={ closeModal }>
			<p>
				{ __(
					'Gates are checked in this order. If content matches more than one gate, only the first matching gate will apply.',
					'newspack-plugin'
				) }
			</p>
			<CardSortableList isActive={ isFetching } items={ gateItems } onDragCallback={ sortGates } />
			<Card buttonsCard noBorder className="justify-end">
				<Button variant="tertiary" disabled={ isFetching } onClick={ closeModal }>
					{ __( 'Cancel', 'newspack-plugin' ) }
				</Button>
				<Button
					variant="primary"
					disabled={ isFetching || JSON.stringify( sortedGates ) === JSON.stringify( gates ) }
					onClick={ () => handleUpdateGatePriorities( sortedGates ) }
				>
					{ __( 'Save', 'newspack-plugin' ) }
				</Button>
			</Card>
		</Modal>
	);
};

export default ContentGatesPriority;
