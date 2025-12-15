/**
 * Content gates management screen.
 */

import '../../../../shared/js/public-path';

/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
import { forwardRef, useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies.
 */
import { Wizard, withWizard } from '../../../../../packages/components/src';
import { useWizardData } from '../../../../../packages/components/src/wizard/store/utils';
import ContentGates from './content-gates';
import { AUDIENCE_CONTENT_GATES_WIZARD_SLUG } from './consts';

const AudienceContentGates = ( props, ref ) => {
	const wizardData = useWizardData( 'newspack-audience-content-gates' );
	const [ hasCompletedInitialFetch, setHasCompletedInitialFetch ] = useState( false );

	useEffect( () => {
		if ( Array.isArray( wizardData ) && ! hasCompletedInitialFetch ) {
			setHasCompletedInitialFetch( true );
			return;
		}
		if ( wizardData?.error ) {
			console.error( wizardData.error ); // eslint-disable-line no-console
		}
	}, [ wizardData, hasCompletedInitialFetch ] );

	return (
		<Wizard
			apiSlug={ AUDIENCE_CONTENT_GATES_WIZARD_SLUG }
			title={ __( 'Content Gating', 'newspack-plugin' ) }
			description={ __( 'Configure content gating logic and appearance.', 'newspack-plugin' ) }
			headerText={ __( 'Audience Management / Content Gates', 'newspack-plugin' ) }
			ref={ ref }
			sections={ [
				{
					label: __( 'Content Gate', 'newspack-plugin' ),
					path: '/content-gates',
					render: ContentGates,
				},
			] }
		/>
	);
};

export default withWizard( forwardRef( AudienceContentGates ) );
