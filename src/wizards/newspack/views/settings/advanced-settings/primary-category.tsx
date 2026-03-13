/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
import { ToggleControl } from '@wordpress/components';

type PrimaryCategoryData = {
	enabled: boolean;
	yoast_active: boolean;
};

type PrimaryCategoryProps = {
	data: PrimaryCategoryData;
	isFetching: boolean;
	update: ( data: Partial< PrimaryCategoryData > ) => void;
};

export default function PrimaryCategory( { data, isFetching, update }: PrimaryCategoryProps ) {
	if ( ! data.yoast_active ) {
		return null;
	}

	return (
		<ToggleControl
			label={ __( 'Use Yoast primary category', 'newspack-plugin' ) }
			help={ __(
				'When enabled, only the primary category set in Yoast SEO is displayed on posts. Disable to show all categories.',
				'newspack-plugin'
			) }
			disabled={ isFetching }
			checked={ data.enabled }
			onChange={ enabled => update( { enabled } ) }
		/>
	);
}
