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
	const [ active, setActive ] = useState( false );
	const [ limitAnonymous, setLimitAnonymous ] = useState( 0 );
	const [ limitRegistered, setLimitRegistered ] = useState( 0 );
	const [ period, setPeriod ] = useState( 'week' );

	return (
		<WizardsActionCard
			isMedium
			title={ __( 'Primary Content Gate', 'newspack' ) }
			description={ __( 'Configure the content gate that is rendered for all content.', 'newspack-plugin' ) }
			toggleChecked={ active }
			hasGreyHeader={ active }
			toggleOnChange={ () => setActive( ! active ) }
			actionContent={
				<Button variant="primary" onClick={ () => {} }>
					{ __( 'Edit Content Gate', 'newspack' ) }
				</Button>
			}
		>
			<Grid columns={ 3 } gutter={ 32 }>
				<TextControl
					type={ 'number' }
					label={ __( 'Article limit for anonymous viewers', 'newspack-plugin' ) }
					help={ __(
						'Number of times an anonymous reader can view gated content. If set to 0, anonymous readers will always render the gate.',
						'newspack-plugin'
					) }
					value={ limitAnonymous }
					onChange={ ( value: number ) => setLimitAnonymous( value ) }
				/>
				<TextControl
					type={ 'number' }
					label={ __( 'Article limit for registered viewers', 'newspack-plugin' ) }
					help={ __(
						'Number of times a registered reader can view gated content. If set to 0, registered readers will always render the gate.',
						'newspack-plugin'
					) }
					value={ limitRegistered }
					onChange={ ( value: number ) => setLimitRegistered( value ) }
				/>
				<SelectControl
					type={ 'select' }
					label={ __( 'Time period', 'newspack-plugin' ) }
					help={ __(
						'The time period during which the metering views will be counted. For example, if the metering period is set to "Weekly", the metering views will be reset every week.',
						'newspack-plugin'
					) }
					value={ period }
					onChange={ ( value: string ) => setPeriod( value ) }
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
		</WizardsActionCard>
	);
};
export default ContentGates;
