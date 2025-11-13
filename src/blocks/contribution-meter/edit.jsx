/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useBlockProps } from '@wordpress/block-editor';
import { Placeholder, Spinner } from '@wordpress/components';
import { useEffect, useState, useMemo } from '@wordpress/element';
import { error as warning } from '@wordpress/icons';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import InspectorPanel from './components/InspectorPanel';
import LinearMeter from './components/LinearMeter';
import CircularMeter from './components/CircularMeter';
import { getDefaultStartDate } from './utils/helpers';

/**
 * Build CSS class names for the block wrapper.
 *
 * @param {string} style     Meter style.
 * @param {string} thickness Thickness size.
 * @return {string} Combined class names.
 */
const buildClassNames = ( style, thickness ) => {
	return [
		'wp-block-newspack-contribution-meter',
		`contribution-meter--${ style }`,
		`contribution-meter--thickness-${ thickness }`,
		'newspack-ui',
		'newspack-ui__font--s',
	].join( ' ' );
};

/**
 * Edit component for the Contribution Meter block.
 *
 * @param {Object}   props               Component props.
 * @param {Object}   props.attributes    Block attributes.
 * @param {Function} props.setAttributes Function to update attributes.
 * @return {Element} Edit component.
 */
const Edit = ( { attributes, setAttributes } ) => {
	const { meterStyle, goalAmount, startDate, progressBarColor, thickness, showGoal, showAmountRaised, showPercentage } = attributes;
	const [ contributionData, setContributionData ] = useState( null );
	const [ isLoading, setIsLoading ] = useState( true );
	const [ error, setError ] = useState( null );

	// Set default start date if not set.
	useEffect( () => {
		if ( ! startDate ) {
			setAttributes( { startDate: getDefaultStartDate() } );
		}
	}, [ startDate, setAttributes ] );

	// Fetch contribution data when startDate changes.
	useEffect( () => {
		if ( ! startDate ) {
			setIsLoading( false );
			return;
		}

		setIsLoading( true );
		setError( null );

		apiFetch( {
			path: '/newspack/v1/contribution-meter',
			method: 'POST',
			data: {
				startDate,
			},
		} )
			.then( data => {
				setContributionData( data );
				setIsLoading( false );
			} )
			.catch( err => {
				setError( err.message || __( 'Failed to load contribution data.', 'newspack-plugin' ) );
				setIsLoading( false );
			} );
	}, [ startDate ] );

	// Get values and calculate percentage.
	const amountRaised = contributionData?.amountRaised || 0;
	const percentage = useMemo( () => {
		if ( ! goalAmount || goalAmount <= 0 ) {
			return 0;
		}
		const percentageRaw = ( amountRaised / goalAmount ) * 100;
		return Math.floor( percentageRaw * 10 ) / 10;
	}, [ amountRaised, goalAmount ] );

	// Build CSS class names.
	const className = useMemo( () => buildClassNames( meterStyle, thickness ), [ meterStyle, thickness ] );

	const blockProps = useBlockProps( { className } );

	// Shared meter props.
	const meterProps = {
		amountRaised,
		goal: goalAmount,
		percentage,
		showGoal,
		showAmountRaised,
		showPercentage,
		progressBarColor,
		thickness,
	};

	return (
		<>
			<InspectorPanel attributes={ attributes } setAttributes={ setAttributes } />

			<div { ...blockProps }>
				{ isLoading && (
					<Placeholder className="contribution-meter-loading">
						<Spinner />
						{ __( 'Loading contribution data…', 'newspack-plugin' ) }
					</Placeholder>
				) }

				{ ! isLoading && error && (
					<Placeholder
						icon={ warning }
						label={ __( 'Error', 'newspack-plugin' ) }
						instructions={ error }
						className="contribution-meter-error"
					/>
				) }

				{ ! isLoading && ! error && (
					<>
						{ meterStyle === 'linear' && <LinearMeter { ...meterProps } /> }
						{ meterStyle === 'circular' && <CircularMeter { ...meterProps } /> }
					</>
				) }
			</div>
		</>
	);
};

export default Edit;
