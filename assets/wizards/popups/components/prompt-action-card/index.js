/**
 * Prompt Action Card
 */

/**
 * WordPress dependencies.
 */
import { sprintf, __ } from '@wordpress/i18n';
import { useEffect, useState, Fragment } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { moreVertical, settings } from '@wordpress/icons';

/**
 * Internal dependencies.
 */
import { ActionCard, Button, Modal, Notice, TextControl } from '../../../../components/src';
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
		prompts,
		segments,
		warning,
	} = props;
	const { campaign_groups: campaignGroups, id, edit_link: editLink, title } = prompt;

	useEffect( () => {
		setDuplicateTitle( getDefaultDupicateTitle() );
	}, [ prompts, title ] );

	const getDefaultDupicateTitle = () => {
		const promptToDuplicate = parseInt( prompt?.duplicate_of || prompt.id );
		const originalPrompt =
			prompts?.find( _prompt => parseInt( _prompt.id ) === promptToDuplicate ) || {};
		const baseTitle = sprintf( __( '%s copy' ), originalPrompt?.title || title );
		const existingDuplicates =
			prompts?.filter( _prompt => -1 < _prompt.title.indexOf( baseTitle ) ) || [];

		return (
			baseTitle + ( 0 < existingDuplicates.length ? ' ' + ( existingDuplicates.length + 1 ) : '' )
		);
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
						resetDuplicated();
						setModalVisible( false );
					} }
				>
					{ duplicated ? (
						<>
							<p>{ sprintf( __( 'Duplicate of “%s” created as a draft.', 'newspack' ), title ) }</p>
							{ ! campaignGroups && (
								<Notice
									isWarning
									noticeText={ __( 'The duplicate is currently unassigned.', 'newspack' ) }
								/>
							) }
							<div className="newspack-buttons-card">
								<Button
									isSecondary
									onClick={ () => {
										resetDuplicated();
										setModalVisible( false );
									} }
								>
									{ __( 'Close', 'newspack' ) }
								</Button>
								<Button isPrimary href={ `/wp-admin/post.php?post=${ duplicated }&action=edit` }>
									{ __( 'Edit', 'newspack' ) }
								</Button>
							</div>
						</>
					) : (
						<>
							<TextControl
								disabled={ inFlight }
								label={ __( 'New Title', 'newspack' ) }
								value={ duplicateTitle }
								onChange={ value => setDuplicateTitle( value ) }
							/>

							<div className="newspack-buttons-card">
								<Button
									disabled={ inFlight }
									isSecondary
									onClick={ () => {
										resetDuplicated();
										setModalVisible( false );
									} }
								>
									{ __( 'Cancel', 'newspack' ) }
								</Button>
								<Button
									disabled={ inFlight }
									isPrimary
									onClick={ () => {
										const titleForDuplicate = duplicateTitle.trim() || getDefaultDupicateTitle();
										duplicatePopup( id, titleForDuplicate );
									} }
								>
									{ __( 'Duplicate', 'newspack' ) }
								</Button>
							</div>
						</>
					) }
				</Modal>
			) }
		</>
	);
};
export default PromptActionCard;
