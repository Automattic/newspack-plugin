/**
 * Content Gate component.
 */

/**
 * WordPress dependencies.
 */
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Button, Grid, SelectControl, TextControl } from '../../../../../packages/components/src';
import WizardsActionCard from '../../../wizards-action-card';
import './style.scss';

const ContentGates = () => {
	const testGates = [
		{
			id: 1,
			title: 'Reg wall',
			description: 'Shown to anonymous readers',
			content: 'This is a test gate content',
			isActive: true,
			limitAnonymous: 0,
			limitRegistered: 0,
			period: 'week',
		},
	];

	const [ gates, setGates ] = useState( testGates );

	const updateGate = (
		gateId: number,
		{
			isActive,
			limitAnonymous,
			limitRegistered,
			period,
		}: { isActive?: boolean; limitAnonymous?: number; limitRegistered?: number; period?: string }
	) => {
		setGates(
			gates.map( gate =>
				gate.id === gateId
					? {
							...gate,
							isActive: isActive ?? gate.isActive,
							limitAnonymous: limitAnonymous ?? gate.limitAnonymous,
							limitRegistered: limitRegistered ?? gate.limitRegistered,
							period: period ?? gate.period,
					  }
					: gate
			)
		);
	};

	return (
		<>
			<Button variant="primary" onClick={ () => {} }>
				{ __( 'Add Content Gate', 'newspack-plugin' ) }
			</Button>
			{ gates.map( gate => (
				<WizardsActionCard
					key={ gate.id }
					title={ gate.title }
					description={ gate.description }
					isMedium
					hasGreyHeader={ gate.isActive }
					actionContent={
						gate.isActive && (
							<Button variant="primary" onClick={ () => {} }>
								{ __( 'Edit Appearance', 'newspack' ) }
							</Button>
						)
					}
					toggleChecked={ gate.isActive }
					toggleOnChange={ () => updateGate( gate.id, { isActive: ! gate.isActive } ) }
				>
					{ gate.isActive && (
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
				</WizardsActionCard>
			) ) }
		</>
	);
};
export default ContentGates;
