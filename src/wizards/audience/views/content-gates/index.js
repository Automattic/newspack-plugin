/**
 * Content gates management screen.
 */

import '../../../../shared/js/public-path';

/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
import { forwardRef, useState } from '@wordpress/element';

/**
 * Internal dependencies.
 */
import { Wizard, withWizard } from '../../../../../packages/components/src';
import ContentGates from './content-gates';
import Edit from './edit';
import { AUDIENCE_CONTENT_GATES_WIZARD_SLUG, BASE_HEADER_TEXT } from './consts';

const AudienceContentGates = ( props, ref ) => {
	const [ headerText, setHeaderText ] = useState( BASE_HEADER_TEXT );
	return (
		<Wizard
			apiSlug={ AUDIENCE_CONTENT_GATES_WIZARD_SLUG }
			title={ __( 'Access Control', 'newspack-plugin' ) }
			headerText={ headerText }
			ref={ ref }
			sections={ [
				{
					label: __( 'Content Gates', 'newspack-plugin' ),
					path: '/content-gates',
					render: ContentGates,
					props: {
						setHeaderText,
					},
				},
				{
					path: '/edit/:id/:type?',
					render: Edit,
					isHidden: true,
					exact: true,
					props: {
						setHeaderText,
					},
				},
			] }
		/>
	);
};

export default withWizard( forwardRef( AudienceContentGates ) );
