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
import { ActionCard, Button, Card, Modal, Notice, TextControl } from '../../../../components/src';
import PrimaryPromptPopover from '../prompt-popovers/primary';
import SecondaryPromptPopover from '../prompt-popovers/secondary';
import { placementForPopup } from '../../utils';
import './style.scss';

const PromptActionCard = props => {
	const [ categoriesVisibility, setCategoriesVisibility ] = useState( false );
	const [ popoverVisibility, setPopoverVisibility ] = useState( false );
	const [ modalVisible, setModalVisible ] = useState( false );
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
	} = props;
	const { campaign_groups: campaignGroups, id, edit_link: editLink, title } = prompt;

	useEffect( () => {
		if ( modalVisible && ! duplicateTitle ) {
			getDefaultDupicateTitle();
		}
	}, [ modalVisible ] );

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
					<Fragment>
						<Button
							isQuaternary
							isSmall
							className={ categoriesVisibility && 'popover-active' }
							onClick={ () => setCategoriesVisibility( ! categoriesVisibility ) }
							icon={ settings }
							label={ __( 'Category filtering and campaigns', 'newspack' ) }
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
								setModalVisible={ setModalVisible }
								{ ...props }
							/>
						) }
						{ categoriesVisibility && (
							<SecondaryPromptPopover
								onFocusOutside={ () => setCategoriesVisibility( false ) }
								prompt={ prompt }
								segments={ segments }
								{ ...props }
							/>
						) }
					</Fragment>
				}
			/>
			{ modalVisible && (
				<Modal
					className="newspack-popups__duplicate-modal"
					title={ sprintf( __( 'Duplicate “%s”', 'newspack' ), title ) }
					onRequestClose={ () => {
						setModalVisible( false );
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
										setModalVisible( false );
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
										setModalVisible( false );
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
