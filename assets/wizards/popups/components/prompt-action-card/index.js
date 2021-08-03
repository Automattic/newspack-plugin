/**
 * Prompt Action Card
 */

/**
 * WordPress dependencies.
 */
import apiFetch from '@wordpress/api-fetch';
import { sprintf, __ } from '@wordpress/i18n';
import { useEffect, useState, Fragment } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { moreVertical, settings } from '@wordpress/icons';

/**
 * Internal dependencies.
 */
import {
	ActionCard,
	InfoButton,
	Button,
	Card,
	Modal,
	Notice,
	TextControl,
	Waiting,
} from '../../../../components/src';
import PrimaryPromptPopover from '../prompt-popovers/primary';
import PromptSettingsModal from '../settings-modal';
import { placementForPopup } from '../../utils';
import './style.scss';

const AnalyticsDataItem = ( { value, description } ) => (
	<div className="newspack-popups-wizard__analytics-data--value">
		<strong>{ value }%</strong>
		<small>{ description }</small>
	</div>
);

const AnalyticsData = ( { error, id, analyticsData } ) => {
	if ( error ) {
		return (
			<InfoButton
				className="newspack-popups-wizard__analytics-data--icon"
				text={ __( 'Could not fetch Analytics data', 'newspack' ) }
			/>
		);
	}
	if ( ! analyticsData ) {
		return (
			<div className="newspack-popups-wizard__analytics-data--icon">
				<Waiting />
			</div>
		);
	}
	const { seen, load, form_submission } = analyticsData[ id ] || {};
	if ( ! seen || ! load ) {
		return (
			<InfoButton
				className="newspack-popups-wizard__analytics-data--icon"
				text={ __( 'No Analytics data', 'newspack' ) }
			/>
		);
	}
	const viewability = Math.min( 100, Math.round( ( seen / load ) * 100 ) );
	const renderViewability = () => (
		<AnalyticsDataItem value={ viewability } description={ __( 'viewability', 'newspack' ) } />
	);
	if ( form_submission ) {
		const conversionRate = Math.min( 100, Math.round( ( form_submission / seen ) * 100 ) );
		return (
			<>
				<AnalyticsDataItem
					value={ conversionRate }
					description={ __( 'conversion rate', 'newspack' ) }
				/>
				{ renderViewability() }
			</>
		);
	}
	return renderViewability();
};

const PromptActionCard = props => {
	const [ isSettingsModalVisible, setIsSettingsModalVisible ] = useState( false );
	const [ popoverVisibility, setPopoverVisibility ] = useState( false );
	const [ isDuplicatePromptModalVisible, setIsDuplicatePromptModalVisible ] = useState( false );
	const [ duplicateTitle, setDuplicateTitle ] = useState( null );

	const {
		className,
		description,
		duplicated,
		duplicatePopup,
		inFlight,
		resetDuplicated,
		prompt = {},
		segments,
		warning,
		promptsAnalyticsData,
	} = props;
	const { campaign_groups: campaignGroups, id, edit_link: editLink, title } = prompt;

	useEffect( () => {
		if ( isDuplicatePromptModalVisible && ! duplicateTitle ) {
			getDefaultDupicateTitle();
		}
	}, [ isDuplicatePromptModalVisible ] );

	const getDefaultDupicateTitle = async () => {
		const promptToDuplicate = parseInt( prompt?.duplicate_of || prompt.id );
		try {
			const defaultTitle = await apiFetch( {
				path: `/newspack/v1/wizard/newspack-popups-wizard/${ promptToDuplicate }/duplicate`,
			} );

			setDuplicateTitle( defaultTitle );
		} catch ( e ) {
			setDuplicateTitle( title + __( ' copy', 'newspack-popups' ) );
		}
	};

	return (
		<>
			<ActionCard
				isSmall
				badge={ placementForPopup( prompt ) }
				className={ className }
				title={ title.length ? decodeEntities( title ) : __( '(no title)', 'newspack' ) }
				titleLink={ decodeEntities( editLink ) }
				key={ id }
				description={ description }
				notification={ warning }
				notificationLevel="error"
				actionText={
					<>
						<AnalyticsData
							error={ promptsAnalyticsData?.error }
							analyticsData={ promptsAnalyticsData }
							id={ prompt.id }
						/>
						<div className="newspack-popups-wizard__buttons">
							<Button
								isQuaternary
								isSmall
								className={ isSettingsModalVisible && 'popover-active' }
								onClick={ () => setIsSettingsModalVisible( ! isSettingsModalVisible ) }
								icon={ settings }
								label={ __( 'Prompt settings', 'newspack' ) }
								tooltipPosition="bottom center"
							/>
							<Button
								isQuaternary
								isSmall
								className={ popoverVisibility && 'popover-active' }
								onClick={ () => setPopoverVisibility( ! popoverVisibility ) }
								icon={ moreVertical }
								label={ __( 'More options', 'newspack' ) }
								tooltipPosition="bottom center"
							/>
							{ popoverVisibility && (
								<PrimaryPromptPopover
									onFocusOutside={ () => setPopoverVisibility( false ) }
									prompt={ prompt }
									setIsDuplicatePromptModalVisible={ setIsDuplicatePromptModalVisible }
									{ ...props }
								/>
							) }
						</div>
					</>
				}
			/>
			{ isSettingsModalVisible && (
				<PromptSettingsModal
					prompt={ prompt }
					disabled={ inFlight }
					onClose={ () => setIsSettingsModalVisible( false ) }
					segments={ segments }
					updatePopup={ props.updatePopup }
				/>
			) }
			{ isDuplicatePromptModalVisible && (
				<Modal
					className="newspack-popups__duplicate-modal"
					title={ sprintf( __( 'Duplicate “%s”', 'newspack' ), title ) }
					onRequestClose={ () => {
						setIsDuplicatePromptModalVisible( false );
						setDuplicateTitle( null );
						resetDuplicated();
					} }
				>
					{ duplicated ? (
						<>
							<Notice
								isSuccess
								noticeText={ sprintf(
									__( 'Duplicate of “%s” created as a draft.', 'newspack' ),
									title
								) }
							/>
							{ ! campaignGroups && (
								<Notice
									isWarning
									noticeText={ __(
										'This prompt is currently not assigned to any campaign.',
										'newspack'
									) }
								/>
							) }
							<Card buttonsCard noBorder className="justify-end">
								<Button
									isSecondary
									onClick={ () => {
										setIsDuplicatePromptModalVisible( false );
										setDuplicateTitle( null );
										resetDuplicated();
									} }
								>
									{ __( 'Close', 'newspack' ) }
								</Button>
								<Button isPrimary href={ `/wp-admin/post.php?post=${ duplicated }&action=edit` }>
									{ __( 'Edit', 'newspack' ) }
								</Button>
							</Card>
						</>
					) : (
						<>
							{ ! campaignGroups && (
								<Notice
									isWarning
									noticeText={ __(
										'This prompt will not be assigned to any campaign.',
										'newspack'
									) }
								/>
							) }
							<TextControl
								disabled={ inFlight || null === duplicateTitle }
								label={ __( 'Title', 'newspack' ) }
								value={ duplicateTitle }
								onChange={ value => setDuplicateTitle( value ) }
							/>
							<Card buttonsCard noBorder className="justify-end">
								<Button
									disabled={ inFlight }
									isSecondary
									onClick={ () => {
										setIsDuplicatePromptModalVisible( false );
										setDuplicateTitle( null );
										resetDuplicated();
									} }
								>
									{ __( 'Cancel', 'newspack' ) }
								</Button>
								<Button
									disabled={ inFlight || null === duplicateTitle }
									isPrimary
									onClick={ () => {
										const titleForDuplicate = duplicateTitle.trim() || getDefaultDupicateTitle();
										duplicatePopup( id, titleForDuplicate );
									} }
								>
									{ __( 'Duplicate', 'newspack' ) }
								</Button>
							</Card>
						</>
					) }
				</Modal>
			) }
		</>
	);
};
export default PromptActionCard;
