/**
 * Content Gate component.
 */

/**
 * WordPress dependencies.
 */
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Button, Card, Modal, SectionHeader, TextControl } from '../../../../../packages/components/src';
import WizardsActionCard from '../../../wizards-action-card';
import ContentGateSettings from './content-gate-settings';
import './style.scss';

const ContentGates = () => {
	const [ gates, setGates ] = useState< Gate[] >( [] );
	const [ showModal, setShowModal ] = useState( false );
	const [ newGateName, setNewGateName ] = useState( '' );
	const [ isInFlight, setIsInFlight ] = useState( false );

	const ref = useRef( null );

	useEffect( () => {
		if ( isInFlight ) {
			return;
		}
		setIsInFlight( true );
		apiFetch< Gate[] >( {
			path: '/newspack/v1/content-gate',
		} )
			.then( data => {
				data.sort( ( a, b ) => a.priority - b.priority );
				setGates( data );
			} )
			.catch( error => console.error( error ) ) // eslint-disable-line no-console
			.finally( () => setIsInFlight( false ) );
	}, [] );

	const handleCreateGate = () => {
		if ( isInFlight ) {
			return;
		}
		setIsInFlight( true );
		apiFetch< Gate >( {
			path: '/newspack/v1/content-gate',
			method: 'POST',
			data: {
				title: newGateName,
			},
		} )
			.then( data => {
				setGates( [ data, ...gates ] );
				setShowModal( false );
				setNewGateName( '' );
			} )
			.catch( error => console.error( error ) ) // eslint-disable-line no-console
			.finally( () => setIsInFlight( false ) );
	};

	const handleDeleteGate = ( id: number ) => {
		// eslint-disable-next-line no-alert
		if ( ! confirm( __( 'Are you sure you want to delete this content gate?', 'newspack-plugin' ) ) ) {
			return;
		}
		apiFetch( {
			path: `/newspack/v1/content-gate/${ id }`,
			method: 'DELETE',
		} )
			.then( () => setGates( gates.filter( g => g.id !== id ) ) )
			.catch( error => console.error( error ) ); // eslint-disable-line no-console
	};

	const handleUpdateGatePriorities = ( updates: Gate[] ) => {
		if ( isInFlight ) {
			return;
		}
		const oldGates = [ ...gates ];
		setGates( updates );
		setIsInFlight( true );
		apiFetch< Gate >( {
			path: '/newspack/v1/content-gate/priority',
			method: 'POST',
			data: {
				gates: updates,
			},
		} )
			.catch( error => {
				console.error( error ); // eslint-disable-line no-console
				setGates( oldGates );
			} )
			.finally( () => setIsInFlight( false ) );
	};

	return (
		<>
			<Card noBorder headerActions>
				<SectionHeader heading={ 1 } title={ __( 'Content Gates', 'newspack-plugin' ) } noMargin />
				<Button variant="secondary" onClick={ () => setShowModal( true ) }>
					{ __( 'Add Content Gate', 'newspack-plugin' ) }
				</Button>
				{ showModal && (
					<Modal isNarrow title={ __( 'Add Content Gate', 'newspack-plugin' ) } onRequestClose={ () => setShowModal( false ) }>
						<TextControl
							label={ __( 'Name', 'newspack-plugin' ) }
							placeholder={ __( 'Enter a name for the content gate', 'newspack-plugin' ) }
							onChange={ ( value: string ) => setNewGateName( value ) }
						/>
						<Card buttonsCard noBorder className="justify-end">
							<Button variant="primary" onClick={ handleCreateGate }>
								{ __( 'Add Content Gate', 'newspack-plugin' ) }
							</Button>
							<Button isDestructive variant="secondary" onClick={ () => setShowModal( false ) }>
								{ __( 'Cancel', 'newspack-plugin' ) }
							</Button>
						</Card>
					</Modal>
				) }
			</Card>
			{ gates.length === 0 && (
				<Card noBorder>
					<p>{ __( 'No content gates configured. Add a content gate to configure access rules.', 'newspack-plugin' ) }</p>
				</Card>
			) }
			<div ref={ ref }>
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
						<WizardsActionCard
							draggable
							expandable
							id={ gate.id }
							key={ gate.id }
							title={ gate.title }
							description={ gate.description }
							isMedium
							toggleChecked={ true }
							dragIndex={ index }
							dragWrapperRef={ ref }
							onDragCallback={ reorderGates }
							disabled={ isInFlight }
						>
							<ContentGateSettings value={ gate } onDelete={ handleDeleteGate } />
						</WizardsActionCard>
					);
				} ) }
			</div>
		</>
	);
};
export default ContentGates;
