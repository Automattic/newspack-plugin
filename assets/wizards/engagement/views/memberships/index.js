/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { Spinner } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { Card, Notice, SectionHeader, withWizardScreen } from '../../../../components/src';

export default withWizardScreen( () => {
	const [ inFlight, setInFlight ] = useState( false );
	const [ config, setConfig ] = useState( {} );
	const [ error, setError ] = useState( false );
	const fetchConfig = () => {
		setError( false );
		setInFlight( true );
		apiFetch( {
			path: '/newspack/v1/wizard/newspack-engagement-wizard/memberships',
		} )
			.then( res => {
				setConfig( res.config );
			} )
			.catch( setError )
			.finally( () => setInFlight( false ) );
	};
	useEffect( fetchConfig, [] );

	if ( ! config && inFlight ) {
		return <Spinner />;
	}

	return (
		<>
			{ error && (
				<Notice
					noticeText={ error?.message || __( 'Something went wrong.', 'newspack' ) }
					isError
				/>
			) }
			<Card noBorder>
				<SectionHeader
					title={ __( 'Content Gate', 'newspack' ) }
					description={ __(
						'Set up a custom gate to be rendered on restricted content.',
						'newspack'
					) }
				/>
				{ config.gate_status === false && (
					<>
						<p> { __( 'No gate is currently set up.', 'newspack' ) } </p>
					</>
				) }
				<p>
					<a className="button button-secondary" href={ config.edit_gate_url }>
						{ __( 'Configure gate', 'newspack' ) }
					</a>
				</p>
			</Card>
		</>
	);
} );
