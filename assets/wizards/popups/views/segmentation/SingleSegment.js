/**
 * WordPress dependencies.
 */
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { find } from 'lodash';

/**
 * Internal dependencies.
 */
import { Button, TextControl, CheckboxControl, Router } from '../../../../components/src';

const { NavLink, useHistory } = Router;

const SegmentSettingSection = ( { title, children } ) => (
	<div className="newspack-campaigns-wizard-segments__section">
		<h3>{ title }</h3>
		<div className="newspack-campaigns-wizard-segments__section__content">{ children }</div>
	</div>
);

const SegmentsList = ( { segmentId, wizardApiFetch } ) => {
	const [ name, setName ] = useState( '' );
	const [ min_posts, setMinPosts ] = useState( 0 );
	const [ max_posts, setMaxPosts ] = useState( 0 );
	const [ is_subscribed, setIsSubscribed ] = useState( false );
	const [ is_donor, setIsDonor ] = useState( false );
	const [ is_not_subscribed, setIsNotSubscribed ] = useState( false );
	const [ is_not_donor, setIsNotDonor ] = useState( false );
	const history = useHistory();

	const isSegmentValid = name.length > 0;

	const isNew = segmentId === 'new';
	useEffect( () => {
		if ( ! isNew ) {
			wizardApiFetch( {
				path: `/newspack/v1/wizard/newspack-popups-wizard/segmentation`,
			} ).then( segments => {
				const foundSegment = find( segments, ( { id } ) => id === segmentId );
				if ( foundSegment ) {
					setName( foundSegment.name );
					setMinPosts( foundSegment.configuration.min_posts );
					setMaxPosts( foundSegment.configuration.max_posts );
					setIsSubscribed( foundSegment.configuration.is_subscribed );
					setIsDonor( foundSegment.configuration.is_donor );
					setIsNotSubscribed( foundSegment.configuration.is_not_subscribed );
					setIsNotDonor( foundSegment.configuration.is_not_donor );
				}
			} );
		}
	}, [ isNew ] );

	const saveSegment = () => {
		const path = isNew
			? `/newspack/v1/wizard/newspack-popups-wizard/segmentation`
			: `/newspack/v1/wizard/newspack-popups-wizard/segmentation/${ segmentId }`;
		wizardApiFetch( {
			path,
			method: 'POST',
			data: {
				name,
				configuration: {
					min_posts,
					max_posts,
					is_subscribed,
					is_donor,
					is_not_subscribed,
					is_not_donor,
				},
			},
		} ).then( () => history.push( '/segmentation' ) );
	};

	return (
		<div>
			<TextControl
				placeholder={ __( 'Untitled Segment', 'newspack' ) }
				value={ name }
				onChange={ setName }
			/>
			<div className="newspack-campaigns-wizard-segments__sections-wrapper">
				<SegmentSettingSection title={ __( 'Number of articles read', 'newspack' ) }>
					<div>
						<CheckboxControl
							checked={ min_posts > 0 }
							onChange={ value => setMinPosts( value ? 1 : 0 ) }
							label={ __( 'Min.', 'newspack' ) }
						/>
						<TextControl
							placeholder={ __( 'Min. posts', 'newspack' ) }
							type="number"
							value={ min_posts }
							onChange={ setMinPosts }
						/>
					</div>
					<div>
						<CheckboxControl
							checked={ max_posts > 0 }
							onChange={ value => setMaxPosts( value ? 1 : 0 ) }
							label={ __( 'Max.', 'newspack' ) }
						/>
						<TextControl
							placeholder={ __( 'Max. posts', 'newspack' ) }
							type="number"
							value={ max_posts }
							onChange={ setMaxPosts }
						/>
					</div>
				</SegmentSettingSection>
				<SegmentSettingSection title={ __( 'Newsletter', 'newspack' ) }>
					<CheckboxControl
						checked={ is_subscribed }
						onChange={ setIsSubscribed }
						label={ __( 'Is subscribed to newsletter', 'newspack' ) }
					/>
					<CheckboxControl
						checked={ is_not_subscribed }
						onChange={ setIsNotSubscribed }
						label={ __( 'Is not subscribed to newsletter', 'newspack' ) }
					/>
				</SegmentSettingSection>
				<SegmentSettingSection title={ __( 'Donation', 'newspack' ) }>
					<CheckboxControl
						checked={ is_donor }
						onChange={ setIsDonor }
						label={ __( 'Has donated', 'newspack' ) }
					/>
					<CheckboxControl
						checked={ is_not_donor }
						onChange={ setIsNotDonor }
						label={ __( "Hasn't donated", 'newspack' ) }
					/>
				</SegmentSettingSection>
			</div>
			<div className="newspack-buttons-card">
				<div>
					<NavLink to="/segmentation">
						<Button>{ __( 'Cancel', 'newspack' ) }</Button>
					</NavLink>
					<Button disabled={ ! isSegmentValid } isPrimary onClick={ saveSegment }>
						{ __( 'Save', 'newspack' ) }
					</Button>
				</div>
			</div>
		</div>
	);
};

export default SegmentsList;
