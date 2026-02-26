/**
 * Content Gate component.
 */

/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
import { __experimentalVStack as VStack } from '@wordpress/components'; // eslint-disable-line @wordpress/no-unsafe-wp-apis
import { useDispatch } from '@wordpress/data';
import { useEffect, useRef, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Notice } from '../../../../../packages/components/src';
import { useWizardData } from '../../../../../packages/components/src/wizard/store/utils';
import { useWizardApiFetch } from '../../../hooks/use-wizard-api-fetch';
import { WIZARD_STORE_NAMESPACE } from '../../../../../packages/components/src/wizard/store';
import ContentGatesOnboarding from './content-gates-onboarding';
import ContentGatesPriority from './content-gates-priority';
import ContentGateSettings from './content-gate-settings';
import { AUDIENCE_CONTENT_GATES_WIZARD_SLUG } from './consts';
import './style.scss';

const ContentGates = ( { updateGatesData }: { updateGatesData: ( gates: Gate[] ) => void } ) => {
	const wizardData = useWizardData( AUDIENCE_CONTENT_GATES_WIZARD_SLUG ) as WizardData;
	const { isFetching, error, errorMessage } = useWizardApiFetch( AUDIENCE_CONTENT_GATES_WIZARD_SLUG );
	const { resetHeaderData, setHeaderData } = useDispatch( WIZARD_STORE_NAMESPACE );
	const [ showPriorityModal, setShowPriorityModal ] = useState( false );
	const ref = useRef( null );
	const gates = ( wizardData?.gates || [] ) as Gate[];

	useEffect( () => {
		if ( isFetching ) {
			return;
		}
		if ( ! gates?.length ) {
			resetHeaderData();
			return;
		}
		setHeaderData( {
			sectionTitle: __( 'Access control', 'newspack-plugin' ),
			sectionDescription: __(
				'Set up gates to manage what content readers can access across your site. Start by selecting which content to restrict, then configure access through registered and/or paid options (including metered rules).',
				'newspack-plugin'
			),
			sectionPrimaryAction: {
				label: __( 'Add new content gate', 'newspack-plugin' ),
				href: '#/edit/new/all',
			},
			sectionSecondaryAction:
				gates.length > 1
					? {
							label: __( 'Gate priority', 'newspack-plugin' ),
							action: () => setShowPriorityModal( true ),
					  }
					: undefined,
		} );
	}, [ isFetching, gates ] );

	if ( ! gates?.length ) {
		return <ContentGatesOnboarding />;
	}

	return (
		<>
			{ error && <Notice isError noticeText={ errorMessage } /> }
			<ContentGatesPriority
				showModal={ showPriorityModal }
				closeModal={ () => setShowPriorityModal( false ) }
				updateGatesData={ updateGatesData }
			/>
			<VStack className="newspack-content-gates__gates" spacing="16px" ref={ ref }>
				{ gates.map( gate => {
					return <ContentGateSettings key={ gate.id } gate={ gate } updateGatesData={ updateGatesData } />;
				} ) }
			</VStack>
		</>
	);
};
export default ContentGates;
