/* global newspackAudienceContentGates */

/**
 * Content Gate component.
 */

/**
 * WordPress dependencies.
 */
import apiFetch from '@wordpress/api-fetch';
import { RichText } from '@wordpress/block-editor';
import { CheckboxControl, DropdownMenu } from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { ActionCard, Button, Card, Grid, Modal, SectionHeader, SelectControl, TextControl } from '../../../../../packages/components/src';
import WizardsActionCard from '../../../wizards-action-card';
import './style.scss';
import ContentRuleControl from './content-rule-control';

const availableRules = window.newspackAudienceContentGates.available_rules || [];
const availableContentRules = window.newspackAudienceContentGates.content_rules || [];

const ContentGates = () => {
	const [ gates, setGates ] = useState< Gate[] >( [] );
	const [ showModal, setShowModal ] = useState( false );
	const [ newGateName, setNewGateName ] = useState( '' );

	useEffect( () => {
		apiFetch< Gate[] >( {
			path: '/newspack/v1/content-gate',
		} )
			.then( data => {
				setGates( data );
			} )
			.catch( error => console.error( error ) ); // eslint-disable-line no-console
	}, [] );

	const handleCreateGate = () => () => {
		apiFetch< Gate >( {
			path: '/newspack/v1/content-gate',
			method: 'POST',
			data: {
				title: newGateName,
			},
		} )
			.then( data => {
				setGates( [ data, ...gates ] );
			} )
			.catch( error => console.error( error ) ); // eslint-disable-line no-console
	};

	const handleDeleteGate = ( id: number ) => () => {
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

	const updateGate = ( id: number, data: Partial< Gate > ) => {
		setGates( prevGates => prevGates.map( g => ( g.id === id ? { ...g, ...data } : g ) ) );
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
			{ gates.map( gate => (
				<WizardsActionCard
					key={ gate.id }
					title={
						<RichText
							className="newspack-content-gates__title"
							value={ gate.title }
							allowedFormats={ [] }
							placeholder={ __( 'Content gate name', 'newspack-plugin' ) }
							onChange={ ( value: string ) => updateGate( gate.id, { title: value } ) }
							tagName="h4"
							disableLineBreaks
							withoutInteractiveFormatting
							onClick={ ( e: React.ChangeEvent< HTMLInputElement > ) => e.stopPropagation() }
						/>
					}
					description={ gate.description }
					isMedium
					hasGreyHeader={ true }
					actionContent={
						<>
							<Button variant="primary" onClick={ () => {} }>
								{ __( 'Edit Appearance', 'newspack' ) }
							</Button>
							<Button isDestructive variant="secondary" onClick={ handleDeleteGate( gate.id ) }>
								{ __( 'Delete', 'newspack-plugin' ) }
							</Button>
						</>
					}
					toggleChecked={ true }
				>
					<ActionCard
						title={ __( 'Access Rules', 'newspack-plugin' ) }
						description={ __( 'Configure how readers can bypass this content gate.', 'newspack-plugin' ) }
						hasWhiteHeader={ true }
						noBorder={ true }
						noMargin={ true }
						actionContent={
							<DropdownMenu
								icon="plus"
								toggleProps={ {
									iconSize: 16,
								} }
								text={ __( 'Add Rule', 'newspack-plugin' ) }
								label={ __( 'Add Rule', 'newspack-plugin' ) }
								controls={ Object.keys( availableRules ).map( ( slug: string ) => ( {
									title: availableRules[ slug ].name,
									onClick: null, // TODO: Add selected access rule.
									isDisabled: false, // TODO: Add conflict check.
								} ) ) }
							/>
						}
					>
						{ gate.access_rules.length > 0 && (
							<Grid columns={ 3 } gutter={ 32 }>
								{ gate.access_rules.map( rule => (
									<div key={ rule.slug }>
										<h4>{ rule.slug }</h4>
									</div>
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
							<DropdownMenu
								icon="plus"
								toggleProps={ {
									iconSize: 16,
								} }
								text={ __( 'Add Rule', 'newspack-plugin' ) }
								label={ __( 'Add Rule', 'newspack-plugin' ) }
								controls={ Object.keys( availableContentRules ).map( ( slug: string ) => ( {
									title: availableContentRules[ slug ].label,
									onClick: null, // TODO: Add selected content rule.
									isDisabled: false, // TODO: Add conflict check.
								} ) ) }
							/>
						}
					>
						{ gate.content_rules.length > 0 && (
							<Grid columns={ 3 } gutter={ 32 }>
								{ gate.content_rules.map( rule => (
									<div key={ rule.slug }>
										<h4>{ rule.slug }</h4>
									</div>
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
								onChange={ () => updateGate( gate.id, { metering: { ...gate.metering, enabled: ! gate.metering.enabled } } ) }
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
									onChange={ ( value: number ) =>
										updateGate( gate.id, { metering: { ...gate.metering, anonymous_count: value } } )
									}
								/>
								<TextControl
									type={ 'number' }
									label={ __( 'Article limit for registered viewers', 'newspack-plugin' ) }
									help={ __(
										'Number of times a registered reader can view gated content. If set to 0, registered readers will always render the gate.',
										'newspack-plugin'
									) }
									value={ gate.metering.registered_count }
									onChange={ ( value: number ) =>
										updateGate( gate.id, { metering: { ...gate.metering, registered_count: value } } )
									}
								/>
								<SelectControl
									type={ 'select' }
									label={ __( 'Time period', 'newspack-plugin' ) }
									help={ __(
										'The time period during which the metering views will be counted. For example, if the metering period is set to "Weekly", the metering views will be reset every week.',
										'newspack-plugin'
									) }
									value={ gate.metering.period }
									onChange={ ( value: string ) => updateGate( gate.id, { metering: { ...gate.metering, period: value } } ) }
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
				</WizardsActionCard>
			) ) }
		</>
	);
};
export default ContentGates;
