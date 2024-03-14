/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { CheckboxControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { Grid, SectionHeader, TextControl } from '../../../components/src';

const MetadataFields = ( { availableFields, getSharedProps, selectedFields, updateConfig } ) => {
	return (
		<>
			<SectionHeader
				title={ __( 'Metadata field settings', 'newspack-plugin' ) }
				description={ __( 'Select which data to sync for each contact.', 'newspack-plugin' ) }
			/>
			<Grid columns={ 3 } rowGap={ 16 }>
				{ Object.keys( availableFields ).map( fieldKey => (
					<CheckboxControl
						key={ fieldKey }
						label={ availableFields[ fieldKey ] }
						checked={ selectedFields.includes( fieldKey ) }
						onChange={ value => {
							const newFields = [ ...selectedFields ];
							updateConfig(
								'metadata_fields',
								value
									? [ ...newFields, fieldKey ]
									: newFields.filter( selectedField => selectedField !== fieldKey )
							);
						} }
					/>
				) ) }
			</Grid>
			<TextControl
				label={ __( 'Metadata field prefix', 'newspack-plugin' ) }
				help={ __(
					'A string to prefix metadata fields attached to each contact synced to the ESP. Required to ensure that metadata field names are unique. Default: NP_',
					'newspack-plugin'
				) }
				{ ...getSharedProps( 'metadata_prefix', 'text' ) }
			/>
		</>
	);
};

export default MetadataFields;
