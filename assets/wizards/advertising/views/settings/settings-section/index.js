/**
 * Ads Settings Section.
 */

/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	ActionCard,
	Grid,
	Button,
	TextControl,
	CheckboxControl,
	SelectControl,
} from '../../../../../components/src';

const SettingsSection = props => {
	const section = props.settings.find( setting => ! setting.key || setting.key === 'active' );
	if ( ! section ) {
		return null;
	}
	const activation = props.settings.find( setting => setting.key === 'active' );
	const settings = props.settings.filter( setting => setting.key && setting.key !== 'active' );
	const getControlProps = setting => ( {
		label: setting.description,
		help: setting.help || null,
		options:
			setting.options?.map( option => ( {
				value: option.value,
				label: option.name,
			} ) ) || null,
		value: setting.value,
		checked: setting.type === 'boolean' ? !! setting.value : null,
		onChange: value => {
			props.onChange( setting.key, value );
		},
	} );
	return (
		<ActionCard
			isMedium
			title={ section.description }
			description={ section.help }
			toggleChecked={ activation ? activation.value : null }
			hasGreyHeader={ !! activation }
			toggleOnChange={ value => props.onUpdate( { [ activation.key ]: value } ) }
		>
			{ ( ! activation || activation.value ) && (
				<Fragment>
					<Grid columns={ settings.length === 3 ? 3 : 2 } gutter={ 32 }>
						{ settings.map( setting => {
							switch ( setting.type ) {
								case 'int':
								case 'float':
									return (
										<TextControl
											key={ setting.key }
											type="number"
											{ ...getControlProps( setting ) }
										/>
									);
								case 'string':
								case 'text':
									return (
										<TextControl
											key={ setting.key }
											type="text"
											{ ...getControlProps( setting ) }
										/>
									);
								case 'select':
									return <SelectControl key={ setting.key } { ...getControlProps( setting ) } />;
								case 'boolean':
									return <CheckboxControl key={ setting.key } { ...getControlProps( setting ) } />;
							}
							return null;
						} ) }
					</Grid>
					<div className="newspack-buttons-card" style={ { margin: '32px 0 0' } }>
						<Button
							isPrimary
							onClick={ () => {
								props.onUpdate();
							} }
						>
							{ __( 'Save settings', 'newspack' ) }
						</Button>
					</div>
				</Fragment>
			) }
		</ActionCard>
	);
};

export default SettingsSection;
