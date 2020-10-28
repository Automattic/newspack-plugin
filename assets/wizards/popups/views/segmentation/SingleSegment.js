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
