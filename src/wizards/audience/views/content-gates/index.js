/**
 * Content gates management screen.
 */

import '../../../../shared/js/public-path';

/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies.
 */
import { Wizard, withWizard } from '../../../../../packages/components/src';
import ContentGates from './content-gates';
import Edit from './edit';
import { AUDIENCE_CONTENT_GATES_WIZARD_SLUG } from './consts';

const AudienceContentGates = ( props, ref ) => {
	return (
		<Wizard
			apiSlug={ AUDIENCE_CONTENT_GATES_WIZARD_SLUG }
			title={ __( 'Access Control', 'newspack-plugin' ) }
			description={ __( 'Configure content gating logic and appearance.', 'newspack-plugin' ) }
			headerText={ __( 'Audience Management / Access Control', 'newspack-plugin' ) }
			ref={ ref }
			sections={ [
				{
					label: __( 'Content Gates', 'newspack-plugin' ),
					path: '/content-gates',
					render: ContentGates,
				},
				{
					path: '/edit/:id',
					render: Edit,
					isHidden: true,
					exact: true,
				},
			] }
		/>
	);
};

export default withWizard( forwardRef( AudienceContentGates ) );
