/**
 * Content Gate component.
 */

/**
 * WordPress dependencies.
 */
import { RichText } from '@wordpress/block-editor';
import { CheckboxControl, DropdownMenu } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { ActionCard, Button, Card, Grid, Modal, SectionHeader, SelectControl, TextControl } from '../../../../../packages/components/src';
import WizardsActionCard from '../../../wizards-action-card';
import './style.scss';

const availableRules: AccessRules = {
	registration: {
		name: __( 'Registered Reader', 'newspack-plugin' ),
		description: __( 'The user must be logged into a reader account to access the content.', 'newspack-plugin' ),
	},
	subscription: {
		name: __( 'Has Active Subscription', 'newspack-plugin' ),
		description: __( 'The user must have an active subscription with one of the selected products.', 'newspack-plugin' ),
	},
};

const ContentGates = () => {
	const testGates: Gate[] = [
		{
			id: 1,
			title: 'Reg wall',
			description: 'Access rules: is registered reader',
			isActive: true,
			isMetered: true,
			limitAnonymous: 0,
			limitRegistered: 0,
			period: 'week',
			accessRules: [],
		},
	];

	const [ gates, setGates ] = useState( testGates );
	const [ showModal, setShowModal ] = useState( false );
	const [ newGateName, setNewGateName ] = useState( '' );

	const updateGate = (
		gateId: number,
		{
			isActive,
			isMetered,
			limitAnonymous,
			limitRegistered,
			period,
			title,
		}: {
			id?: number;
			isActive?: boolean;
			isMetered?: boolean;
			limitAnonymous?: number;
			limitRegistered?: number;
			period?: string;
			title?: string;
		}
	) => {
		setGates(
			gates.map( gate =>
				gate.id === gateId
					? {
							...gate,
							isActive: isActive ?? gate.isActive,
							isMetered: isMetered ?? gate.isMetered,
							limitAnonymous: limitAnonymous ?? gate.limitAnonymous,
							limitRegistered: limitRegistered ?? gate.limitRegistered,
							period: period ?? gate.period,
							title: title ?? gate.title,
					  }
					: gate
			)
		);
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
							<Button
								variant="primary"
								onClick={ () => {
									setGates( [
										...gates,
										{
											id: gates.length + 1,
											title: newGateName || __( 'Content Gate', 'newspack-plugin' ),
											description: __( 'Access rules: none configured', 'newspack-plugin' ),
											isActive: true,
											isMetered: false,
											limitAnonymous: 0,
											limitRegistered: 0,
											period: 'week',
											accessRules: [],
										},
									] );
									setNewGateName( '' );
									setShowModal( false );
								} }
							>
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
					hasGreyHeader={ gate.isActive }
					actionContent={
						<>
							{ gate.isActive && (
								<Button variant="primary" onClick={ () => {} }>
									{ __( 'Edit Appearance', 'newspack' ) }
								</Button>
							) }
							<Button isDestructive variant="secondary" onClick={ () => setGates( gates.filter( g => g.id !== gate.id ) ) }>
								{ __( 'Delete', 'newspack-plugin' ) }
							</Button>
						</>
					}
					toggleChecked={ gate.isActive }
					toggleOnChange={ () => updateGate( gate.id, { isActive: ! gate.isActive } ) }
				>
					{ gate.isActive && (
						<>
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
								{ gate.accessRules.length > 0 && (
									<Grid columns={ 3 } gutter={ 32 }>
										{ gate.accessRules.map( ( rule: AccessRule ) => (
											<div key={ rule.name }>
												<h4>{ rule.name }</h4>
												<p>{ rule.description }</p>
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
										controls={ [
											{
												title: __( 'Post types', 'newspack-plugin' ),
											},
											{
												title: __( 'Categories', 'newspack-plugin' ),
											},
											{
												title: __( 'Tags', 'newspack-plugin' ),
											},
										] }
									/>
								}
							>
								{ gate.accessRules.length > 0 && (
									<Grid columns={ 3 } gutter={ 32 }>
										{ gate.accessRules.map( rule => (
											<div key={ rule.name }>
												<h4>{ rule.name }</h4>
												<p>{ rule.description }</p>
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
										checked={ gate.isMetered }
										onChange={ () => updateGate( gate.id, { isMetered: ! gate.isMetered } ) }
									/>
								</Card>
								{ gate.isMetered && (
									<Grid columns={ 3 } gutter={ 32 }>
										<TextControl
											type={ 'number' }
											label={ __( 'Article limit for anonymous viewers', 'newspack-plugin' ) }
											help={ __(
												'Number of times an anonymous reader can view gated content. If set to 0, anonymous readers will always render the gate.',
												'newspack-plugin'
											) }
											value={ gate.limitAnonymous }
											onChange={ ( value: number ) => updateGate( gate.id, { limitAnonymous: value } ) }
										/>
										<TextControl
											type={ 'number' }
											label={ __( 'Article limit for registered viewers', 'newspack-plugin' ) }
											help={ __(
												'Number of times a registered reader can view gated content. If set to 0, registered readers will always render the gate.',
												'newspack-plugin'
											) }
											value={ gate.limitRegistered }
											onChange={ ( value: number ) => updateGate( gate.id, { limitRegistered: value } ) }
										/>
										<SelectControl
											type={ 'select' }
											label={ __( 'Time period', 'newspack-plugin' ) }
											help={ __(
												'The time period during which the metering views will be counted. For example, if the metering period is set to "Weekly", the metering views will be reset every week.',
												'newspack-plugin'
											) }
											value={ gate.period }
											onChange={ ( value: string ) => updateGate( gate.id, { period: value } ) }
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
						</>
					) }
				</WizardsActionCard>
			) ) }
		</>
	);
};
export default ContentGates;
